export type Fixture = {
  team: string;
  opponent: string;
  dateISO: string;
  location?: string;
  hash: string;
  groupId?: string;
};

export type FixtureDiff =
  | { type: "added"; current: Fixture }
  | { type: "removed"; previous: Fixture }
  | { type: "time_changed"; previous: Fixture; current: Fixture }
  | { type: "opponent_changed"; previous: Fixture; current: Fixture };

export type GroupSelection = {
  groupId: string;
  teams: string[];
};

export type Subscription = {
  email: string;
  /** Multi-group selections */
  selections: GroupSelection[];
  /** Legacy single-group team list (migrated on read) */
  teams?: string[];
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
  latitude: number;
  longitude: number;
  alerts: WeatherAlert[];
  attribution: string;
};

export type VenueCoords = {
  venue: string;
  lat: number;
  lon: number;
};
