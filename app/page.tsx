import SubscriptionForm from "@/components/SubscriptionForm";
import { AMFB_GROUP_LABEL, AMFB_MATCH_DAY, AMFB_PAGE_URL, AMFB_VENUE, AMFB_VENUE_ADDRESS } from "@/lib/config";

export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-4">
  <h1 className="text-2xl font-bold">
    ⚽ AMFB Notifier - {AMFB_GROUP_LABEL}
  </h1>

  <div className="sm:text-right">
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        AMFB_VENUE_ADDRESS
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block group"
      aria-label={`Deschide ${AMFB_VENUE} în Google Maps`}
    >
      <h2 className="text-lg font-semibold group-hover:underline">
      📍 {AMFB_VENUE}
      </h2>
    </a>

    <time className="block text-sm text-neutral-400 mt-1">
      {AMFB_MATCH_DAY}
    </time>
  </div>

  <nav className="sm:text-right">
    <a
      className="text-sm underline hover:text-emerald-400 transition-colors"
      href={AMFB_PAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Vizitează pagina oficială AMFB pentru ${AMFB_GROUP_LABEL}`}
    >
      Pagina AMFB
    </a>
  </nav>
</header>
        
        <section className="space-y-4" aria-labelledby="description">
          <h2 id="description" className="sr-only">Descrierea serviciului</h2>
          <p className="text-neutral-400">
            Primești <strong>notificări email automate</strong> când se schimbă{" "}
            <span className="font-semibold text-emerald-400">ora</span> sau{" "}
            <span className="font-semibold text-emerald-400">adversarul</span> pentru meciurile viitoare.
          </p>
          <p className="text-sm text-neutral-500">
            Include auto-descoperire echipe și monitorizare zilnică a programului oficial.
          </p>
        </section>

        <section aria-labelledby="subscription-form">
          <h2 id="subscription-form" className="sr-only">Formular de abonare</h2>
          <SubscriptionForm />
        </section>

        <footer className="pt-8 border-t border-neutral-800">
          <div className="text-xs text-neutral-500 space-y-2">
            <p>
              Dezvoltat de{" "}
              <a 
                href="https://adrianconstantin.ro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-emerald-400 transition-colors"
              >
                Adrian Constantin
              </a>
            </p>
            <p className="flex gap-2 text-neutral-600">
              <span>🚀 Vercel Hosting</span>
              <span>•</span>
              <span>📧 Resend Email</span>
              <span>•</span>  
              <span>⚡ Upstash Redis</span>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}