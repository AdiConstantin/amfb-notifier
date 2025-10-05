import * as cheerio from "cheerio";
import { addHours, isAfter, startOfDay } from "date-fns";
import crypto from "crypto";
import { Fixture } from "./types";

export const TARGET = "https://amfb.ro/competitii/campionat-minifotbal/grupa-2013-albastru/";

type Raw = { teamA: string; teamB: string; dateISO?: string; location?: string };

export function hashFixture(team: string, opponent: string, dateISO?: string) {
  return crypto.createHash("sha1").update(`${team}|${opponent}|${dateISO ?? ""}`).digest("hex");
}

export async function discoverTeams(): Promise<string[]> {
  try {
    console.log('🔍 Fetching teams from AMFB...');
    
    const res = await fetch(TARGET, { 
      headers: { "user-agent": "Mozilla/5.0 AMFB-Notifier" }
    });
    
    if (!res.ok) {
      console.error('❌ Failed to fetch:', res.status);
      return getKnownTeams(); // fallback
    }
    
    const html = await res.text();
    const $ = cheerio.load(html);
    const set = new Set<string>();
    
    // Get all text content
    const pageText = $('body').text();
    
    // Known team names to look for (exact matches)
    const knownTeams = getKnownTeams();
    
    // Look for each known team in the text
    for (const team of knownTeams) {
      // Create variations of the team name
      const variations = [
        team,
        team.replace(/\.$/, ''), // without trailing dot
        team + '.',              // with trailing dot
        team.replace(/\s+/g, ''), // without spaces
      ];
      
      for (const variation of variations) {
        // Check if this variation appears in the text
        const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(pageText)) {
          set.add(team); // Always add the canonical form
          break; // Found this team, move to next
        }
      }
    }
    
    // Additional pattern matching for team names in match lines
    const lines = pageText.split('\n').map(line => line.trim()).filter(Boolean);
    
    for (const line of lines) {
      // Look for lines that contain match information with times
      if (line.includes(':') && /\d{1,2}:\d{2}/.test(line)) {
        // Remove time, "Rezultat", "ETAPA", numbers, etc.
        let cleanLine = line
          .replace(/\d{1,2}:\d{2}/g, ' ')           // remove times
          .replace(/\b(rezultat|etapa|data|duminica|sambata|ora)\b/gi, ' ') // remove common words
          .replace(/\b\d+\b/g, ' ')                 // remove standalone numbers
          .replace(/[\/\(\)\-–]/g, ' ')             // remove /, (, ), -, –
          .replace(/\s+/g, ' ')                     // normalize spaces
          .trim();
        
        // Check if any known team appears in this cleaned line
        for (const team of knownTeams) {
          const teamRegex = new RegExp(`\\b${team.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          if (teamRegex.test(cleanLine)) {
            set.add(team);
          }
          
          // Also check without dots/periods
          const teamNoDot = team.replace(/\./g, '');
          if (teamNoDot !== team) {
            const noDotRegex = new RegExp(`\\b${teamNoDot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            if (noDotRegex.test(cleanLine)) {
              set.add(team);
            }
          }
        }
      }
    }
    
    const teams = Array.from(set).sort((a,b) => a.localeCompare(b, "ro"));
    console.log('✅ Found teams:', teams.length, teams);
    
    return teams.length > 0 ? teams : getKnownTeams();
    
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    return getKnownTeams();
  }
}

function getKnownTeams(): string[] {
  return [
    "DNG",
    "Sport Team",
    "Alex. Vaidean",
    "Dan Chilom", 
    "Marius L.",
    "Raiders",
    "Real Sport",
    "ACS Juniorul 2014",
    "Metaloglobus",
    "Partizan",
    "Academic",
    "Acad MCR",
    "D'angelo",
    "Derby"
  ];
}

export async function fetchFixtures(teams: string[]): Promise<Record<string, Fixture[]>> {
  const res = await fetch(TARGET, { headers: { "user-agent": "Mozilla/5.0 AMFB-Notifier" }});
  const html = await res.text();
  const $ = cheerio.load(html);

  const rows = $("table tr");
  const raws: Raw[] = [];

  rows.each((_, el) => {
    const tds = $(el).find("td");
    if (tds.length < 3) return;

    const maybeDate = $(tds[0]).text().trim();        // ex: "12.10.2025 14:00"
    const match = $(tds[1]).text().trim();            // ex: "Raiders - Partizan"
    const loc = $(tds[2]).text().trim();              // dacă există

    const parts = match.split("-").map(s => s.trim());
    if (parts.length < 2) return;
    const [teamA, teamB] = parts;

    let dateISO: string | undefined = undefined;
    const m = maybeDate.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
    if (m) {
      const [_, dd, MM, yyyy, HH, mm] = m;
      const iso = `${yyyy}-${MM}-${dd}T${HH}:${mm}:00+03:00`; // Europe/Bucharest
      dateISO = iso;
    }

    if (teamA && teamB) raws.push({ teamA, teamB, dateISO, location: loc });
  });

  const now = new Date();
  const todayStart = startOfDay(now);

  const byTeam: Record<string, Fixture[]> = {};
  for (const team of teams) byTeam[team] = [];

  for (const r of raws) {
    const pair = [r.teamA, r.teamB];
    for (const team of teams) {
      const idx = pair.findIndex(x => x.toLowerCase().includes(team.toLowerCase()));
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
        hash: hashFixture(team, opponent, r.dateISO)
      };
      byTeam[team].push(f);
    }
  }

  return byTeam;
}