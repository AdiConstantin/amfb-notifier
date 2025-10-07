import { NextRequest, NextResponse } from "next/server";
import { removeSubscription } from "@/lib/storage";
import { sendUnsubscribeConfirmation } from "@/lib/notify";
import { z } from "zod";

const schema = z.object({ id: z.string().email() }); // doar email pentru moment

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error('❌ Unsubscribe schema validation failed:', parsed.error);
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.id;
  
  try {
    // Șterge abonamentul
    await removeSubscription(email);
    
    // Trimite email de confirmare dezabonare
    let emailSent = false;
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_') && process.env.RESEND_API_KEY.length > 10) {
      try {
        emailSent = await sendUnsubscribeConfirmation(email);
      } catch (error) {
        console.error('❌ Unsubscribe email sending failed:', error);
      }
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: emailSent ? 
        "✅ Dezabonare confirmată! Verifică emailul pentru confirmare." : 
        "✅ Dezabonare efectuată cu succes! (Email de confirmare dezactivat temporar)"
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: "Eroare la dezabonare" }, { status: 500 });
  }
}