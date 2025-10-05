import { Resend } from "resend";
import twilio from "twilio";
import { Fixture, Subscription } from "./types";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const twilioClient = (process.env.TWILIO_SID && process.env.TWILIO_TOKEN)
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
  : null;

export async function sendConfirmationEmail(to: string, teams: string[]) {
  if (!resend) {
    console.log('❌ Resend not configured');
    return false;
  }
  
  const subject = `[AMFB] Confirmare abonare - Notificări program`;
  const teamsList = teams.join(", ");
  const body = `Salut!

Abonarea ta la notificările AMFB a fost înregistrată cu succes!

Echipele pentru care vei primi notificări: ${teamsList}

Vei fi notificat când se schimbă programul pentru aceste echipe.

Pentru a te dezabona, accesează: https://amfb.adrianconstantin.ro

Mulțumim!
Echipa AMFB Notifier`;

  try {
    console.log('📧 Sending email to:', to);
    console.log('📧 From:', process.env.RESEND_FROM);
    console.log('📧 API Key exists:', !!process.env.RESEND_API_KEY);
    console.log('📧 Teams:', teams);
    
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || "AMFB Notifier <onboarding@resend.dev>",
      to,
      subject,
      text: body
    });
    
    console.log('✅ Email API response:', JSON.stringify(result, null, 2));
    
    // Check if result indicates success
    if (result && result.data && result.data.id) {
      console.log('✅ Email sent successfully with ID:', result.data.id);
      return true;
    } else {
      console.error('⚠️ Unexpected email response:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

export async function sendUnsubscribeConfirmation(to: string) {
  if (!resend) {
    console.log('❌ Resend not configured');
    return false;
  }
  
  const subject = `[AMFB] Confirmare dezabonare - Notificări program`;
  const body = `Salut!

Dezabonarea ta de la notificările AMFB a fost efectuată cu succes.

Nu vei mai primi notificări despre schimbările programului de minifotbal.

Dacă te-ai dezabonat din greșeală, poți să te abonezi din nou accesând:
https://amfb.adrianconstantin.ro

Mulțumim că ai folosit serviciul nostru!
Echipa AMFB Notifier`;

  try {
    console.log('📧 Sending unsubscribe confirmation to:', to);
    console.log('📧 From:', process.env.RESEND_FROM);
    
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || "AMFB Notifier <notify@amfb.adrianconstantin.ro>",
      to,
      subject,
      text: body
    });
    
    console.log('✅ Unsubscribe email API response:', JSON.stringify(result, null, 2));
    
    if (result && result.data && result.data.id) {
      console.log('✅ Unsubscribe email sent successfully with ID:', result.data.id);
      return true;
    } else {
      console.error('⚠️ Unexpected unsubscribe email response:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to send unsubscribe email:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

export async function notifyEmail(to: string, team: string, changes: Fixture[]) {
  if (!resend) return;
  const subject = `[AMFB] Program actualizat pentru ${team}`;
  const body = changes.map(f => `• ${team} vs ${f.opponent} - ${new Date(f.dateISO).toLocaleString("ro-RO")}`).join("\n");
  await resend.emails.send({
    from: process.env.RESEND_FROM || "AMFB Notifier <notify@adrianconstantin.ro>",
    to,
    subject,
    text: `S-au detectat schimbări:\n${body}\n\nLink: https://amfb.ro/competitii/campionat-minifotbal/grupa-2013-albastru/`
  });
}

// WhatsApp temporar dezactivat
/*
export async function notifyWhatsApp(to: string, team: string, changes: Fixture[]) {
  if (!twilioClient || !process.env.TWILIO_WHATSAPP_FROM) return;
  const lines = changes.map(f => `• ${team} vs ${f.opponent} - ${new Date(f.dateISO).toLocaleString("ro-RO")}`).join("\n");
  await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${to}`,
    body: `Program AMFB actualizat pentru ${team}:\n${lines}\n\nPagina: amfb.ro/competitii/campionat-minifotbal/grupa-2014-galben/`
  });
}
*/

export async function notifyAll(subs: Record<string, Subscription>, changesByTeam: Record<string, Fixture[]>) {
  for (const [, sub] of Object.entries(subs)) {
    for (const team of sub.teams) {
      const changes = changesByTeam[team];
      if (!changes?.length) continue;
      if (sub.email) await notifyEmail(sub.email, team, changes);
      // WhatsApp temporar dezactivat
      // if (sub.whatsapp) await notifyWhatsApp(sub.whatsapp, team, changes);
    }
  }
}