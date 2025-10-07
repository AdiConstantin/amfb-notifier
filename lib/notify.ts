import { Resend } from "resend";
import { Fixture, Subscription } from "./types";
import { AMFB_PAGE_URL } from "./config";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendConfirmationEmail(to: string, teams: string[]) {
  if (!resend) return false;
  
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || "AMFB Notifier <onboarding@resend.dev>",
      to,
      subject: "[AMFB] Confirmare abonare - Notificări program",
      text: `Salut!

Abonarea ta la notificările AMFB a fost înregistrată cu succes!

Echipele pentru care vei primi notificări: ${teams.join(", ")}

Vei fi notificat când se schimbă programul pentru aceste echipe.

Pentru a te dezabona, accesează: https://amfb.adrianconstantin.ro

Mulțumim!
Echipa AMFB Notifier`
    });
    
    return !!(result?.data?.id);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    return false;
  }
}

export async function sendUnsubscribeConfirmation(to: string) {
  if (!resend) return false;
  
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || "AMFB Notifier <notify@amfb.adrianconstantin.ro>",
      to,
      subject: "[AMFB] Confirmare dezabonare - Notificări program", 
      text: `Salut!

Dezabonarea ta de la notificările AMFB a fost efectuată cu succes.

Nu vei mai primi notificări despre schimbările programului de minifotbal.

Dacă te-ai dezabonat din greșeală, poți să te abonezi din nou accesând:
https://amfb.adrianconstantin.ro

Mulțumim că ai folosit serviciul nostru!
Echipa AMFB Notifier`
    });
    
    return !!(result?.data?.id);
  } catch (error) {
    console.error('Failed to send unsubscribe email:', error);
    return false;
  }
}

export async function notifyEmail(to: string, team: string, changes: Fixture[], allFixtures: Fixture[]) {
  if (!resend) return;
  
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()));
  nextSunday.setHours(0, 0, 0, 0);
  
  const nextSundayEnd = new Date(nextSunday);
  nextSundayEnd.setHours(23, 59, 59, 999);
  
  const nextMatch = allFixtures.find(f => {
    const matchDate = new Date(f.dateISO);
    return matchDate >= nextSunday && matchDate <= nextSundayEnd;
  });
  
  let subject, body;
  
  if (changes.length > 0) {
    subject = `[AMFB] Program actualizat pentru ${team}`;
    const changesText = changes.map(f => 
      ` ${team} vs ${f.opponent} - ${new Date(f.dateISO).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}`
    ).join("\n");
    body = `S-au detectat schimbări în programul pentru ${team}:\n\n${changesText}\n\n`;
  } else {
    subject = `[AMFB] Confirmare program ${team} - Fără modificări`;
    body = `Bună! \n\nProgramul pentru ${team} a fost verificat și nu s-au găsit modificări.\n\n`;
  }
  
  if (nextMatch) {
    const matchDate = new Date(nextMatch.dateISO).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" });
    body += ` URMĂTORUL MECI:\n ${team} vs ${nextMatch.opponent} - ${matchDate}\n\n`;
  }
  
  body += `Pentru programul complet: ${AMFB_PAGE_URL}\n\n`;
  body += `Notificările sunt trimise zilnic la 17:00. Pentru dezabonare, accesează https://amfb.adrianconstantin.ro/`;
  
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "AMFB Notifier <notify@adrianconstantin.ro>",
      to,
      subject,
      text: body
    });
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }
}

export async function sendCronStatusEmail(
  adminEmail: string, 
  teamsChecked: string[], 
  changesFound: Record<string, number>, 
  totalSubscribers: number
) {
  if (!resend) return false;

  const hasChanges = Object.keys(changesFound).length > 0;
  const subject = hasChanges 
    ? `[AMFB] Cron Success  - ${Object.keys(changesFound).length} echipe cu schimbări`
    : `[AMFB] Cron Success  - Nicio schimbare detectată`;

  let body = `Cronul AMFB a rulat cu succes la ${new Date().toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}\n\n`;
  
  body += ` STATISTICI:\n`;
  body += ` Echipe verificate: ${teamsChecked.length} (${teamsChecked.join(", ")})\n`;
  body += ` Abonați activi: ${totalSubscribers}\n`;
  body += ` Echipe cu schimbări: ${Object.keys(changesFound).length}\n\n`;

  if (hasChanges) {
    body += ` SCHIMBĂRI DETECTATE:\n`;
    for (const [team, count] of Object.entries(changesFound)) {
      body += ` ${team}: ${count} modificări\n`;
    }
    body += `\n Notificări trimise către abonați.\n`;
  } else {
    body += ` FĂRĂ SCHIMBĂRI\n`;
    body += `Toate echipele au același program ca la ultima verificare.\n`;
    body += `Sistemul funcționează normal și monitorizează în continuare.\n`;
  }

  body += `\n Link: https://amfb.adrianconstantin.ro\n`;
  body += ` Status: https://amfb.adrianconstantin.ro/api/stats`;

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || "AMFB Notifier <notify@amfb.adrianconstantin.ro>",
      to: adminEmail,
      subject,
      text: body
    });
    
    return !!(result?.data?.id);
  } catch (error) {
    console.error('Failed to send cron status email:', error);
    return false;
  }
}

export async function notifyAll(
  subs: Record<string, Subscription>, 
  changesByTeam: Record<string, Fixture[]>,
  allFixturesByTeam: Record<string, Fixture[]>
) {
  for (const sub of Object.values(subs)) {
    for (const team of sub.teams) {
      const changes = changesByTeam[team] || [];
      const allFixtures = allFixturesByTeam[team] || [];
      
      await notifyEmail(sub.email, team, changes, allFixtures);
    }
  }
}
