import { NextResponse } from "next/server";
import { countSubscriptions } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await countSubscriptions();
  return NextResponse.json({ count });
}