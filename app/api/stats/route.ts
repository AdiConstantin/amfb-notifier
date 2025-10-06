import { NextResponse } from "next/server";
import { countSubscriptions, listSubscriptions } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  // Skip execution during build time
  if (process.env.SKIP_BUILD_STATIC_GENERATION === "true") {
    return NextResponse.json({ count: 0 });
  }
  
  const count = await countSubscriptions();
  const subs = await listSubscriptions();
  
  return NextResponse.json({ 
    count,
    debug: {
      subsKeys: Object.keys(subs),
      subsData: subs
    }
  });
}