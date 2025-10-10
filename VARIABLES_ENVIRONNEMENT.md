# Variables d'Environnement pour le Déploiement

## ⚠️ IMPORTANT : Créez ces variables dans Vercel

Lorsque vous déployez sur Vercel, ajoutez ces variables d'environnement dans les paramètres du projet :

### Supabase (OBLIGATOIRE)
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role_supabase
```

### Stripe (OBLIGATOIRE - utilisez vos clés TEST au début)
```
STRIPE_SECRET_KEY=sk_test_votre_clé_stripe_secret
STRIPE_PRICE_ID=price_votre_price_id
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret
```

**Note** : Le `STRIPE_WEBHOOK_SECRET` sera généré APRÈS votre premier déploiement, quand vous configurerez le webhook Stripe pointant vers votre URL Vercel.

### URLs (OPTIONNEL - Vercel les génère automatiquement)
```
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
NEXT_PUBLIC_SITE_URL=https://votre-app.vercel.app
```

### Google Maps (OBLIGATOIRE pour la recherche de pros)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_clé_google_maps
```

## 📝 Où trouver ces valeurs ?

### Supabase
1. Connectez-vous à [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Copiez :
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (secret!) → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe (Mode TEST)
1. Connectez-vous à [stripe.com](https://stripe.com)
2. Activez le **mode TEST** (toggle en haut)
3. Allez dans **Developers** > **API keys**
4. Copiez la `Secret key` → `STRIPE_SECRET_KEY`
5. Créez un produit/prix et copiez son ID → `STRIPE_PRICE_ID`

### Google Maps
1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Créez un projet ou sélectionnez-en un
3. Activez l'API **Maps JavaScript API** et **Places API**
4. Créez une clé API
5. Copiez la clé → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## 🔒 Sécurité

- ✅ Ne commitez JAMAIS ces valeurs dans Git
- ✅ Utilisez toujours les clés Stripe TEST en développement
- ✅ Gardez `SUPABASE_SERVICE_ROLE_KEY` secret (ne l'exposez jamais côté client)
- ✅ Configurez les restrictions d'API pour Google Maps (référents HTTP)

