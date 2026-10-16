"use client";
import { useMemo, useState, useEffect } from "react";

export default function TeamPicker({
  value,
  onChange,
  teams,
  loading = false,
}: {
  value: string[];
  onChange: (teams: string[]) => void;
  teams: string[];
  loading?: boolean;
}) {
  const [q, setQ] = useState("");

  const shown = useMemo(
    () => teams.filter((t) => t.toLowerCase().includes(q.toLowerCase())),
    [teams, q]
  );

  const toggle = (t: string) =>
    value.includes(t) ? onChange(value.filter((x) => x !== t)) : onChange([...value, t]);

  return (
    <div className="space-y-3">
      <input
        className="w-full rounded-xl px-3 py-2.5 bg-pitch-800/80 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
        placeholder="Caută echipă..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={loading}
      />
      {loading && <p className="text-xs text-white/40">Se încarcă echipele...</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
        {shown.map((t) => {
          const selected = value.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              disabled={loading}
              className={`rounded-xl px-3 py-2.5 text-left text-sm border transition ${
                selected
                  ? "border-lime-400/70 bg-lime-400/10 text-lime-100"
                  : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
              } disabled:opacity-50`}
            >
              {t}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-white/45">Selectate: {value.join(", ")}</p>
      )}
    </div>
  );
}
