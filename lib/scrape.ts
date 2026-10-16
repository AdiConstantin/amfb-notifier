import * as cheerio from "cheerio";
import { addHours, isAfter, startOfDay } from "date-fns";
import crypto from "crypto";
import { Fixture } from "./types";
import { AmfbGroup, getGroup, requireGroup } from "./config";

type Raw = { teamA: string; teamB: string; dateISO?: string; location?: string };

export function hashFixture(team: string, opponent: string, dateISO?: string) {
  return crypto.createHash("sha1").update(`${team}|${opponent}|${dateISO ?? ""}`).digest("hex");
}

function normalizeTeamText(value: string): string {
  return value
    .replace(/[’`´]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function toCanonicalTeam(name: string, group: AmfbGroup): string {
  const n = normalizeTeamText(name);
  if (!n) return name.trim();

  for (const t of group.knownTeams) {
    if (normalizeTeamText(t) === n) return t;
  }
  for (const [alias, canonical] of Object.entries(group.aliases)) {
    if (normalizeTeamText(alias) === n) return canonical;
  }

  const candidates = [
    ...group.knownTeams.map((t) => ({ search: t, canonical: t })),
    ...Object.entries(group.aliases).map(([search, canonical]) => ({ search, canonical })),
  ].sort((a, b) => b.search.length - a.search.length);

  for (const { search, canonical } of candidates) {
    const s = normalizeTeamText(search);
    if (n.includes(s) || s.includes(n)) return canonical;
  }

  return name.trim();
}

function teamsMatch(a: string, b: string, group: AmfbGroup): boolean {
  return (
    normalizeTeamText(toCanonicalTeam(a, group)) ===
    normalizeTeamText(toCanonicalTeam(b, group))
  );
}

function parseDateFromCell(text: string): { dd: string; MM: string; yyyy: string } | null {
  const m = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;
  return { dd: m[1], MM: m[2], yyyy: m[3] };
}

function toDateISO(
  dd: string,
  MM: string,
  yyyy: string,
  hours: string,
  minutes: string
): string {
  const matchDate = new Date(parseInt(yyyy, 10), parseInt(MM, 10) - 1, parseInt(dd, 10));
  const timezone = isDaylightSavingTime(matchDate) ? "+03:00" : "+02:00";
  return `${yyyy}-${MM.padStart(2, "0")}-${dd.padStart(2, "0")}T${hours.padStart(2, "0")}:${minutes}:00${timezone}`;
}

function parseFixturesFromTables($: cheerio.CheerioAPI, group: AmfbGroup): Raw[] {
  const raws: Raw[] = [];
  const tables = $("figure.program-meciuri table, table").toArray();

  for (const table of tables) {
    let currentDate: { dd: string; MM: string; yyyy: string } | null = null;
    const rows = $(table).find("tr").toArray();

    for (const row of rows) {
      const cells = $(row)
        .find("td, th")
        .toArray()
        .map((c) => $(c).text().replace(/\u00a0/g, " ").trim())
        .filter((t) => t.length > 0);

      if (cells.length === 0) continue;

      const joined = cells.join(" ");
      if (/nu\s*joac/i.test(cells[0]) || /nu\s*joac/i.test(joined)) continue;

      if (/^DATA\b/i.test(cells[0]) || /^DATA\b/i.test(joined)) {
        currentDate = parseDateFromCell(joined);
        continue;
      }

      if (/^ORA\b/i.test(cells[0]) || /\bETAPA\b/i.test(joined)) {
        continue;
      }

      const timeMatch = cells[0].match(/^(\d{1,2}):(\d{2})$/);
      if (!timeMatch || cells.length < 3 || !currentDate) continue;

      const [, hours, minutes] = timeMatch;
      const teamA = toCanonicalTeam(cells[1], group);
      const teamB = toCanonicalTeam(cells[2], group);
      if (!teamA || !teamB) continue;

      raws.push({
        teamA,
        teamB,
        dateISO: toDateISO(currentDate.dd, currentDate.MM, currentDate.yyyy, hours, minutes),
        location: group.venue,
      });
    }
  }

  return raws;
}

export async function discoverTeams(groupId: string): Promise<string[]> {
  const group = getGroup(groupId);
  if (!group) return [];

  try {
    const res = await fetch(group.pageUrl, {
      headers: { "user-agent": "Mozilla/5.0 AMFB-Notifier" },
    });

    if (!res.ok) {
      console.error("❌ Failed to fetch teams:", res.status, groupId);
      return [...group.knownTeams];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const set = new Set<string>();

    for (const table of $("figure.program-meciuri table, table").toArray()) {
      for (const row of $(table).find("tr").toArray()) {
        const cells = $(row)
          .find("td, th")
          .toArray()
          .map((c) => $(c).text().replace(/\u00a0/g, " ").trim());
        if (cells.length < 3) continue;
        if (/nu\s*joac/i.test(cells[0])) continue;
        if (!/^\d{1,2}:\d{2}$/.test(cells[0])) continue;
        set.add(toCanonicalTeam(cells[1], group));
        set.add(toCanonicalTeam(cells[2], group));
      }
    }

    if (set.size === 0) {
      const pageText = normalizeTeamText($("body").text());
      for (const t of group.knownTeams) {
        if (pageText.includes(normalizeTeamText(t))) set.add(t);
      }
      for (const [alias, canonical] of Object.entries(group.aliases)) {
        if (pageText.includes(normalizeTeamText(alias))) set.add(canonical);
      }
    }

    const teams = Array.from(set)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ro"));

    return teams.length > 0 ? teams : [...group.knownTeams];
  } catch (error) {
    console.error("❌ Error fetching teams:", error);
    return [...group.knownTeams];
  }
}

export async function fetchFixtures(
  groupId: string,
  teams: string[]
): Promise<Record<string, Fixture[]>> {
  const group = requireGroup(groupId);
  const res = await fetch(group.pageUrl, {
    headers: { "user-agent": "Mozilla/5.0 AMFB-Notifier" },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const raws = parseFixturesFromTables($, group);
  const now = new Date();
  const todayStart = startOfDay(now);

  const byTeam: Record<string, Fixture[]> = {};
  for (const team of teams) byTeam[team] = [];

  for (const r of raws) {
    const pair = [r.teamA, r.teamB];
    for (const team of teams) {
      const idx = pair.findIndex((x) => teamsMatch(x, team, group));
      if (idx === -1) continue;
      const opponent = pair[1 - idx];

      if (r.dateISO) {
        const dt = new Date(r.dateISO);
        if (!isAfter(addHours(dt, 0), todayStart)) continue;
      }

      const f: Fixture = {
        team,
        opponent,
        dateISO: r.dateISO ?? "",
        location: r.location,
        hash: hashFixture(team, opponent, r.dateISO),
        groupId,
      };
      byTeam[team].push(f);
    }
  }

  return byTeam;
}

function isDaylightSavingTime(date: Date): boolean {
  const year = date.getFullYear();
  const march = new Date(year, 2, 31);
  const lastSundayMarch = new Date(
    march.getTime() - (march.getDay() || 7) * 24 * 60 * 60 * 1000
  );
  const october = new Date(year, 9, 31);
  const lastSundayOctober = new Date(
    october.getTime() - (october.getDay() || 7) * 24 * 60 * 60 * 1000
  );
  return date >= lastSundayMarch && date < lastSundayOctober;
}
