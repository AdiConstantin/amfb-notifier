# GitHub Actions - Vercel Deploy Setup

## 🔐 Configurare Secrets în GitHub

Pentru ca GitHub Actions să funcționeze cu Vercel, trebuie să adaugi următoarele secrets în repository:

### 1. Accesează GitHub Repository Settings
- Mergi la `https://github.com/AdiConstantin/amfb-notifier`
- Click pe **Settings** → **Secrets and variables** → **Actions**
- Click pe **New repository secret**

### 2. Adaugă următoarele secrets:

⚠️ **IMPORTANT**: Toate 3 secrets-urile TREBUIE setate pentru ca GitHub Actions să funcționeze!

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

### 3. Verifică că secrets-urile sunt setate:
În GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Trebuie să vezi toate 3:
- ✅ `VERCEL_TOKEN` 
- ✅ `VERCEL_ORG_ID`
- ✅ `VERCEL_PROJECT_ID`

## 🚀 Cum funcționează workflow-ul

### Workflow simplificat CI/CD:
- **Un singur workflow** care rulează secvențial (evită conflictele)
- **CI Steps**: Linting, Type checking, Build testing cu mock env vars
- **CD Steps**: Deploy direct cu Vercel CLI (fără pull/build intermediar)
- **Push pe `main`** → Deploy în **Production**  
- **Pull Request** → Deploy **Preview** pentru testare
- **Build cache** pentru deploy-uri mai rapide

### Avantaje față de workflow-uri complexe:
- ✅ **Nu mai sunt conflicte** între workflow-uri paralele
- ✅ **Vercel CLI direct** fără steps intermediari problematici
- ✅ **Environment variables** din Vercel sunt preluate automat la deploy
- ✅ **Debugging mai ușor** - mai puține step-uri care pot crăpa
- ✅ **Deploy rapid** - direct din source code

## 📋 Comenzi utile

```bash
# Verifică build local
npm run build

# Verifică linting
npm run lint

# Deploy manual cu Vercel CLI (backup)
npx vercel --prod
```

## 🔧 Troubleshooting

### Dacă GitHub Actions nu funcționează:
1. Verifică că toate secrets sunt setate corect
2. Asigură-te că token-ul Vercel nu a expirat
3. Verifică logs-urile în GitHub Actions tab
4. Poți face deploy manual cu `vercel --prod` ca backup

### Dacă deploy-ul manual funcționează dar GitHub Actions nu:
- Problemă de permissions în token-ul Vercel
- Regenerează token-ul cu scope **Full Account**