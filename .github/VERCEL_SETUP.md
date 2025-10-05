# GitHub Actions - Vercel Deploy Setup

## 🔐 Configurare Secrets în GitHub

Pentru ca GitHub Actions să funcționeze cu Vercel, trebuie să adaugi următoarele secrets în repository:

### 1. Accesează GitHub Repository Settings
- Mergi la `https://github.com/AdiConstantin/amfb-notifier`
- Click pe **Settings** → **Secrets and variables** → **Actions**
- Click pe **New repository secret**

### 2. Adaugă următoarele secrets:

#### `VERCEL_TOKEN`
- Mergi la [Vercel Account Settings](https://vercel.com/account/tokens)
- Click pe **Create Token**
- Numele: `GitHub Actions - AMFB Notifier`
- Scope: **Full Account**
- Copiază token-ul și adaugă-l ca secret

#### `VERCEL_ORG_ID`
```
team_16KqR80wEX6s2TliVr8hNUG2
```

#### `VERCEL_PROJECT_ID`
```
prj_Go84scgrWPpkg1lwb548Lr908zUP
```

## 🚀 Cum funcționează workflow-ul

### Deploy-uri automate:
- **Push pe `main`** → Deploy în **Production**
- **Pull Request** → Deploy **Preview** pentru testare
- **Build cache** pentru deploy-uri mai rapide

### CI Pipeline:
- **Linting** cu ESLint
- **Type checking** cu TypeScript  
- **Build test** pentru verificare

## 📋 Comenzi utile

```bash
# Verifică build local
npm run build

# Verifică linting
npm run lint

# Deploy manual cu Vercel CLI
npx vercel --prod
```

## 🔧 Configurare opțională

### Environment Variables în Vercel
Asigură-te că următoarele variabile sunt setate în Vercel Dashboard:

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
RESEND_API_KEY=...
RESEND_FROM=...
```

### Branch Protection (Recomandat)
În GitHub Settings → Branches:
- Protejează branch-ul `main`
- Cere PR reviews
- Cere status checks (CI) să treacă