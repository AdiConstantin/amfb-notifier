/**
 * Configuration constants for AMFB Notifier
 */

export const AMFB_PAGE_URL =
  "https://amfb.ro/competitii/campionat-minifotbal/2014-seria1/";

export const AMFB_GROUP_LABEL = "2014-2015 - Seria I";
export const AMFB_VENUE = "Teren CORESI";
export const AMFB_VENUE_MAPS_URL = "https://maps.app.goo.gl/zKdqaAbv26veBwY57";
/** Teren Fotbal Coresi (from Google Maps place) */
export const AMFB_VENUE_LAT = 44.484367;
export const AMFB_VENUE_LON = 26.064988;
export const AMFB_MATCH_DAY = "Sâmbătă";

export const DEFAULT_SELECTED_TEAM = "Juniorii Viitorului";

/** Canonical names as written on the current AMFB schedule */
export const KNOWN_TEAMS = [
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
] as const;

/** Old / abbreviated AMFB spellings → canonical name */
export const TEAM_ALIASES: Record<string, string> = {
  "ACS Juniorii Viitorului": "Juniorii Viitorului",
  "ACS Juniorii Viit.": "Juniorii Viitorului",
  "ACS Juniorii Viit": "Juniorii Viitorului",
  "All Stars": "ACS All Stars",
  "Arsenal Sp": "Arsenal Sport",
  "CS AIF A. Mutu": "CS AIF Adrian Mutu",
  "CSU Stiinta Buc": "CSU Stiinta Bucuresti",
  "LPS Mircea E.": "LPS Mircea Eliade",
  "New Stars": "AS New Stars Football Club",
};

export const AMFB_GROUPS = {
  "2014-2015-seria-i": AMFB_PAGE_URL,
} as const;

export const APP_CONFIG = {
  name: "AMFB Notifier",
  domain: "amfb.adrianconstantin.ro",
  email: "notify@amfb.adrianconstantin.ro",
  currentGroup: "2014-2015-seria-i",
} as const;
