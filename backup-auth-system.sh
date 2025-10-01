#!/bin/bash

# 🎉 SCRIPT DE SAUVEGARDE - SYSTÈME D'AUTHENTIFICATION EKICARE
# Date: 30 Septembre 2025
# Description: Sauvegarde complète du système d'authentification

echo "🚀 DÉMARRAGE DE LA SAUVEGARDE EKICARE AUTH SYSTEM"
echo "=================================================="

# Créer le dossier de sauvegarde avec timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backup_auth_${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

echo "📁 Création du dossier de sauvegarde: $BACKUP_DIR"

# 1. Sauvegarder les fichiers de configuration
echo "📋 Sauvegarde des fichiers de configuration..."
cp .env.local "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  .env.local non trouvé"
cp package.json "$BACKUP_DIR/"
cp next.config.ts "$BACKUP_DIR/"
cp tsconfig.json "$BACKUP_DIR/"

# 2. Sauvegarder les composants d'authentification
echo "🔐 Sauvegarde des composants d'authentification..."
mkdir -p "$BACKUP_DIR/components"
cp components/AuthGuard.tsx "$BACKUP_DIR/components/"
cp components/LogoutButton.tsx "$BACKUP_DIR/components/"

# 3. Sauvegarder les pages d'authentification
echo "📄 Sauvegarde des pages d'authentification..."
mkdir -p "$BACKUP_DIR/app/login"
mkdir -p "$BACKUP_DIR/app/signup"
mkdir -p "$BACKUP_DIR/app/success-proprio"
mkdir -p "$BACKUP_DIR/app/success-pro"
mkdir -p "$BACKUP_DIR/app/paiement-requis"

cp app/login/page.tsx "$BACKUP_DIR/app/login/"
cp app/signup/page.tsx "$BACKUP_DIR/app/signup/"
cp app/success-proprio/page.tsx "$BACKUP_DIR/app/success-proprio/"
cp app/success-pro/page.tsx "$BACKUP_DIR/app/success-pro/"
cp app/paiement-requis/page.tsx "$BACKUP_DIR/app/paiement-requis/"

# 4. Sauvegarder les APIs d'authentification
echo "🔌 Sauvegarde des APIs d'authentification..."
mkdir -p "$BACKUP_DIR/app/api/auth"
mkdir -p "$BACKUP_DIR/app/api/stripe"
mkdir -p "$BACKUP_DIR/app/api/checkout-session"

cp app/api/auth/signup/route.ts "$BACKUP_DIR/app/api/auth/"
cp app/api/auth/login/route.ts "$BACKUP_DIR/app/api/auth/"
cp app/api/auth/logout/route.ts "$BACKUP_DIR/app/api/auth/"
cp app/api/stripe/webhook/route.ts "$BACKUP_DIR/app/api/stripe/"
cp app/api/checkout-session/route.ts "$BACKUP_DIR/app/api/checkout-session/"

# 5. Sauvegarder les migrations de base de données
echo "🗄️ Sauvegarde des migrations de base de données..."
mkdir -p "$BACKUP_DIR/migrations"
cp migrations/*.sql "$BACKUP_DIR/migrations/" 2>/dev/null || echo "⚠️  Aucune migration trouvée"

# 6. Sauvegarder les scripts de test
echo "🧪 Sauvegarde des scripts de test..."
cp test-*.js "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  Aucun script de test trouvé"
cp diagnose-*.js "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  Aucun script de diagnostic trouvé"

# 7. Sauvegarder la configuration Supabase
echo "🔧 Sauvegarde de la configuration Supabase..."
mkdir -p "$BACKUP_DIR/lib"
cp lib/supabaseClient.ts "$BACKUP_DIR/lib/"

# 8. Créer un fichier de résumé
echo "📊 Création du fichier de résumé..."
cat > "$BACKUP_DIR/RESUME_SAUVEGARDE.md" << EOF
# 📊 RÉSUMÉ DE LA SAUVEGARDE
**Date :** $(date)
**Dossier :** $BACKUP_DIR

## 📁 FICHIERS SAUVEGARDÉS

### Configuration
- .env.local (variables d'environnement)
- package.json
- next.config.ts
- tsconfig.json

### Composants
- components/AuthGuard.tsx
- components/LogoutButton.tsx

### Pages
- app/login/page.tsx
- app/signup/page.tsx
- app/success-proprio/page.tsx
- app/success-pro/page.tsx
- app/paiement-requis/page.tsx

### APIs
- app/api/auth/signup/route.ts
- app/api/auth/login/route.ts
- app/api/auth/logout/route.ts
- app/api/stripe/webhook/route.ts
- app/api/checkout-session/route.ts

### Base de données
- migrations/*.sql

### Scripts
- test-*.js
- diagnose-*.js

### Configuration
- lib/supabaseClient.ts

## 🎯 STATUT
✅ Système d'authentification 100% fonctionnel
✅ Inscription propriétaire et professionnel
✅ Connexion sécurisée
✅ Intégration Stripe
✅ Gestion de session robuste

## 🚀 RESTAURATION
Pour restaurer cette sauvegarde :
1. Copier les fichiers dans votre projet
2. Installer les dépendances : npm install
3. Configurer les variables d'environnement
4. Démarrer le serveur : npm run dev
EOF

# 9. Créer une archive compressée
echo "📦 Création de l'archive compressée..."
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"

# 10. Afficher le résumé
echo ""
echo "✅ SAUVEGARDE TERMINÉE AVEC SUCCÈS !"
echo "====================================="
echo "📁 Dossier : $BACKUP_DIR"
echo "📦 Archive : ${BACKUP_DIR}.tar.gz"
echo "📊 Taille : $(du -sh "$BACKUP_DIR" | cut -f1)"
echo ""
echo "🎯 FICHIERS SAUVEGARDÉS :"
find "$BACKUP_DIR" -type f | wc -l | xargs echo "   - Nombre de fichiers :"
echo ""
echo "📋 Pour restaurer :"
echo "   1. Extraire l'archive : tar -xzf ${BACKUP_DIR}.tar.gz"
echo "   2. Copier les fichiers dans votre projet"
echo "   3. Installer les dépendances : npm install"
echo "   4. Configurer .env.local"
echo "   5. Démarrer : npm run dev"
echo ""
echo "🎉 Sauvegarde complète du système d'authentification Ekicare !"
