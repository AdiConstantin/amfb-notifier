"use client";
import { useEffect, useState } from "react";
import TeamPicker from "./TeamPicker";
import type { Fixture, MatchWeather } from "@/lib/types";
import { DEFAULT_SELECTED_TEAM } from "@/lib/config";

function alertLevelClass(level: MatchWeather["alerts"][number]["level"]) {
  if (level === "roșu") return "border-red-500/60 bg-red-950/40 text-red-200";
  if (level === "portocaliu") return "border-orange-500/60 bg-orange-950/40 text-orange-200";
  if (level === "galben") return "border-yellow-500/60 bg-yellow-950/40 text-yellow-200";
  return "border-neutral-600 bg-neutral-800 text-neutral-300";
}

export default function SubscriptionForm() {
  const [email, setEmail] = useState("");
  const [teams, setTeams] = useState<string[]>([DEFAULT_SELECTED_TEAM]);
  const [idToUnsub, setIdToUnsub] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [nextFixtures, setNextFixtures] = useState<Fixture[]>([]);
  const [weather, setWeather] = useState<MatchWeather | null>(null);
  const [weatherFor, setWeatherFor] = useState<{
    team: string;
    opponent: string;
    dateISO: string;
  } | null>(null);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixturesError, setFixturesError] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then((d) => setCount(d.count ?? 0))
        .catch(() => {});
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (teams.length === 0) {
      setNextFixtures([]);
      setWeather(null);
      setWeatherFor(null);
      return;
    }

    let cancelled = false;

    const loadFixtures = async () => {
      setFixturesLoading(true);
      setFixturesError(null);
      try {
        const res = await fetch("/api/fixtures-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ teams }),
        });
        const data = await res.json();
        if (!cancelled) {
          setNextFixtures(Array.isArray(data.fixtures) ? data.fixtures : []);
          setWeather(data.weather ?? null);
          setWeatherFor(data.weatherFor ?? null);
        }
      } catch {
        if (!cancelled) {
          setNextFixtures([]);
          setWeather(null);
          setWeatherFor(null);
          setFixturesError("Nu am putut încărca următoarea etapă acum.");
        }
      } finally {
        if (!cancelled) {
          setFixturesLoading(false);
        }
      }
    };

    loadFixtures();

    return () => {
      cancelled = true;
    };
  }, [teams]);

  function formatDate(dateISO: string) {
    const d = new Date(dateISO);
    if (Number.isNaN(d.getTime())) return dateISO;
    return d.toLocaleString("ro-RO", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function subscribe() {
    setMsg(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, teams }),
      });
      const data = await res.json();

      if (res.ok) {
        setMsg(data.message || "✅ Te-ai abonat cu succes!");
        setEmail("");
        setTeams([DEFAULT_SELECTED_TEAM]);
      } else {
        setMsg(`❌ Eroare: ${JSON.stringify(data.error)}`);
      }
    } catch {
      setMsg("❌ Eroare de conexiune. Încearcă din nou.");
    }
  }

  async function unsubscribe() {
    setMsg(null);
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: idToUnsub }),
      });
      const data = await res.json();

      if (res.ok) {
        setMsg(data.message || "✅ Dezabonare reușită!");
        setIdToUnsub("");
      } else {
        setMsg(`❌ Eroare: ${JSON.stringify(data.error)}`);
      }
    } catch {
      setMsg("❌ Eroare de conexiune. Încearcă din nou.");
    }
  }

  const nextMatchHash = nextFixtures[0]?.hash;

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Abonare notificări</h2>
          <span className="text-xs text-neutral-400">Abonați: {count}</span>
        </div>
        <div className="grid gap-4">
          <input
            className="rounded-xl px-3 py-2 bg-neutral-800 border border-neutral-700"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <TeamPicker value={teams} onChange={setTeams} />
        </div>

        {teams.length > 0 && (
          <section className="mt-4 space-y-2" aria-label="Următoarea etapă">
            <h3 className="text-sm font-semibold text-neutral-200">
              Următoarea etapă pentru echipele selectate
            </h3>
            {fixturesLoading && (
              <p className="text-xs text-neutral-400">Se încarcă meciurile...</p>
            )}
            {fixturesError && !fixturesLoading && (
              <p className="text-xs text-red-400">{fixturesError}</p>
            )}
            {!fixturesLoading && !fixturesError && nextFixtures.length === 0 && (
              <p className="text-xs text-neutral-500">
                Nu există încă meciuri viitoare pentru echipele selectate.
              </p>
            )}
            {!fixturesLoading && nextFixtures.length > 0 && (
              <ul className="mt-2 space-y-2 text-xs text-neutral-200">
                {nextFixtures.map((f) => (
                  <li
                    key={f.hash}
                    className="flex flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {f.team}{" "}
                          <span className="text-neutral-400">vs</span>{" "}
                          {f.opponent}
                        </span>
                        {f.location && (
                          <span className="text-[11px] text-neutral-400">
                            {f.location}
                          </span>
                        )}
                      </div>
                      <span className="ml-4 text-right text-[11px] text-neutral-300">
                        {formatDate(f.dateISO)}
                      </span>
                    </div>

                    {weather && f.hash === nextMatchHash && (
                      <div className="rounded-md border border-sky-800/60 bg-sky-950/30 px-2.5 py-2 text-[11px] text-sky-100 space-y-1">
                        <div className="font-semibold text-sky-200">
                          Prognoză ora meciului
                          {weatherFor ? ` · ${weather.venueLabel}` : ""}
                        </div>
                        <div className="text-sky-100/90">
                          {weather.temperatureC != null && (
                            <span>~{weather.temperatureC}°C</span>
                          )}
                          {weather.precipitationProbability != null && (
                            <span>
                              {weather.temperatureC != null ? " · " : ""}
                              {weather.willRain
                                ? `ploaie posibilă (~${weather.precipitationProbability}%)`
                                : `șanse ploaie ~${weather.precipitationProbability}%`}
                            </span>
                          )}
                          {weather.windKmh != null && weather.windKmh >= 40 && (
                            <span> · vânt ~{weather.windKmh} km/h</span>
                          )}
                        </div>
                        {weather.alerts.length > 0 && (
                          <ul className="space-y-1 pt-1">
                            {weather.alerts.map((a, i) => (
                              <li
                                key={`${a.level}-${a.event}-${i}`}
                                className={`rounded border px-2 py-1 ${alertLevelClass(a.level)}`}
                              >
                                Alertă {a.level}: {a.event}
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="text-[10px] text-sky-300/60">
                          {weather.attribution}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <button
          onClick={subscribe}
          className="mt-4 w-full rounded-xl px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
        >
          Abonează-mă
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">Dezabonare</h2>
        <input
          className="w-full rounded-xl px-3 py-2 bg-neutral-800 border border-neutral-700"
          placeholder="Email"
          value={idToUnsub}
          onChange={(e) => setIdToUnsub(e.target.value)}
        />
        <button
          onClick={unsubscribe}
          className="mt-4 w-full rounded-xl px-4 py-2 bg-red-500 hover:bg-red-400 text-black font-semibold"
        >
          Dezabonează-mă
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            msg.includes("✅")
              ? "bg-emerald-900/30 border border-emerald-700 text-emerald-300"
              : "bg-red-900/30 border border-red-700 text-red-300"
          }`}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
