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

  // NEW: Look for content in WordPress post content instead of table
  const content = $('.post-excerpt p').text();
  const raws: Raw[] = [];
  
  // Parse the text content line by line
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Parse the text content line by line looking for match patterns
  for (const line of lines) {
    // Match pattern: time followed by team names
    // Format: "9:40    Derby   Raiders" or "14:20   Derby   Acad MCR"
    const timeMatch = line.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
    if (!timeMatch) continue;

    const [, hours, minutes, teamsStr] = timeMatch;
    
    // Split teams string - handle various formats
    const teamParts = teamsStr.split(/\s+/).filter(part => part.length > 0);
    if (teamParts.length < 2) continue;

    let teamA = '', teamB = '';
    
    // Simple case: just two teams
    if (teamParts.length === 2) {
      [teamA, teamB] = teamParts;
    }
    // Complex case: multi-word team names, try intelligent splitting
    else {
      // Try splitting at middle
      const midPoint = Math.floor(teamParts.length / 2);
      teamA = teamParts.slice(0, midPoint).join(' ');
      teamB = teamParts.slice(midPoint).join(' ');
    }

    // Find current date context from previous lines in content
    let currentDate = '';
    const contentBeforeThisLine = content.substring(0, content.indexOf(line));
    const previousLines = contentBeforeThisLine.split('\n');
    
    for (let i = previousLines.length - 1; i >= 0; i--) {
      const dateMatch = previousLines[i].match(/DATA\s+\w+\s+(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (dateMatch) {
        const [, dd, MM, yyyy] = dateMatch;
        currentDate = `${yyyy}-${MM.padStart(2, '0')}-${dd.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes}:00+03:00`;
        break;
      }
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