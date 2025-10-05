#!/bin/bash

# Script pentru configurarea rapidă a GitHub Secrets pentru Vercel Deploy
# Rulează: bash setup-secrets.sh

echo "🔐 GitHub Secrets Setup pentru AMFB Notifier"
echo "=============================================="
echo ""

echo "📋 Secrets necesare:"
echo ""
echo "1. VERCEL_TOKEN"
echo "   • Obține de la: https://vercel.com/account/tokens"
echo "   • Scope: Full Account"
echo ""
echo "2. VERCEL_ORG_ID"
echo "   • Valoare: team_16KqR80wEX6s2TliVr8hNUG2"
echo ""
echo "3. VERCEL_PROJECT_ID" 
echo "   • Valoare: prj_Go84scgrWPpkg1lwb548Lr908zUP"
echo ""

echo "🌐 Link-uri utile:"
echo "• GitHub Secrets: https://github.com/AdiConstantin/amfb-notifier/settings/secrets/actions"
echo "• Vercel Tokens: https://vercel.com/account/tokens"
echo "• Vercel Project: https://vercel.com/adiconstantin/amfb-notifier"
echo ""

echo "✅ După configurare:"
echo "• Push pe main → Deploy production"
echo "• Pull Request → Deploy preview" 
echo "• Monitoring în GitHub Actions tab"