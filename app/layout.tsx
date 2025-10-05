import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "⚽ AMFB Notifier - Grupa 2014 Galben",
  description: "Notificări email pentru programul echipelor de minifotbal din Grupa 2014 Galben (AMFB) - doar meciuri viitoare.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}