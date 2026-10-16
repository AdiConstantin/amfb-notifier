import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchFixtures } from "@/lib/scrape";
import { getWeatherForMatch } from "@/lib/weather";
import { getGroup } from "@/lib/config";
import type { Fixture, MatchWeather } from "@/lib/types";

export const dynamic = "force-dynamic";

const schema = z.object({
  selections: z
    .array(
      z.object({
        groupId: z.string().min(1),
        teams: z.array(z.string()).min(1),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  if (process.env.SKIP_BUILD_STATIC_GENERATION === "true") {
    return NextResponse.json({ fixtures: [], weatherByHash: {} });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const collected: Fixture[] = [];

    for (const sel of parsed.data.selections) {
      if (!getGroup(sel.groupId)) continue;
      const latest = await fetchFixtures(sel.groupId, sel.teams);
      for (const team of sel.teams) {
        for (const f of latest[team] ?? []) {
          if (!f.dateISO) continue;
          collected.push({ ...f, groupId: sel.groupId });
        }
      }
    }

    if (collected.length === 0) {
      return NextResponse.json({ fixtures: [], weatherByHash: {} });
    }

    // Next match day PER GROUP so 2014 (Sat) doesn't hide 2015 (Sun)
    const byGroup = new Map<string, Fixture[]>();
    for (const f of collected) {
      const gid = f.groupId ?? "";
      const list = byGroup.get(gid) ?? [];
      list.push(f);
      byGroup.set(gid, list);
    }

    const sameDay: Fixture[] = [];
    const groupDates: string[] = [];
    for (const [, fixtures] of byGroup) {
      const earliest = fixtures
        .map((f) => f.dateISO.slice(0, 10))
        .sort((a, b) => a.localeCompare(b))[0];
      groupDates.push(earliest);
      sameDay.push(...fixtures.filter((f) => f.dateISO.startsWith(earliest)));
    }

    // Dedup A vs B / B vs A same kickoff (scoped by group)
    const dedup = new Map<string, Fixture>();
    for (const f of sameDay) {
      const pair = [f.team, f.opponent].map((x) => x.toLowerCase()).sort();
      const key = `${f.groupId}|${f.dateISO}|${pair[0]}|${pair[1]}`;
      if (!dedup.has(key)) dedup.set(key, f);
    }

    const fixtures = Array.from(dedup.values()).sort((a, b) =>
      a.dateISO.localeCompare(b.dateISO)
    );
    const earliestDate = groupDates.sort((a, b) => a.localeCompare(b))[0];

    const weatherByHash: Record<string, MatchWeather | null> = {};
    await Promise.all(
      fixtures.map(async (f) => {
        const g = f.groupId ? getGroup(f.groupId) : undefined;
        weatherByHash[f.hash] = await getWeatherForMatch(
          f.dateISO,
          g ? { venue: g.venue, lat: g.lat, lon: g.lon } : undefined
        );
      })
    );

    return NextResponse.json({
      fixtures,
      date: earliestDate,
      weatherByHash,
    });
  } catch (error) {
    console.error("❌ fixtures-preview error:", error);
    return NextResponse.json(
      { error: "Failed to compute fixtures preview", fixtures: [], weatherByHash: {} },
      { status: 500 }
    );
  }
}
