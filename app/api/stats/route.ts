import { NextResponse } from "next/server";
import { countSubscriptions, listSubscriptions } from "@/lib/storage";

export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export async function GET() {
  if (process.env.SKIP_BUILD_STATIC_GENERATION === "true") {
    return NextResponse.json({ count: 0, subscribers: [] });
  }
  
  const count = await countSubscriptions();
  const subs = await listSubscriptions();
  
  const subscribers = Object.entries(subs).map(([email, sub]) => ({
    email: maskEmail(email),
    teams: sub.teams,
    createdAt: new Date(sub.createdAt).toLocaleDateString('ro-RO')
  }));
  
  return NextResponse.json({ 
    count,
    subscribers: subscribers.sort((a, b) => a.email.localeCompare(b.email))
  });
}