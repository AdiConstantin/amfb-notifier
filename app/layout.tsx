import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AMFB Notifier | Nu rata schimbările de program",
  description:
    "Alege grupa și echipele de minifotbal AMFB. Primești email când se schimbă ora sau adversarul - plus prognoză pentru următorul meci.",
  keywords: [
    "AMFB",
    "minifotbal",
    "notificări",
    "program meciuri",
    "2014 Seria I",
    "2015 Seria I",
    "Coresi",
    "Juniorii Viitorului",
  ],
  authors: [{ name: "Adrian Constantin", url: "https://adrianconstantin.ro" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://amfb.adrianconstantin.ro"),
  openGraph: {
    title: "AMFB Notifier | Nu rata schimbările de program",
    description:
      "Notificări email pentru programul echipelor de minifotbal AMFB - mai multe grupe, un singur abonament.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://amfb.adrianconstantin.ro",
    siteName: "AMFB Notifier",
    locale: "ro_RO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AMFB Notifier",
    description: "Notificări email pentru programul de minifotbal AMFB.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
