import { NextRequest, NextResponse } from "next/server";
import { removeSubscription } from "@/lib/storage";
import { sendUnsubscribeConfirmation } from "@/lib/notify";
import { z } from "zod";

const schema = z.object({ 
  id: z.string().min(1, "ID-ul nu poate fi gol") 
}); // Acceptă email sau WhatsApp

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error('❌ Unsubscribe schema validation failed:', parsed.error);
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const identifier = parsed.data.id; // Poate fi email sau WhatsApp
  
  try {
    // Șterge abonamentul
    await removeSubscription(identifier);
    
    // Trimite email de confirmare doar dacă identificatorul pare a fi un email
    let emailSent = false;
    const isEmail = identifier.includes('@');
    
    if (isEmail && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_') && process.env.RESEND_API_KEY.length > 10) {
      try {
        emailSent = await sendUnsubscribeConfirmation(identifier);
      } catch (error) {
        console.error('❌ Unsubscribe email sending failed:', error);
      }
    }
    const confirmationType = isEmail ? "email" : "WhatsApp";
    
    return NextResponse.json({ 
      ok: true, 
      message: emailSent ? 
        "✅ Dezabonare confirmată! Verifică emailul pentru confirmare." : 
        `✅ Dezabonare efectuată cu succes pe ${confirmationType}! ${isEmail ? "(Email de confirmare dezactivat temporar)" : ""}`
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: "Eroare la dezabonare" }, { status: 500 });
  }
}