/**
 * Configuration constants for AMFB Notifier
 */

// Main AMFB page URL - the single source of truth
export const AMFB_PAGE_URL = "https://amfb.ro/competitii/campionat-minifotbal/grupa-2013-albastru/";

// Alternative groups (for future use)
export const AMFB_GROUPS = {
  "2014-albastru": "https://amfb.ro/competitii/campionat-minifotbal/grupa-2013-alb/",
  "2014-galben": "https://amfb.ro/competitii/campionat-minifotbal/grupa-2013-albastru/",
  "2014-rosu": "https://amfb.ro/competitii/campionat-minifotbal/grupa-2014-alb/",
  "2014-alb": "https://amfb.ro/competitii/campionat-minifotbal/grupa-2012-rosu/",
} as const;

// App metadata
export const APP_CONFIG = {
  name: "AMFB Notifier",
  domain: "amfb.adrianconstantin.ro",
  email: "notify@amfb.adrianconstantin.ro",
  currentGroup: "2014-galben",
} as const;