# AMFB Notifier ⚽

**Sistem de notificări automate pentru programul echipelor de minifotbal AMFB**

Aplicație Next.js care monitorizează modificările în programul echipelor din **Grupa 2014 Galben** (AMFB) și trimite notificări email când se schimbă ora sau adversarul meciurilor.

## ⚡ Funcționalități

Notifică pe email când se schimbă ora sau adversarul echipelor selectate (Grupa 2014 Galben, AMFB). Include:
- ⚽ **Auto-descoperire echipe** din pagina AMFB
- 📧 **Notificări email** prin Resend API cu domeniu personalizat  
- 📊 **Statistici live** - contor abonați cu polling la 15s
- 🔍 **Diff inteligent** (ora/adversar, plus meciuri adăugate/șterse)
- ⚙️ **Confirmare email** pentru abonare/dezabonare
- 🔄 **Cron orar** via Vercel pentru monitorizare automată

## 🛠️ Stack tehnic

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: API Routes, Upstash Redis, Zod validation  
- **Email**: Resend API cu domeniu personalizat
- **Deployment**: Vercel cu cron jobs + GitHub Actions
- **CI/CD**: Automated testing și deploy pe push
- **Scraping**: Cheerio pentru AMFB.ro

## 🚀 Setup local

```bash
pnpm i # sau npm i / yarn
cp .env.local.example .env.local
pnpm dev
```

Completează `.env.local` cu cheile Redis + Resend.

## 🚀 Deploy pe Vercel

### Opțiunea 1: GitHub Actions (Recomandat)
1. Fork/clone repository-ul pe GitHub
2. Configurează secrets în GitHub (vezi `.github/VERCEL_SETUP.md`)
3. Push pe `main` → deploy automat în production
4. Pull Request → deploy preview pentru testare

### Opțiunea 2: Manual
1. Importă repo-ul în Vercel.
2. Storage → Add Upstash Redis → atașează la proiect.
3. Environment Variables → adaugă cheile din `.env.local` (nu comite fișierul!).
4. Settings → Cron Jobs → confirmă ruta `/api/cron` sau ajustează intervalul.
5. Domains → adaugă domeniul tău personalizat (vezi pașii de mai jos).

## 🌐 Configurare domeniu personalizat

- În Vercel → Project → Settings → Domains → **Add** → `your-domain.com`.
- La registrar (unde îți este domeniul), setează:
  - **CNAME** pentru `www` → `cname.vercel-dns.com`.
  - **ALIAS/Apex** (root) → folosește A/AAAA oferite de Vercel sau un CNAME flattening.
- Redirect root ↔ www din Vercel (Redirects).

## 🔒 Siguranță la open-source

- Nu comite niciodată secrete (.env). Folosește `.env.local.example` ca template.
- Setează `RESEND_FROM` la un domeniu pe care îl controlezi.
- Poți activa rate limiting la `/api/subscribe` dacă proiectul devine popular.
- Scraping prietenos: cron orar pe o pagină publică.

## � SEO & Analytics Setup

### Google Search Console
1. Adaugă proprietatea în [Google Search Console](https://search.google.com/search-console/)
2. Verifică domeniul prin DNS sau HTML tag
3. Trimite sitemap: `https://your-domain.com/sitemap.xml`

### Environment Variables pentru SEO
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
GOOGLE_SITE_VERIFICATION=your-verification-code
```

### Features SEO incluse:
- ✅ **Metadata completă** cu Open Graph și Twitter Cards
- ✅ **Structured Data** (JSON-LD) pentru motoarele de căutare
- ✅ **Sitemap automat** generat la `/sitemap.xml`
- ✅ **Robots.txt** optimizat la `/robots.txt`
- ✅ **Open Graph image** generat dinamic
- ✅ **Semantic HTML** cu aria-labels și heading hierarchy
- ✅ **Performance headers** și compresie

## �📋 Environment Variables

```bash
# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Resend Email
RESEND_API_KEY=
RESEND_FROM=notify@your-domain.com

# SEO & Analytics
NEXT_PUBLIC_APP_URL=https://your-domain.com
GOOGLE_SITE_VERIFICATION=your-verification-code
```

---

*Dezvoltat pentru comunitatea de minifotbal din România* ⚽🇷🇴