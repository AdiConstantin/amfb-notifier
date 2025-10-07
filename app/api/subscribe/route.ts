import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addSubscription } from "@/lib/storage";
import { sendConfirmationEmail } from "@/lib/notify";

const schema = z.object({
  email: z.string().email("Email invalid"),
  teams: z.array(z.string()).min(1, "Selectează cel puțin o echipă")
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error('❌ Schema validation failed:', parsed.error);
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  
  try {
    await addSubscription(data.email, { ...data, createdAt: Date.now() });
    
    let emailSent = false;
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
      try {
        emailSent = await sendConfirmationEmail(data.email, data.teams);
      } catch (error) {
        console.error('❌ Email sending failed:', error);
      }
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: emailSent ? 
        "✅ Abonare confirmată! Verifică emailul pentru confirmare." : 
        "✅ Abonare înregistrată cu succes!"
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: "Eroare la salvarea abonării" }, { status: 500 });
  }
}