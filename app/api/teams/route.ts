import { NextResponse } from "next/server";
import { discoverTeams } from "@/lib/scrape";

export const dynamic = "force-dynamic";

export async function GET() {
  // Skip execution during build time
  if (process.env.SKIP_BUILD_STATIC_GENERATION === "true") {
    return NextResponse.json([]);
  }
  
  console.log('Teams API called');
  try {
    const teams = await discoverTeams();
    console.log('Teams discovered:', teams);
    console.log('Number of teams:', teams.length);
    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Error in teams API:', error);
    return NextResponse.json({ error: 'Failed to fetch teams', teams: [] }, { status: 500 });
  }
}