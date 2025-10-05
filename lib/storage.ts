import { Redis } from "@upstash/redis";
import { Fixture, Subscription } from "./types";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SUBS_KEY = "subs";                 // hash: id -> json
const LAST_FIXTURES_KEY = "last_fixtures";     // team -> string[] (hash-uri)
const LAST_FIXTURES_FULL_KEY = "last_fixtures_full"; // team -> Fixture[] (pt. diff inteligent)

export async function addSubscription(id: string, data: Subscription) {
  await redis.hset(SUBS_KEY, { [id]: JSON.stringify(data) });
}

export async function removeSubscription(id: string) {
  await redis.hdel(SUBS_KEY, id);
}

export async function listSubscriptions(): Promise<Record<string, Subscription>> {
  const all = await redis.hgetall(SUBS_KEY);
  const result: Record<string, Subscription> = {};
  for (const [k, v] of Object.entries(all ?? {})) {
    if (typeof v === 'string') {
      result[k] = JSON.parse(v);
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