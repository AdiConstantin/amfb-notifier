import SubscriptionForm from "@/components/SubscriptionForm";
import { AMFB_GROUPS } from "@/lib/config";

function FootballPlanet() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient id="ballShade" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e8f5dc" />
          <stop offset="45%" stopColor="#9fbf7a" />
          <stop offset="100%" stopColor="#1a2e18" />
        </radialGradient>
        <radialGradient id="ballGlow" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="rgba(163,230,53,0)" />
          <stop offset="100%" stopColor="rgba(163,230,53,0.12)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="url(#ballShade)" />
      <circle cx="100" cy="100" r="92" fill="url(#ballGlow)" />
      {/* pentagon + seams - stylized, readable even when blurred */}
      <path
        d="M100 48 L118 62 L111 84 L89 84 L82 62 Z"
        fill="#0c1a10"
        opacity="0.85"
      />
      <path
        d="M100 48 L118 62 L140 52 L128 28 L100 28 Z"
        fill="none"
        stroke="#0c1a10"
        strokeWidth="3.5"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M118 62 L111 84 L132 102 L148 84 L140 52 Z"
        fill="none"
        stroke="#0c1a10"
        strokeWidth="3.5"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M111 84 L89 84 L78 108 L100 124 L122 108 Z"
        fill="none"
        stroke="#0c1a10"
        strokeWidth="3.5"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M89 84 L82 62 L60 52 L52 84 L78 108 Z"
        fill="none"
        stroke="#0c1a10"
        strokeWidth="3.5"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M82 62 L60 52 L72 28 L100 28 L100 48 Z"
        fill="none"
        stroke="#0c1a10"
        strokeWidth="3.5"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M52 84 L40 110 L58 140 L78 108 Z"
        fill="none"
        stroke="#0c1a10"
        strokeWidth="3"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M122 108 L142 140 L160 110 L148 84 Z"
        fill="none"
        stroke="#0c1a10"
        strokeWidth="3"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M78 108 L58 140 L100 168 L142 140 L122 108 L100 124 Z"
        fill="none"
        stroke="#0c1a10"
        strokeWidth="3"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <ellipse cx="72" cy="70" rx="28" ry="18" fill="rgba(255,255,255,0.12)" />
    </svg>
  );
}

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pitch-scene" aria-hidden>
        <div className="pitch-grass" />
        <div className="pitch-lines" />
        <div className="pitch-center-circle" />
        <div className="planet-orbit">
          <div className="planet-spin">
            <FootballPlanet />
          </div>
        </div>
        <div className="pitch-vignette" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <header className="space-y-5 text-center sm:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-lime-400/25 bg-lime-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-lime-200/90">
            AMFB Notifier
          </p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight text-white">
            Programul se schimbă.
            <span className="block text-lime-300">Tu afli primul.</span>
          </h1>
          <p className="text-base sm:text-lg text-white/60 max-w-xl mx-auto sm:mx-0">
            Alege grupa, bifează echipele, lasă emailul. Primești notificare când se
            schimbă ora sau adversarul - plus prognoză pentru următorul meci.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs text-white/45">
            {AMFB_GROUPS.map((g) => (
              <span
                key={g.id}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1"
              >
                {g.shortLabel} · {g.matchDay}
              </span>
            ))}
          </div>
        </header>

        <SubscriptionForm />

        <footer className="pt-2 pb-6 text-center sm:text-left text-xs text-white/35 space-y-2">
          <p>
            Dezvoltat de{" "}
            <a
              href="https://adrianconstantin.ro"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-lime-300"
            >
              Adrian Constantin
            </a>
          </p>
          <p>Date oficiale AMFB · Prognoză Open-Meteo</p>
        </footer>
      </div>
    </main>
  );
}
