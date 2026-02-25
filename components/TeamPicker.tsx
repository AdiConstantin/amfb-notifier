 "use client";
import { useMemo, useState, useEffect } from "react";

const DEFAULT_TEAMS = [
  "Raiders",
  "ACS Juniorul 2014 – 1",
  "ACS Juniorul 2014 – 2",
  "DNG",
];

export default function TeamPicker({ value, onChange }:{ 
  value: string[]; 
  onChange: (teams: string[]) => void; 
}) {
  const [q, setQ] = useState("");
  const [teams, setTeams] = useState<string[]>(DEFAULT_TEAMS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/teams');
        if (response.ok) {
          const data = await response.json();
          // Combină echipele din API cu cele default, elimină duplicatele
          const allTeams = [...new Set([...DEFAULT_TEAMS, ...data.teams])].sort((a, b) => 
            a.localeCompare(b, 'ro')
          );
          setTeams(allTeams);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        // Păstrează DEFAULT_TEAMS în caz de eroare
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const shown = useMemo(() => teams.filter(t => t.toLowerCase().includes(q.toLowerCase())), [teams, q]);

  const toggle = (t: string) =>
    value.includes(t) ? onChange(value.filter(x => x !== t)) : onChange([...value, t]);

  return (
    <div className="space-y-2">
      <input
        className="w-full rounded-xl px-3 py-2 bg-neutral-900 border border-neutral-700"
        placeholder="Caută echipă..."
        value={q}
        onChange={e=>setQ(e.target.value)}
        disabled={loading}
      />
      {loading && (
        <p className="text-xs text-neutral-400">Se încarcă echipele...</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {shown.map(t => (
          <button key={t}
            onClick={()=>toggle(t)}
            disabled={loading}
            className={`rounded-xl px-3 py-2 border ${value.includes(t) ? "border-emerald-400" : "border-neutral-700"} bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50`}>
            {t}
          </button>
        ))}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-neutral-400">Selectate: {value.join(", ")}</p>
      )}
    </div>
  );
}