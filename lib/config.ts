/**
 * Multi-group AMFB configuration
 */

export type AmfbGroup = {
  id: string;
  label: string;
  shortLabel: string;
  pageUrl: string;
  venue: string;
  venueMapsUrl: string;
  lat: number;
  lon: number;
  matchDay: string;
  knownTeams: readonly string[];
  aliases: Record<string, string>;
  defaultTeam?: string;
};

export const DEFAULT_GROUP_ID = "2014-seria1";

export const AMFB_GROUPS: AmfbGroup[] = [
  {
    id: "2014-seria1",
    label: "2014 - Seria I",
    shortLabel: "2014",
    pageUrl: "https://amfb.ro/competitii/campionat-minifotbal/2014-seria1/",
    venue: "Teren CORESI",
    venueMapsUrl: "https://maps.app.goo.gl/zKdqaAbv26veBwY57",
    lat: 44.484367,
    lon: 26.064988,
    matchDay: "Sâmbătă",
    defaultTeam: "Juniorii Viitorului",
    knownTeams: [
      "ACS All Stars",
      "ACS Herea FA",
      "ACS Victoria 2010",
      "Arsenal Sport",
      "AS New Stars Football Club",
      "ATC Champion",
      "CS AIF Adrian Mutu",
      "CSS 1",
      "CSU Stiinta Bucuresti",
      "FC Danilescu",
      "FC FCSB",
      "FC New Champion",
      "FC Rapid 1923 SA",
      "Juniorii Viitorului",
      "LPS Mircea Eliade",
      "Real Cadet",
    ],
    aliases: {
      "ACS Juniorii Viitorului": "Juniorii Viitorului",
      "ACS Juniorii Viit.": "Juniorii Viitorului",
      "ACS Juniorii Viit": "Juniorii Viitorului",
      "All Stars": "ACS All Stars",
      "Arsenal Sp": "Arsenal Sport",
      "CS AIF A. Mutu": "CS AIF Adrian Mutu",
      "CSU Stiinta Buc": "CSU Stiinta Bucuresti",
      "LPS Mircea E.": "LPS Mircea Eliade",
      "New Stars": "AS New Stars Football Club",
    },
  },
  {
    id: "2015-seria1",
    label: "2015 - Seria I",
    shortLabel: "2015",
    pageUrl: "https://amfb.ro/competitii/campionat-minifotbal/2015-seria1/",
    venue: "Teren CORESI",
    venueMapsUrl: "https://maps.app.goo.gl/zKdqaAbv26veBwY57",
    lat: 44.484367,
    lon: 26.064988,
    matchDay: "Duminică",
    defaultTeam: "Juniorii Viitorului",
    knownTeams: [
      "ACS All Stars",
      "ACS Herea FA",
      "ACS Sport Team Bucuresti",
      "ACS Super Star Junior 2020",
      "AS New Stars Football Club",
      "Asterra",
      "ATC Champion",
      "CS Dinamo Bucuresti",
      "CS Oxigen Bucuresti",
      "CSA Steaua",
      "CSU Stiinta Bucuresti",
      "FC FCSB",
      "FC New Champion",
      "FC Rapid 1923 SA",
      "FC SFR",
      "Juniorii Viitorului",
    ],
    aliases: {
      "ACS Juniorii Viitorului": "Juniorii Viitorului",
      "ACS Juniorii Viit.": "Juniorii Viitorului",
      "ACS Juniorii Viit": "Juniorii Viitorului",
      "All Stars": "ACS All Stars",
      "CSU Stiinta Buc": "CSU Stiinta Bucuresti",
      "New Stars": "AS New Stars Football Club",
    },
  },
  {
    id: "2018-verde",
    label: "2018 - Verde",
    shortLabel: "2018",
    pageUrl: "https://amfb.ro/competitii/campionat-minifotbal/2018-verde/",
    venue: "Progresul Spartac",
    venueMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Progresul+Spartac+Bucuresti",
    lat: 44.4185,
    lon: 26.0475,
    matchDay: "Sâmbătă",
    defaultTeam: "Juniorii Viitorului",
    knownTeams: [
      "ACS Ajax Noua Generație 1",
      "ACS Ajax Noua Generație 2",
      "ACS Inter Galaxy",
      "ACS United Champions 1",
      "ACS United Champions 2",
      "ACS Victoria 2010",
      "CS Progresul",
      "CSS 6",
      "FC FCSB",
      "FC Rusanu",
      "Gloria Sportul Rege",
      "Juniorii Viitorului",
      "Turistul",
    ],
    aliases: {
      "ACS Ajax Noua Generatie 1": "ACS Ajax Noua Generație 1",
      "ACS Ajax Noua Generatie 2": "ACS Ajax Noua Generație 2",
    },
  },
];

export const APP_CONFIG = {
  name: "AMFB Notifier",
  domain: "amfb.adrianconstantin.ro",
  email: "notify@amfb.adrianconstantin.ro",
} as const;

/** @deprecated use getGroup / AMFB_GROUPS - kept for any leftover imports */
export const AMFB_PAGE_URL =
  AMFB_GROUPS.find((g) => g.id === DEFAULT_GROUP_ID)!.pageUrl;

export function getGroup(id: string): AmfbGroup | undefined {
  return AMFB_GROUPS.find((g) => g.id === id);
}

export function requireGroup(id: string): AmfbGroup {
  const g = getGroup(id);
  if (!g) throw new Error(`Unknown AMFB group: ${id}`);
  return g;
}

export function selectionKey(groupId: string, team: string): string {
  return `${groupId}::${team}`;
}

export function parseSelectionKey(key: string): { groupId: string; team: string } | null {
  const idx = key.indexOf("::");
  if (idx <= 0) return null;
  return { groupId: key.slice(0, idx), team: key.slice(idx + 2) };
}
