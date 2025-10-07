"use client";
import { useEffect, useState } from "react";
import TeamPicker from "./TeamPicker";

export default function SubscriptionForm() {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsApp] = useState(""); 
  const [teams, setTeams] = useState<string[]>(["Raiders"]);
  const [idToUnsub, setIdToUnsub] = useState(""); 
  const [msg, setMsg] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    // contor "în timp real" via polling
    const load = () => fetch("/api/stats").then(r=>r.json()).then(d=> setCount(d.count ?? 0)).catch(()=>{});
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  async function subscribe() {
    setMsg(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          email: email || undefined, 
          whatsapp: whatsapp || undefined,
          teams 
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMsg(data.message || "✅ Te-ai abonat cu succes!");
        // Resetează formularul după succes
        setEmail("");
        setWhatsApp("");
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
        body: JSON.stringify({ id: idToUnsub })
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
          <input className="rounded-xl px-3 py-2 bg-neutral-800 border border-neutral-700"
                 placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="rounded-xl px-3 py-2 bg-neutral-800 border border-neutral-700"
                 placeholder="WhatsApp în format +407xx..." value={whatsapp} onChange={e=>setWhatsApp(e.target.value)} />
        </div>
        <div className="mt-4">
          <TeamPicker value={teams} onChange={setTeams} />
        </div>
        <button onClick={subscribe}
                className="mt-4 w-full rounded-xl px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
          Abonează-mă
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">Dezabonare</h2>
        <input className="w-full rounded-xl px-3 py-2 bg-neutral-800 border border-neutral-700"
               placeholder="Email sau WhatsApp" value={idToUnsub} onChange={e=>setIdToUnsub(e.target.value)} />
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