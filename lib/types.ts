export type Fixture = {
  team: string;
  opponent: string;
  dateISO: string;
  location?: string;
  hash: string;
};

export type FixtureDiff =
  | { type: "added"; current: Fixture }
  | { type: "removed"; previous: Fixture }
  | { type: "time_changed"; previous: Fixture; current: Fixture }
  | { type: "opponent_changed"; previous: Fixture; current: Fixture };

export type Subscription = {
  email: string;
  teams: string[];
  createdAt: number;
};

export type WeatherAlert = {
  level: "galben" | "portocaliu" | "roșu" | "info";
  event: string;
  description?: string;
};

export type MatchWeather = {
  temperatureC: number | null;
  precipitationProbability: number | null;
  willRain: boolean;
  windKmh: number | null;
  venueLabel: string;
  /** Exact coords requested (from config) */
  latitude: number;
  longitude: number;
  alerts: WeatherAlert[];
  attribution: string;
};