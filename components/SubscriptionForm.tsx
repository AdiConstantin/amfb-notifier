"use client";

import { useEffect, useMemo, useState } from "react";
import TeamPicker from "./TeamPicker";
import type { Fixture, GroupSelection, MatchWeather } from "@/lib/types";
import { AMFB_GROUPS, DEFAULT_GROUP_ID } from "@/lib/config";

type GroupSummary = {
  id: string;
  label: string;
  shortLabel: string;
  venue: string;
  matchDay: string;
  pageUrl: string;
  defaultTeam?: string;
};

function alertLevelClass(level: MatchWeather["alerts"][number]["level"]) {
  if (level === "roșu") return "border-red-400/50 bg-red-950/50 text-red-100";
  if (level === "portocaliu") return "border-orange-400/50 bg-orange-950/40 text-orange-100";
  if (level === "galben") return "border-yellow-400/50 bg-yellow-950/40 text-yellow-100";
  return "border-white/15 bg-white/5 text-white/80";
}

function MatchWeatherBlock({ weather }: { weather: MatchWeather }) {
  return (
    <div className="rounded-lg border border-sky-400/25 bg-sky-950/35 px-2.5 py-2 text-[11px] text-sky-50 space-y-1">
      <div className="font-semibold text-sky-100">
        Prognoză ora meciului · {weather.venueLabel}
      </div>
      <div>
        {weather.temperatureC != null && <span>~{weather.temperatureC}°C</span>}
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
    </div>
  );
}

