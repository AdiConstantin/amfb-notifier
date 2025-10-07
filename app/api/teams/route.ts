import { NextResponse } from "next/server";
import { discoverTeams } from "@/lib/scrape";

export const dynamic = "force-dynamic";

export async function GET() {
  // Skip execution during build time
  if (process.env.SKIP_BUILD_STATIC_GENERATION === "true") {
    return NextResponse.json([]);
  }
  
  try {
    const teams = await discoverTeams();
    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Error in teams API:', error);
    return NextResponse.json({ error: 'Failed to fetch teams', teams: [] }, { status: 500 });
  }
}