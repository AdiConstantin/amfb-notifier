import { Resend } from "resend";
import { getGroup, selectionKey } from "./config";
import { Fixture, Subscription } from "./types";
import { formatWeatherText, getWeatherForMatch } from "./weather";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function formatSelections(sub: Subscription): string {
  return sub.selections
    .map((s) => {
      const g = getGroup(s.groupId);
      const label = g?.label ?? s.groupId;
      return `${label}: ${s.teams.join(", ")}`;
    })
    .join("\n");
}

export async function sendConfirmationEmail(to: string, sub: Subscription) {
  if (!resend) return false;

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || "AMFB Notifier <onboarding@resend.dev>",
      to,
      subject: "[AMFB] Confirmare abonare - Notificări program",
      text: `Salut!

Abonarea ta la notificările AMFB a fost înregistrată cu succes!

Urmărești:
${formatSelections(sub)}

Vei fi notificat când se schimbă programul pentru aceste echipe.

Pentru a te dezabona, accesează: https://amfb.adrianconstantin.ro

Mulțumim!
Echipa AMFB Notifier`,
    });

    return !!(result?.data?.id);
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
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
Echipa AMFB Notifier`,
    });

    return !!(result?.data?.id);
  } catch (error) {
    console.error("Failed to send unsubscribe email:", error);
    return false;
  }
}

export async function notifyEmail(
  to: string,
  groupId: string,
  team: string,
  changes: Fixture[],
  allFixtures: Fixture[]
) {
  if (!resend) return;

  const group = getGroup(groupId);
  const groupLabel = group?.label ?? groupId;
  const pageUrl = group?.pageUrl ?? "https://amfb.adrianconstantin.ro";
  const now = new Date();

  const nextMatch = [...allFixtures]
    .filter((f) => f.dateISO && new Date(f.dateISO) >= now)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0];

  let subject: string;
  let body: string;

  if (changes.length > 0) {
    subject = `[AMFB] ${groupLabel}: program actualizat - ${team}`;
    const changesText = changes
      .map(
        (f) =>
          ` ${team} vs ${f.opponent} - ${new Date(f.dateISO).toLocaleString("ro-RO", {
            timeZone: "Europe/Bucharest",
          })}`
      )
      .join("\n");
    body = `S-au detectat schimbări în programul pentru ${team} (${groupLabel}):\n\n${changesText}\n\n`;
  } else {
    subject = `[AMFB] ${groupLabel}: ${team} - fără modificări`;
    body = `Bună!\n\nProgramul pentru ${team} (${groupLabel}) a fost verificat și nu s-au găsit modificări.\n\n`;
  }

  if (nextMatch) {
    const matchDate = new Date(nextMatch.dateISO).toLocaleString("ro-RO", {
      timeZone: "Europe/Bucharest",
    });
    const location = nextMatch.location ? ` @ ${nextMatch.location}` : "";
    body += `URMĂTORUL MECI:\n${team} vs ${nextMatch.opponent} - ${matchDate}${location}\n\n`;

    const weather = await getWeatherForMatch(
      nextMatch.dateISO,
      group
        ? { venue: group.venue, lat: group.lat, lon: group.lon }
        : undefined
    );
    if (weather) {
      body += `${formatWeatherText(weather)}\n\n`;
    }
  } else {
    body += `Nu există meciuri viitoare programate pentru ${team}.\n\n`;
  }

  body += `Pentru programul complet: ${pageUrl}\n\n`;
  body += `Notificările sunt trimise zilnic la 17:00. Pentru dezabonare, accesează https://amfb.adrianconstantin.ro/`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "AMFB Notifier <notify@adrianconstantin.ro>",
      to,
      subject,
      text: body,
    });
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
}

export async function sendCronStatusEmail(
  adminEmail: string,
  keysChecked: string[],
  changesFound: Record<string, number>,
  totalSubscribers: number
) {
  if (!resend) return false;

  const hasChanges = Object.keys(changesFound).length > 0;
  const subject = hasChanges
    ? `[AMFB] Cron Success  - ${Object.keys(changesFound).length} echipe cu schimbări`
    : `[AMFB] Cron Success  - Nicio schimbare detectată`;

  let body = `Cronul AMFB a rulat cu succes la ${new Date().toLocaleString("ro-RO", {
    timeZone: "Europe/Bucharest",
  })}\n\n`;

  body += ` STATISTICI:\n`;
  body += ` Selecții verificate: ${keysChecked.length}\n`;
  body += ` Abonați activi: ${totalSubscribers}\n`;
  body += ` Selecții cu schimbări: ${Object.keys(changesFound).length}\n\n`;

  if (hasChanges) {
    body += ` SCHIMBĂRI DETECTATE:\n`;
    for (const [key, count] of Object.entries(changesFound)) {
      body += ` ${key}: ${count} modificări\n`;
    }
    body += `\n Notificări trimise către abonați.\n`;
  } else {
    body += ` FĂRĂ SCHIMBĂRI\n`;
    body += `Toate echipele au același program ca la ultima verificare.\n`;
  }

  body += `\n Link: https://amfb.adrianconstantin.ro\n`;

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || "AMFB Notifier <notify@amfb.adrianconstantin.ro>",
      to: adminEmail,
      subject,
      text: body,
    });

    return !!(result?.data?.id);
  } catch (error) {
    console.error("Failed to send cron status email:", error);
    return false;
  }
}

export async function notifyAll(
  subs: Record<string, Subscription>,
  changesByKey: Record<string, Fixture[]>,
  allFixturesByKey: Record<string, Fixture[]>
) {
  for (const sub of Object.values(subs)) {
    for (const sel of sub.selections) {
      for (const team of sel.teams) {
        const key = selectionKey(sel.groupId, team);
        const changes = changesByKey[key] || [];
        const allFixtures = allFixturesByKey[key] || [];
        await notifyEmail(sub.email, sel.groupId, team, changes, allFixtures);
      }
    }
  }
}
