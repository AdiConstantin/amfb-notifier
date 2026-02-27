 "use client";
import { useEffect, useState } from "react";
import TeamPicker from "./TeamPicker";
import type { Fixture } from "@/lib/types";

export default function SubscriptionForm() {
  const [email, setEmail] = useState("");
  const [teams, setTeams] = useState<string[]>(["Raiders"]);
  const [idToUnsub, setIdToUnsub] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [nextFixtures, setNextFixtures] = useState<Fixture[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixturesError, setFixturesError] = useState<string | null>(null);

  useEffect(() => {
    // contor "în timp real" via polling
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
        }
      } catch {
        if (!cancelled) {
          setNextFixtures([]);
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
        setTeams(["Raiders"]);
      } else {
        setMsg(`❌ Eroare: ${JSON.stringify(data.error)}`);
      }
    } catch (error) {
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
    } catch (error) {
      setMsg("❌ Eroare de conexiune. Încearcă din nou.");
    }
  }

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
              <p className="text-xs text-neutral-400">
                Se încarcă meciurile...
              </p>
            )}
            {fixturesError && !fixturesLoading && (
              <p className="text-xs text-red-400">{fixturesError}</p>
            )}
            {!fixturesLoading &&
              !fixturesError &&
              nextFixtures.length === 0 && (
                <p className="text-xs text-neutral-500">
                  Nu există încă meciuri viitoare pentru echipele selectate.
                </p>
              )}
            {!fixturesLoading && nextFixtures.length > 0 && (
              <ul className="mt-2 space-y-2 text-xs text-neutral-200">
                {nextFixtures.map((f) => (
                  <li
                    key={f.hash}
                    className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2"
                  >
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
        <input className="w-full rounded-xl px-3 py-2 bg-neutral-800 border border-neutral-700"
               placeholder="Email" value={idToUnsub} onChange={e=>setIdToUnsub(e.target.value)} />
        <button onClick={unsubscribe}
                className="mt-4 w-full rounded-xl px-4 py-2 bg-red-500 hover:bg-red-400 text-black font-semibold">
          Dezabonează-mă
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          msg.includes('✅') 
            ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-300' 
            : 'bg-red-900/30 border border-red-700 text-red-300'
        }`}>
          {msg}
        </div>
      )}
    </div>
  );
}