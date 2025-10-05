import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addSubscription } from "@/lib/storage";
import { sendConfirmationEmail } from "@/lib/notify";

const schema = z.object({
  email: z.string().email(), // Required, nu mai e optional
  // WhatsApp temporar dezactivat
  // whatsapp: z.string().regex(/^\+?\d{8,15}$/).optional(),
  teams: z.array(z.string()).min(1, "Selectează cel puțin o echipă")
}); // Doar email pentru moment, fără refine

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('📥 Received subscription request:', body);
  
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error('❌ Schema validation failed:', parsed.error);
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  console.log('✅ Parsed data:', data);
  const id = data.email!; // Doar email pentru moment
  
  try {
    // Salvează abonamentul  
    await addSubscription(id, { ...data, createdAt: Date.now() });
    
    // Trimite email de confirmare dacă avem o cheie API validă
    let emailSent = false;
    console.log('🔑 API Key check:', {
      exists: !!process.env.RESEND_API_KEY,
      startsWithRe: process.env.RESEND_API_KEY?.startsWith('re_'),
      length: process.env.RESEND_API_KEY?.length,
      key: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'none'
    });
    
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_') && process.env.RESEND_API_KEY.length > 10) {
      console.log('✅ Attempting to send email...');
      try {
        emailSent = await sendConfirmationEmail(data.email, data.teams);
        console.log('📧 Email send result:', emailSent);
      } catch (error) {
        console.error('❌ Email sending failed:', error);
      }
    } else {
      console.log('❌ Resend API key not configured properly');
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: emailSent ? 
        "✅ Abonare confirmată! Verifică emailul pentru confirmare." : 
        "✅ Abonare înregistrată cu succes! (Email de confirmare dezactivat temporar)"
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: "Eroare la salvarea abonării" }, { status: 500 });
  }
}