export default function SubscriptionForm() {
  const groups = useMemo<GroupSummary[]>(
    () =>
      AMFB_GROUPS.map((g) => ({
        id: g.id,
        label: g.label,
        shortLabel: g.shortLabel,
        venue: g.venue,
        matchDay: g.matchDay,
        pageUrl: g.pageUrl,
        defaultTeam: g.defaultTeam,
      })),
    []
  );

  const [activeGroupId, setActiveGroupId] = useState(DEFAULT_GROUP_ID);
  const [selections, setSelections] = useState<GroupSelection[]>(() => {
    const g = AMFB_GROUPS.find((x) => x.id === DEFAULT_GROUP_ID);
    return g?.defaultTeam
      ? [{ groupId: g.id, teams: [g.defaultTeam] }]
      : [];
  });
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [idToUnsub, setIdToUnsub] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [nextFixtures, setNextFixtures] = useState<Fixture[]>([]);
  const [weatherByHash, setWeatherByHash] = useState<Record<string, MatchWeather | null>>({});
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixturesError, setFixturesError] = useState<string | null>(null);

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];
  const activeTeams =
    selections.find((s) => s.groupId === activeGroupId)?.teams ?? [];

  const totalSelected = selections.reduce((n, s) => n + s.teams.length, 0);

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
    let cancelled = false;
    setTeamsLoading(true);
    fetch(`/api/teams?groupId=${encodeURIComponent(activeGroupId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAvailableTeams(Array.isArray(d.teams) ? d.teams : []);
      })
      .catch(() => {
        if (!cancelled) setAvailableTeams([]);
      })
      .finally(() => {
        if (!cancelled) setTeamsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeGroupId]);

  useEffect(() => {
    if (selections.length === 0 || totalSelected === 0) {
      setNextFixtures([]);
      setWeatherByHash({});
      return;
    }

    let cancelled = false;
    const load = async () => {
      setFixturesLoading(true);
      setFixturesError(null);
      try {
        const res = await fetch("/api/fixtures-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ selections }),
        });
        const data = await res.json();
        if (!cancelled) {
          setNextFixtures(Array.isArray(data.fixtures) ? data.fixtures : []);
          setWeatherByHash(
            data.weatherByHash && typeof data.weatherByHash === "object"
              ? data.weatherByHash
              : {}
          );
        }
      } catch {
        if (!cancelled) {
          setNextFixtures([]);
          setWeatherByHash({});
          setFixturesError("Nu am putut încărca următoarea etapă acum.");
        }
      } finally {
        if (!cancelled) setFixturesLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selections, totalSelected]);

  function setActiveTeams(teams: string[]) {
    setSelections((prev) => {
      const others = prev.filter((s) => s.groupId !== activeGroupId);
      if (teams.length === 0) return others;
      return [...others, { groupId: activeGroupId, teams }];
    });
  }

  function formatDate(dateISO: string) {
    const d = new Date(dateISO);
    if (Number.isNaN(d.getTime())) return dateISO;
    return d.toLocaleString("ro-RO", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function groupLabel(id?: string) {
    return groups.find((g) => g.id === id)?.label ?? id ?? "";
  }

  async function subscribe() {
    setMsg(null);
    if (totalSelected === 0) {
      setMsg("❌ Selectează cel puțin o echipă.");
      return;
    }
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, selections }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(data.message || "✅ Te-ai abonat cu succes!");
        setEmail("");
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

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-pitch-900/85 backdrop-blur-md p-4 sm:p-6 shadow-glow">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-white tracking-tight">
              Alege grupa & echipele
            </h2>
            <p className="text-sm text-white/50 mt-1">
              Poți urmări echipe din mai multe grupe, într-un singur abonament.
            </p>
          </div>
          <span className="shrink-0 text-[11px] uppercase tracking-wider text-white/40 border border-white/10 rounded-full px-2.5 py-1">
            {count} abonați
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {groups.map((g) => {
            const selectedCount =
              selections.find((s) => s.groupId === g.id)?.teams.length ?? 0;
            const active = g.id === activeGroupId;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGroupId(g.id)}
                className={`snap-start shrink-0 rounded-2xl px-4 py-3 border text-left min-w-[9.5rem] transition ${
                  active
                    ? "border-lime-400/60 bg-lime-400/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <div className="text-sm font-semibold text-white">{g.shortLabel}</div>
                <div className="text-[11px] text-white/50 mt-0.5">{g.matchDay}</div>
                <div className="text-[11px] text-white/40">{g.venue}</div>
                {selectedCount > 0 && (
                  <div className="mt-2 text-[10px] text-lime-300/90">
                    {selectedCount} selectate
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/45">
          <span>
            {activeGroup.label} · {activeGroup.matchDay}
          </span>
          <a
            href={activeGroup.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-lime-300"
          >
            Program oficial AMFB
          </a>
        </div>

        <div className="mt-3">
          <TeamPicker
            value={activeTeams}
            onChange={setActiveTeams}
            teams={availableTeams}
            loading={teamsLoading}
          />
        </div>

        {totalSelected > 0 && (
          <div className="mt-5 space-y-2">
            <h3 className="text-sm font-semibold text-white/90">
              Următorul meci pe fiecare grupă selectată
            </h3>
            {fixturesLoading && (
              <p className="text-xs text-white/40">Se încarcă meciurile...</p>
            )}
            {fixturesError && !fixturesLoading && (
              <p className="text-xs text-red-300">{fixturesError}</p>
            )}
            {!fixturesLoading && !fixturesError && nextFixtures.length === 0 && (
              <p className="text-xs text-white/40">
                Nu există încă meciuri viitoare pentru selecțiile tale.
              </p>
            )}
            {!fixturesLoading && nextFixtures.length > 0 && (
              <ul className="space-y-2">
                {nextFixtures.map((f) => {
                  const w = weatherByHash[f.hash];
                  return (
                    <li
                      key={`${f.groupId}-${f.hash}`}
                      className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-lime-300/80">
                            {groupLabel(f.groupId)}
                          </div>
                          <div className="text-sm font-semibold text-white">
                            {f.team}{" "}
                            <span className="text-white/40 font-normal">vs</span>{" "}
                            {f.opponent}
                          </div>
                          {f.location && (
                            <div className="text-[11px] text-white/40">{f.location}</div>
                          )}
                        </div>
                        <div className="text-[11px] text-white/55 text-right whitespace-nowrap">
                          {formatDate(f.dateISO)}
                        </div>
                      </div>
                      {w && <MatchWeatherBlock weather={w} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <div className="mt-5 grid gap-3">
          <input
            className="w-full rounded-xl px-3 py-3 bg-pitch-800/80 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
            placeholder="Emailul tău"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            autoComplete="email"
          />
          <button
            type="button"
            onClick={subscribe}
            className="w-full rounded-xl px-4 py-3 bg-lime-400 hover:bg-lime-300 text-pitch-950 font-semibold text-sm transition"
          >
            Abonează-mă · {totalSelected} {totalSelected === 1 ? "echipă" : "echipe"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-pitch-900/80 backdrop-blur-md p-4 sm:p-6">
        <h2 className="font-display text-lg text-white">Dezabonare</h2>
        <p className="text-xs text-white/45 mt-1 mb-3">
          Introdu același email folosit la abonare.
        </p>
        <input
          className="w-full rounded-xl px-3 py-3 bg-pitch-800/80 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-400/30"
          placeholder="Email"
          value={idToUnsub}
          onChange={(e) => setIdToUnsub(e.target.value)}
        />
        <button
          type="button"
          onClick={unsubscribe}
          className="mt-3 w-full rounded-xl px-4 py-3 bg-red-500/90 hover:bg-red-400 text-white font-semibold text-sm transition"
        >
          Dezabonează-mă
        </button>
      </section>

      {msg && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium ${
            msg.includes("✅")
              ? "bg-lime-400/10 border border-lime-400/30 text-lime-100"
              : "bg-red-500/10 border border-red-400/30 text-red-100"
          }`}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
