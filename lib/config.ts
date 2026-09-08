/**
 * Configuration constants for AMFB Notifier
 */

export const AMFB_PAGE_URL =
  "https://amfb.ro/competitii/campionat-minifotbal/2007-albastru-parcul-florilor/";

export const AMFB_GROUP_LABEL = "2014 - 2015 Seria I";
export const AMFB_VENUE = "Teren CORESI";
export const AMFB_VENUE_ADDRESS = "https://maps.app.goo.gl/zKdqaAbv26veBwY57";
export const AMFB_MATCH_DAY = "Sâmbătă";

export const DEFAULT_SELECTED_TEAM = "ACS Juniorii Viitorului";

/** Canonical names shown in the UI and used for subscriptions */
export const KNOWN_TEAMS = [
  "ACS Herea FA",
  "ACS Juniorii Viitorului",
  "ACS Victoria 2010",
  "All Stars",
  "Arsenal Sp",
  "ATC Champion",
  "CS AIF A. Mutu",
  "CSS 1",
  "CSU Stiinta Buc",
  "FC Danilescu",
  "FC FCSB",
  "FC New Champion",
  "FC Rapid 1923 SA",
  "LPS Mircea E.",
  "New Stars",
  "Real Cadet",
] as const;

/** How AMFB writes a team on the schedule → canonical name */
export const TEAM_ALIASES: Record<string, string> = {
  "ACS Juniorii Viit.": "ACS Juniorii Viitorului",
  "ACS Juniorii Viit": "ACS Juniorii Viitorului",
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
