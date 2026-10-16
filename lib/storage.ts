import { Redis } from "@upstash/redis";
import { DEFAULT_GROUP_ID } from "./config";
import { Fixture, GroupSelection, Subscription } from "./types";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SUBS_KEY = "subs";
const LAST_FIXTURES_KEY = "last_fixtures";
const LAST_FIXTURES_FULL_KEY = "last_fixtures_full";

/** Normalize legacy { teams } subscriptions into { selections } */
export function normalizeSubscription(raw: Subscription): Subscription {
  if (raw.selections && Array.isArray(raw.selections) && raw.selections.length > 0) {
    return {
      email: raw.email,
      selections: raw.selections
        .filter((s) => s?.groupId && Array.isArray(s.teams) && s.teams.length > 0)
        .map((s) => ({
          groupId: s.groupId,
          teams: [...new Set(s.teams)],
        })),
      createdAt: raw.createdAt,
    };
  }

  const legacyTeams = Array.isArray(raw.teams) ? raw.teams : [];
  const selections: GroupSelection[] =
    legacyTeams.length > 0
      ? [{ groupId: DEFAULT_GROUP_ID, teams: [...new Set(legacyTeams)] }]
      : [];

  return {
    email: raw.email,
    selections,
    createdAt: raw.createdAt,
  };
}

/**
 * Merge selections by groupId:
 * - submitted groups overwrite that group's teams
 * - other existing groups are kept (so adding 2015 doesn't wipe 2014)
 * - legacy { teams } is first normalized to 2014-seria1
 */
export function mergeSelectionsByGroup(
  existing: Subscription | null,
  incoming: GroupSelection[]
): GroupSelection[] {
  const byGroup = new Map<string, string[]>();

  if (existing) {
    for (const sel of normalizeSubscription(existing).selections) {
      byGroup.set(sel.groupId, [...sel.teams]);
    }
  }

  for (const sel of incoming) {
    if (!sel.groupId || !Array.isArray(sel.teams) || sel.teams.length === 0) continue;
    byGroup.set(sel.groupId, [...new Set(sel.teams)]);
  }

  return Array.from(byGroup.entries()).map(([groupId, teams]) => ({ groupId, teams }));
}

export async function getSubscription(id: string): Promise<Subscription | null> {
  const raw = await redis.hget(SUBS_KEY, id);
  if (!raw) return null;
  try {
    const parsed =
      typeof raw === "string" ? (JSON.parse(raw) as Subscription) : (raw as Subscription);
    if (!parsed || typeof parsed !== "object") return null;
    return normalizeSubscription(parsed);
  } catch (error) {
    console.error(`Failed to parse subscription ${id}:`, error);
    return null;
  }
}

export async function addSubscription(id: string, data: Subscription) {
  const normalized = normalizeSubscription(data);
  await redis.hset(SUBS_KEY, { [id]: JSON.stringify(normalized) });
}

/** Upsert with merge-by-groupId so re-subscribe can't wipe other groups */
export async function upsertSubscriptionMergingGroups(
  email: string,
  incoming: GroupSelection[]
): Promise<Subscription> {
  const existing = await getSubscription(email);
  const selections = mergeSelectionsByGroup(existing, incoming);
  const next: Subscription = {
    email,
    selections,
    createdAt: existing?.createdAt ?? Date.now(),
  };
  await addSubscription(email, next);
  return next;
}

export async function removeSubscription(id: string) {
  await redis.hdel(SUBS_KEY, id);
}

export async function listSubscriptions(): Promise<Record<string, Subscription>> {
  const all = await redis.hgetall(SUBS_KEY);
  const result: Record<string, Subscription> = {};

  for (const [k, v] of Object.entries(all ?? {})) {
    try {
      const parsed =
        typeof v === "string" ? (JSON.parse(v) as Subscription) : (v as Subscription);
      if (parsed && typeof parsed === "object") {
        result[k] = normalizeSubscription(parsed);
      }
    } catch (error) {
      console.error(`Failed to parse subscription ${k}:`, error);
    }
  }
  return result;
}

export async function countSubscriptions(): Promise<number> {
  const all = await redis.hgetall(SUBS_KEY);
  return Object.keys(all ?? {}).length;
}

export async function getLastFixtures(): Promise<Record<string, string[]>> {
  return (await redis.get<Record<string, string[]>>(LAST_FIXTURES_KEY)) ?? {};
}

export async function setLastFixtures(map: Record<string, string[]>) {
  await redis.set(LAST_FIXTURES_KEY, map);
}

export async function getLastFixturesFull(): Promise<Record<string, Fixture[]>> {
  return (await redis.get<Record<string, Fixture[]>>(LAST_FIXTURES_FULL_KEY)) ?? {};
}

export async function setLastFixturesFull(map: Record<string, Fixture[]>) {
  await redis.set(LAST_FIXTURES_FULL_KEY, map);
}
