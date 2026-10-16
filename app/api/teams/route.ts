import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { discoverTeams } from "@/lib/scrape";
import { AMFB_GROUPS, getGroup } from "@/lib/config";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  groupId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  if (process.env.SKIP_BUILD_STATIC_GENERATION === "true") {
    return NextResponse.json({ teams: [], groups: AMFB_GROUPS.map(summarizeGroup) });
  }

  const groupId = req.nextUrl.searchParams.get("groupId") ?? "";
  const parsed = querySchema.safeParse({ groupId });

  if (!parsed.success || !getGroup(parsed.data.groupId)) {
    return NextResponse.json(
      {
        error: "groupId invalid",
        groups: AMFB_GROUPS.map(summarizeGroup),
        teams: [],
      },
      { status: 400 }
    );
  }

  try {
    const teams = await discoverTeams(parsed.data.groupId);
    return NextResponse.json({
      groupId: parsed.data.groupId,
      teams,
      groups: AMFB_GROUPS.map(summarizeGroup),
    });
  } catch (error) {
    console.error("Error in teams API:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams", teams: [], groups: AMFB_GROUPS.map(summarizeGroup) },
      { status: 500 }
    );
  }
}

function summarizeGroup(g: (typeof AMFB_GROUPS)[number]) {
  return {
    id: g.id,
    label: g.label,
    shortLabel: g.shortLabel,
    venue: g.venue,
    matchDay: g.matchDay,
    pageUrl: g.pageUrl,
    defaultTeam: g.defaultTeam,
  };
}
