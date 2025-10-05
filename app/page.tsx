import SubscriptionForm from "@/components/SubscriptionForm";

export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">⚽ AMFB Notifier - Grupa 2014 Galben</h1>
          <h2 className="text-2xl font-bold">Sud Arena | Duminica</h2>
          <a className="text-sm underline" href="https://amfb.ro/competitii/campionat-minifotbal/grupa-2013-albastru/" target="_blank">Pagina AMFB</a>
        </header>
        <p className="text-neutral-400">
          Notificări când se schimbă <span className="font-semibold">ora</span> sau <span className="font-semibold">adversarul</span> (doar viitor).
          Include auto-descoperire echipe și contor live de abonați.
        </p>
        <SubscriptionForm />
        <footer className="pt-8 text-xs text-neutral-500">
          Made by <a href="https://adrianconstantin.ro" target="_blank" rel="noopener noreferrer">adrianconstantin.ro</a> • Vercel Cron (daily) • Upstash Redis KV storage
        </footer>
      </div>
    </main>
  );
}