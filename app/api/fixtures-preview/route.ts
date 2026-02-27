import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchFixtures } from "@/lib/scrape";
import type { Fixture } from "@/lib/types";

export const dynamic = "force-dynamic";

const schema = z.object({
  teams: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  if (process.env.SKIP_BUILD_STATIC_GENERATION === "true") {
    return NextResponse.json({ fixtures: [] });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { teams } = parsed.data;

  try {
    const latest = await fetchFixtures(teams);

    const all: { fixture: Fixture; dateKey: string }[] = [];

    for (const team of teams) {
      for (const f of latest[team] ?? []) {
        if (!f.dateISO) continue;
        const dateKey = f.dateISO.slice(0, 10); // YYYY-MM-DD
        all.push({ fixture: f, dateKey });
      }
    }

    if (all.length === 0) {
      return NextResponse.json({ fixtures: [] });
    }

    // Găsește cea mai apropiată zi de joc (următoarea etapă)
    const earliestDate = all
      .map((x) => x.dateKey)
      .sort((a, b) => a.localeCompare(b))[0];

    const sameRound = all
      .filter((x) => x.dateKey === earliestDate)
      .map((x) => x.fixture);

    // Elimină dublurile indiferent de ordine (A vs B == B vs A)
    const dedup = new Map<string, Fixture>();
    for (const f of sameRound) {
      const pair = [f.team, f.opponent].map((x) => x.toLowerCase()).sort();
      const key = `${f.dateISO}|${pair[0]}|${pair[1]}`;
      if (!dedup.has(key)) {
        dedup.set(key, f);
      }
    }

    const fixtures = Array.from(dedup.values()).sort((a, b) =>
      a.dateISO.localeCompare(b.dateISO)
    );

    return NextResponse.json({ fixtures, date: earliestDate });
  } catch (error) {
    console.error("❌ fixtures-preview error:", error);
    return NextResponse.json(
      { error: "Failed to compute fixtures preview", fixtures: [] },
      { status: 500 }
    );
  }
}

