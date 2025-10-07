import { NextResponse } from "next/server";
import { fetchFixtures } from "@/lib/scrape";
import { getLastFixtures, setLastFixtures, listSubscriptions, getLastFixturesFull, setLastFixturesFull } from "@/lib/storage";
import { notifyAll, sendCronStatusEmail } from "@/lib/notify";
import type { Fixture, FixtureDiff } from "@/lib/types";

export const dynamic = "force-dynamic";

function buildDiff(prev: Fixture[], curr: Fixture[]): FixtureDiff[] {
  const diffs: FixtureDiff[] = [];
  const byDatePrev = new Map(prev.filter(x=>x.dateISO).map(x=>[x.dateISO, x] as const));
  const byDateCurr = new Map(curr.filter(x=>x.dateISO).map(x=>[x.dateISO, x] as const));

  // opponent change: same date
  for (const [date, c] of byDateCurr) {
    const p = byDatePrev.get(date);
    if (p && p.opponent !== c.opponent) diffs.push({ type: "opponent_changed", previous: p, current: c });
  }

  // time change: same opponent
  const byOppPrev = new Map(prev.map(x=>[x.opponent+"|"+x.team, x] as const));
  const byOppCurr = new Map(curr.map(x=>[x.opponent+"|"+x.team, x] as const));
  for (const [key, c] of byOppCurr) {
    const p = byOppPrev.get(key);
    if (p && p.dateISO !== c.dateISO) diffs.push({ type: "time_changed", previous: p, current: c });
  }

  // added / removed
  const prevHashes = new Set(prev.map(x=>x.hash));
  const currHashes = new Set(curr.map(x=>x.hash));
  for (const c of curr) if (!prevHashes.has(c.hash)) diffs.push({ type: "added", current: c });
  for (const p of prev) if (!currHashes.has(p.hash)) diffs.push({ type: "removed", previous: p });

  return diffs;
}

export async function GET() {
  // Skip execution during build time
  if (process.env.SKIP_BUILD_STATIC_GENERATION === "true") {
    return NextResponse.json({ ok: true, message: "Build time - skipped execution" });
  }
  
  const subs = await listSubscriptions();
  const allTeams = Array.from(new Set(Object.values(subs).flatMap(s => s.teams)));
  const totalSubscribers = Object.keys(subs).length;
  
  // Email admin pentru status (folosește prima adresă disponibilă sau o configurată)
  const adminEmail = process.env.ADMIN_EMAIL || Object.values(subs)[0]?.email || "adi@adrianconstantin.ro";
  
  if (allTeams.length === 0) {
    const emailSent = await sendCronStatusEmail(adminEmail, [], {}, totalSubscribers);
    return NextResponse.json({ 
      ok: true, 
      message: "No subscribers yet.", 
      adminEmail: adminEmail,
      emailSent: emailSent,
      adminNotified: emailSent,
      debug: {
        totalSubscribers: totalSubscribers,
        subsKeys: Object.keys(subs),
        allTeams: allTeams,
        subsData: subs
      }
    });
  }

  const latest = await fetchFixtures(allTeams);
  const lastHashes = await getLastFixtures();
  const lastFull = await getLastFixturesFull();

  const changesByTeam: Record<string, Fixture[]> = {};
  const diffsByTeam: Record<string, FixtureDiff[]> = {};
  const nextLastHashes: Record<string, string[]> = {};
  const nextLastFull: Record<string, Fixture[]> = {};
  const changesCount: Record<string, number> = {};

  for (const team of allTeams) {
    const fixtures = latest[team] ?? [];
    const hashes = fixtures.map(f => f.hash);
    const prevHashes = new Set(lastHashes[team] ?? []);
    const prevFull = lastFull[team] ?? [];

    // Debug temporar
    console.log(`🔍 [${team}] Current fixtures:`, fixtures.map(f => `${f.opponent} ${f.dateISO} hash:${f.hash.substring(0,8)}`));
    console.log(`🔍 [${team}] Previous hashes:`, Array.from(prevHashes).map(h => h.substring(0,8)));
    console.log(`🔍 [${team}] Previous full:`, prevFull.map(f => `${f.opponent} ${f.dateISO} hash:${f.hash.substring(0,8)}`));

    const basicDiff = fixtures.filter(f => !prevHashes.has(f.hash));
    const smartDiff = buildDiff(prevFull, fixtures);

    if (basicDiff.length || smartDiff.length) {
      const toNotifyHashes = new Set<string>();
      for (const d of smartDiff) {
        if (d.type === "added" || d.type === "time_changed" || d.type === "opponent_changed") {
          toNotifyHashes.add(d.type === "added" ? d.current.hash : d.current.hash);
        }
      }
      const map = new Map(fixtures.map(x=>[x.hash,x] as const));
      changesByTeam[team] = Array.from(toNotifyHashes).map(h => map.get(h)!).filter(Boolean);
      diffsByTeam[team] = smartDiff;
      changesCount[team] = smartDiff.length;
    }

    nextLastHashes[team] = hashes;
    nextLastFull[team] = fixtures;
  }

  // Trimite notificări către abonați doar dacă sunt schimbări
  if (Object.keys(changesByTeam).length) {
    await notifyAll(subs, changesByTeam);
    await setLastFixtures(nextLastHashes);
    await setLastFixturesFull(nextLastFull);
  }

  // Trimite ÎNTOTDEAUNA email de status către admin
  const emailResult = await sendCronStatusEmail(adminEmail, allTeams, changesCount, totalSubscribers);

  return NextResponse.json({ 
    ok: true, 
    teams: allTeams, 
    changes: Object.keys(changesByTeam).length, 
    diffsByTeam,
    adminNotified: true 
  });
}