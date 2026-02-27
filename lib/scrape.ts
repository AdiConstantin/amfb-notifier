import * as cheerio from "cheerio";
import { addHours, isAfter, startOfDay } from "date-fns";
import crypto from "crypto";
import { Fixture } from "./types";
import { AMFB_PAGE_URL } from "./config";

// Use centralized URL configuration
export const TARGET = AMFB_PAGE_URL;

type Raw = { teamA: string; teamB: string; dateISO?: string; location?: string };

export function hashFixture(team: string, opponent: string, dateISO?: string) {
  return crypto.createHash("sha1").update(`${team}|${opponent}|${dateISO ?? ""}`).digest("hex");
}

export async function discoverTeams(): Promise<string[]> {
  try {
    const res = await fetch(TARGET, { 
      headers: { "user-agent": "Mozilla/5.0 AMFB-Notifier" }
    });
    
    if (!res.ok) {
      console.error('❌ Failed to fetch teams:', res.status);
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
    
    return teams.length > 0 ? teams : getKnownTeams();
    
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    return getKnownTeams();
  }
}

function getKnownTeams(): string[] {
  return [
    "Dan Chilom",
    "Raiders",
    "Pro Giurgiu 1",
    "Pro Giurgiu 2",
    "ACS Juniorul 2014 – 1",
    "ACS Juniorul 2014 – 2",
    "Derby",
    "Acad MCR",
    "Partizan",
    "Marius L.",
    "Alex. Vaidean",
    "Metaloglobus",
    "D'angelo",
    "DNG",
    "Herea FA",
    "Academica"
  ];
}

export async function fetchFixtures(teams: string[]): Promise<Record<string, Fixture[]>> {
  const res = await fetch(TARGET, { headers: { "user-agent": "Mozilla/5.0 AMFB-Notifier" }});
  const html = await res.text();
  const $ = cheerio.load(html);

  function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function extractContentText(): string {
    const selectors = [
      ".post-excerpt",
      ".entry-content",
      ".post-content",
      "article",
      "main",
      "body",
    ];

    for (const sel of selectors) {
      const el = $(sel).first();
      if (!el || el.length === 0) continue;

      // Prefer HTML to preserve <br> / <p> as line breaks
      const fragHtml = el.html();
      if (fragHtml && fragHtml.trim().length > 0) {
        const withBreaks = fragHtml
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n")
          .replace(/<\/div>/gi, "\n")
          .replace(/<\/li>/gi, "\n");
        const text = cheerio.load(withBreaks).text();
        if (text.trim().length > 0) return text;
      }

      const text = el.text();
      if (text.trim().length > 0) return text;
    }

    return "";
  }

  const content = extractContentText().replace(/\r/g, "\n");
  const raws: Raw[] = [];

  const knownTeams = getKnownTeams();
  const orderedKnownTeams = [...knownTeams].sort((a, b) => b.length - a.length);

  // Find all occurrences of "HH:MM <teams...>" anywhere in the content
  const timeRe = /(^|[\s\n])(\d{1,2}):(\d{2})\s+([^\n]+?)(?=$|[\n]|[\s\n]\d{1,2}:\d{2}\s)/g;
  const dateRe = /DATA\s+\w+[^0-9]*(\d{1,2})\.(\d{1,2})\.(\d{4})/gi;

  for (const m of content.matchAll(timeRe)) {
    const hours = m[2];
    const minutes = m[3];
    const teamsStr = m[4] ?? "";
    
    // Clean teams string - remove common date/time keywords that might be mixed in
    let cleanTeamsStr = teamsStr
      .replace(/\b(DATA|DUMINICA|SAMBATA|ETAPA|ORA|\d{1,2}\.\d{1,2}\.\d{4})\b/gi, ' ')
      .replace(/[\/]/g, " ") // handle "Derby/ Academica" etc.
      .replace(/[–—]/g, "–") // normalize long dashes
      .replace(/\s+/g, ' ')
      .trim();
    
    let teamA = '', teamB = '';
    
    // Prefer matching against known teams (robust for multi-word names)
    const cleanLower = cleanTeamsStr.toLowerCase();
    const matched: string[] = [];

    for (const t of orderedKnownTeams) {
      const tLower = t.toLowerCase();
      if (cleanLower.includes(tLower)) {
        matched.push(t);
        if (matched.length >= 2) break;
      } else {
        // Also try a whitespace-tolerant match (handles weird spacing)
        const re = new RegExp(escapeRegExp(t).replace(/\s+/g, "\\s+"), "i");
        if (re.test(cleanTeamsStr)) {
          matched.push(t);
          if (matched.length >= 2) break;
        }
      }
    }

    if (matched.length >= 2) {
      [teamA, teamB] = matched;
    } else {
      // If we can't identify both teams reliably, skip this line
      continue;
    }

    // Find current date context from previous lines in content
    let currentDate = '';
    const beforeIdx = typeof m.index === "number" ? m.index : 0;
    const contentBefore = content.slice(0, beforeIdx);
    let lastDate: { dd: string; MM: string; yyyy: string } | null = null;
    for (const dm of contentBefore.matchAll(dateRe)) {
      lastDate = { dd: dm[1]!, MM: dm[2]!, yyyy: dm[3]! };
    }

    if (lastDate) {
      const { dd, MM, yyyy } = lastDate;
      const matchDate = new Date(parseInt(yyyy), parseInt(MM) - 1, parseInt(dd));
      const isDST = isDaylightSavingTime(matchDate);
      const timezone = isDST ? "+03:00" : "+02:00";
      currentDate = `${yyyy}-${MM.padStart(2, "0")}-${dd.padStart(2, "0")}T${hours.padStart(2, "0")}:${minutes}:00${timezone}`;
    }

    if (currentDate && teamA && teamB) {
      raws.push({ teamA, teamB, dateISO: currentDate, location: 'Sud Arena' });
    }
  }

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

// Funcție helper pentru a determina DST în România
function isDaylightSavingTime(date: Date): boolean {
  const year = date.getFullYear();
  
  // DST în România: ultimul duminică din martie - ultimul duminică din octombrie
  const march = new Date(year, 2, 31); // 31 martie
  const lastSundayMarch = new Date(march.getTime() - (march.getDay() || 7) * 24 * 60 * 60 * 1000);
  
  const october = new Date(year, 9, 31); // 31 octombrie  
  const lastSundayOctober = new Date(october.getTime() - (october.getDay() || 7) * 24 * 60 * 60 * 1000);
  
  // DST este activ între ultimul duminică din martie și ultimul duminică din octombrie
  return date >= lastSundayMarch && date < lastSundayOctober;
}