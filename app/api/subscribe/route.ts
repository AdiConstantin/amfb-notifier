import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { upsertSubscriptionMergingGroups } from "@/lib/storage";
import { sendConfirmationEmail } from "@/lib/notify";
import { getGroup } from "@/lib/config";

const schema = z.object({
  email: z.string().email("Email invalid"),
  selections: z
    .array(
      z.object({
        groupId: z.string().min(1),
        teams: z.array(z.string()).min(1),
      })
    )
    .min(1, "Selectează cel puțin o echipă"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    console.error("❌ Schema validation failed:", parsed.error);
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  for (const sel of parsed.data.selections) {
    if (!getGroup(sel.groupId)) {
      return NextResponse.json({ error: `Grupă invalidă: ${sel.groupId}` }, { status: 400 });
    }
  }

  try {
    // Merge by groupId: submitted groups overwrite; other groups kept
    // (legacy { teams } → 2014-seria1 on read, so current subscribers stay intact)
    const saved = await upsertSubscriptionMergingGroups(
      parsed.data.email,
      parsed.data.selections
    );

    let emailSent = false;
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_")) {
      try {
        emailSent = await sendConfirmationEmail(parsed.data.email, saved);
      } catch (error) {
        console.error("❌ Email sending failed:", error);
      }
    }

    return NextResponse.json({
      ok: true,
      message: emailSent
        ? "✅ Abonare confirmată! Verifică emailul pentru confirmare."
        : "✅ Abonare înregistrată cu succes!",
      selections: saved.selections,
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Eroare la salvarea abonării" }, { status: 500 });
  }
}
