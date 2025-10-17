# Template des Variables d'Environnement

## ⚠️ URGENT - Configuration Requise

Créez un fichier `.env.local` dans la racine du projet avec ce contenu :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role_supabase

# Stripe Configuration - REMPLACEZ PAR VOS VRAIES CLÉS
STRIPE_SECRET_KEY=sk_test_votre_clé_stripe_secret
STRIPE_PRICE_ID=price_votre_price_id
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret

# URLs de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google Maps (optionnel)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_clé_google_maps

# Beta toggle (bypass Stripe pour l'inscription pro)
# Mettre à true pour activer l'accès direct au dashboard pro et marquer les profils comme actifs/vérifiés (bêta)
BETA_MODE=true
NEXT_PUBLIC_BETA_MODE=true

# Features toggles
# Active/désactive le module de feedback en UI (laisser à false pour le déploiement actuel)
NEXT_PUBLIC_ENABLE_FEEDBACK=false
```

## 🚨 Problème Actuel
Les variables Stripe ne sont pas configurées, c'est pourquoi le paiement tourne à l'infini.

## 🔧 Étapes pour corriger

1. **Obtenir les clés Stripe** :
   - Connectez-vous à votre dashboard Stripe
   - Allez dans "Developers" > "API keys"
   - Copiez la clé secrète (sk_test_...)
   - Créez un produit/prix et copiez l'ID (price_...)

2. **Configurer le webhook** :
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   - Copiez la clé webhook affichée (whsec_...)

3. **Créer le fichier .env.local** avec les vraies valeurs

4. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```
