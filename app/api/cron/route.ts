import { NextResponse } from "next/server";
import { fetchFixtures } from "@/lib/scrape";
import {
  getLastFixtures,
  setLastFixtures,
  listSubscriptions,
  getLastFixturesFull,
  setLastFixturesFull,
} from "@/lib/storage";
import { notifyAll, sendCronStatusEmail } from "@/lib/notify";
import { selectionKey } from "@/lib/config";
import type { Fixture, FixtureDiff } from "@/lib/types";

export const dynamic = "force-dynamic";

function buildDiff(prev: Fixture[], curr: Fixture[]): FixtureDiff[] {
  const diffs: FixtureDiff[] = [];
  const byDatePrev = new Map(
    prev.filter((x) => x.dateISO).map((x) => [x.dateISO, x] as const)
  );
  const byDateCurr = new Map(
    curr.filter((x) => x.dateISO).map((x) => [x.dateISO, x] as const)
  );

  for (const [date, c] of byDateCurr) {
    const p = byDatePrev.get(date);
    if (p && p.opponent !== c.opponent)
      diffs.push({ type: "opponent_changed", previous: p, current: c });
  }

  const byOppPrev = new Map(prev.map((x) => [x.opponent + "|" + x.team, x] as const));
  const byOppCurr = new Map(curr.map((x) => [x.opponent + "|" + x.team, x] as const));
  for (const [key, c] of byOppCurr) {
    const p = byOppPrev.get(key);
    if (p && p.dateISO !== c.dateISO)
      diffs.push({ type: "time_changed", previous: p, current: c });
  }

  const prevHashes = new Set(prev.map((x) => x.hash));
  const currHashes = new Set(curr.map((x) => x.hash));
  for (const c of curr) if (!prevHashes.has(c.hash)) diffs.push({ type: "added", current: c });
  for (const p of prev) if (!currHashes.has(p.hash)) diffs.push({ type: "removed", previous: p });

  return diffs;
}

export async function GET() {
  if (process.env.SKIP_BUILD_STATIC_GENERATION === "true") {
    return NextResponse.json({ ok: true, message: "Build time - skipped execution" });
  }

  const subs = await listSubscriptions();
  const totalSubscribers = Object.keys(subs).length;
  const adminEmail =
    process.env.ADMIN_EMAIL ||
    Object.values(subs)[0]?.email ||
    "adi@adrianconstantin.ro";

  // Collect unique (groupId, team) pairs
  const pairMap = new Map<string, { groupId: string; team: string }>();
  for (const sub of Object.values(subs)) {
    for (const sel of sub.selections) {
      for (const team of sel.teams) {
        const key = selectionKey(sel.groupId, team);
        pairMap.set(key, { groupId: sel.groupId, team });
      }
    }
  }

  const pairs = Array.from(pairMap.values());
  const keysChecked = Array.from(pairMap.keys());

  if (pairs.length === 0) {
    const emailSent = await sendCronStatusEmail(adminEmail, [], {}, totalSubscribers);
    return NextResponse.json({
      ok: true,
      message: "No subscribers yet.",
      adminEmail,
      emailSent,
      adminNotified: emailSent,
    });
  }

  // Scrape per group
  const byGroup = new Map<string, string[]>();
  for (const { groupId, team } of pairs) {
    const list = byGroup.get(groupId) ?? [];
    list.push(team);
    byGroup.set(groupId, list);
  }

  const latestByKey: Record<string, Fixture[]> = {};
  for (const [groupId, teams] of byGroup) {
    const uniqueTeams = [...new Set(teams)];
    const latest = await fetchFixtures(groupId, uniqueTeams);
    for (const team of uniqueTeams) {
      latestByKey[selectionKey(groupId, team)] = latest[team] ?? [];
    }
  }

  const lastHashes = await getLastFixtures();
  const lastFull = await getLastFixturesFull();

  const changesByKey: Record<string, Fixture[]> = {};
  const diffsByKey: Record<string, FixtureDiff[]> = {};
  const nextLastHashes: Record<string, string[]> = {};
  const nextLastFull: Record<string, Fixture[]> = {};
  const changesCount: Record<string, number> = {};

  for (const key of keysChecked) {
    const fixtures = latestByKey[key] ?? [];
    const hashes = fixtures.map((f) => f.hash);
    // Prefer group-keyed history; fall back to legacy team-only key (pre multi-group)
    const legacyTeam = key.includes("::") ? key.slice(key.indexOf("::") + 2) : key;
    const prevHashes = new Set(lastHashes[key] ?? lastHashes[legacyTeam] ?? []);
    const prevFull = lastFull[key] ?? lastFull[legacyTeam] ?? [];

    const basicDiff = fixtures.filter((f) => !prevHashes.has(f.hash));
    const smartDiff = buildDiff(prevFull, fixtures);

    if (basicDiff.length || smartDiff.length) {
      const toNotifyHashes = new Set<string>();
      for (const d of smartDiff) {
        if (d.type === "added" || d.type === "time_changed" || d.type === "opponent_changed") {
          toNotifyHashes.add(d.current.hash);
        }
      }
      const map = new Map(fixtures.map((x) => [x.hash, x] as const));
      changesByKey[key] = Array.from(toNotifyHashes)
        .map((h) => map.get(h)!)
        .filter(Boolean);
      diffsByKey[key] = smartDiff;
      changesCount[key] = smartDiff.length;
    }

    nextLastHashes[key] = hashes;
    nextLastFull[key] = fixtures;
  }

  await notifyAll(subs, changesByKey, nextLastFull);
  await setLastFixtures(nextLastHashes);
  await setLastFixturesFull(nextLastFull);
  await sendCronStatusEmail(adminEmail, keysChecked, changesCount, totalSubscribers);

  return NextResponse.json({
    ok: true,
    keys: keysChecked,
    changes: Object.keys(changesByKey).length,
    diffsByKey,
    adminNotified: true,
  });
}
