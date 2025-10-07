import { NextResponse } from "next/server";
import { countSubscriptions } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.SKIP_BUILD_STATIC_GENERATION === "true") {
    return NextResponse.json({ count: 0 });
  }
  
  const count = await countSubscriptions();
  return NextResponse.json({ count });
}