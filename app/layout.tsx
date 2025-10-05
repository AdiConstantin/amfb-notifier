import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "⚽ AMFB Notifier - Grupa 2014 Galben | Notificări Minifotbal",
  description: "Primește notificări email automate când se schimbă programul echipelor de minifotbal din Grupa 2014 Galben (AMFB). Monitorizare 24/7 pentru schimbări de oră sau adversar.",
  keywords: [
    "AMFB", "minifotbal", "notificări", "programul meciurilor", 
    "Grupa 2014 Galben", "fotbal", "Sud Arena", "email notificari",
    "amfb.ro", "competitii minifotbal", "echipe fotbal"
  ],
  authors: [{ name: "Adrian Constantin", url: "https://adrianconstantin.ro" }],
  creator: "Adrian Constantin",
  publisher: "Adrian Constantin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://amfb.adrianconstantin.ro'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "⚽ AMFB Notifier - Notificări Programul Echipelor de Minifotbal",
    description: "Primește notificări email automate când se schimbă programul echipelor de minifotbal din Grupa 2014 Galben (AMFB).",
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://amfb.adrianconstantin.ro',
    siteName: "AMFB Notifier",
    locale: "ro_RO",
    type: "website",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AMFB Notifier - Notificări pentru programul echipelor de minifotbal',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "⚽ AMFB Notifier - Notificări Minifotbal",
    description: "Notificări email automate pentru programul echipelor de minifotbal din Grupa 2014 Galben (AMFB).",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AMFB Notifier',
    description: 'Aplicație pentru notificări email automate despre programul echipelor de minifotbal din Grupa 2014 Galben (AMFB)',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://amfb.adrianconstantin.ro',
    applicationCategory: 'Sports',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'RON',
      description: 'Serviciu gratuit de notificări email'
    },
    author: {
      '@type': 'Person',
      name: 'Adrian Constantin',
      url: 'https://adrianconstantin.ro'
    },
    provider: {
      '@type': 'Organization',
      name: 'Adrian Constantin',
      url: 'https://adrianconstantin.ro'
    },
    inLanguage: 'ro-RO',
    audience: {
      '@type': 'Audience',
      audienceType: 'Jucători și fani de minifotbal din România'
    }
  };

  return (
    <html lang="ro">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}