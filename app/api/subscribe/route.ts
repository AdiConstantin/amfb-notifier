import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addSubscription } from "@/lib/storage";
import { sendConfirmationEmail } from "@/lib/notify";

const schema = z.object({
  email: z.string().email().optional(), // Opțional, poate fi doar WhatsApp
  whatsapp: z.string().regex(/^\+?\d{8,15}$/).optional(), // Format E.164 
  teams: z.array(z.string()).min(1, "Selectează cel puțin o echipă")
}).refine(data => data.email || data.whatsapp, {
  message: "Trebuie să completezi cel puțin email sau WhatsApp"
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error('❌ Schema validation failed:', parsed.error);
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const id = data.email || data.whatsapp!; // ID-ul pentru storage (email sau WhatsApp)
  
  try {
    // Salvează abonamentul  
    await addSubscription(id, { ...data, createdAt: Date.now() });
    
    // Trimite email de confirmare dacă avem email și o cheie API validă
    let emailSent = false;
    
    if (data.email && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_') && process.env.RESEND_API_KEY.length > 10) {
      try {
        emailSent = await sendConfirmationEmail(data.email, data.teams);
      } catch (error) {
        console.error('❌ Email sending failed:', error);
      }
    }
    
    const confirmationType = data.email ? "email" : "WhatsApp";
    
    return NextResponse.json({ 
      ok: true, 
      message: emailSent ? 
        "✅ Abonare confirmată! Verifică emailul pentru confirmare." : 
        `✅ Abonare înregistrată cu succes pe ${confirmationType}! ${data.email ? "(Email de confirmare dezactivat temporar)" : ""}`
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: "Eroare la salvarea abonării" }, { status: 500 });
  }
}