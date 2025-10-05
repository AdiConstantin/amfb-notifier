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
  email?: string;
  whatsapp?: string; // E.164 (ex: +40744...)
  teams: string[];
  createdAt: number;
};