# 🚀 Guide de Déploiement sur Vercel - EKICARE V3

## ✅ Statut : PRÊT À DÉPLOYER

Votre projet compile avec **0 erreur** et toutes les **38 pages** sont générées avec succès !

---

## 📝 **ÉTAPE 1 : Commit et Push sur GitHub**

```bash
# Dans votre terminal, depuis le dossier du projet :
cd /Users/tiberefillie/Desktop/EKICARE/ekicare-v3

# Ajouter tous les fichiers
git add .

# Commit avec un message descriptif
git commit -m "feat: Projet prêt pour production - Build optimisé pour Vercel"

# Push sur votre branche
git push origin clean/ui-ux-improvements-2025-10-01

# (Optionnel) Si vous voulez déployer depuis main :
# git checkout main
# git merge clean/ui-ux-improvements-2025-10-01
# git push origin main
```

---

## 🌐 **ÉTAPE 2 : Créer un compte Vercel (si pas déjà fait)**

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"**
3. Connectez-vous avec votre compte **GitHub**

---

## 🚀 **ÉTAPE 3 : Importer votre projet**

1. Sur le dashboard Vercel, cliquez sur **"Add New..."** → **"Project"**
2. **Autorisez Vercel** à accéder à vos repositories GitHub
3. **Sélectionnez** votre repository `ekicare-v3`
4. Cliquez sur **"Import"**

---

## ⚙️ **ÉTAPE 4 : Configuration du Projet**

### Framework Preset
- Vercel détecte automatiquement **Next.js** ✅

### Build & Output Settings
- **Build Command**: `npm run build` (déjà configuré) ✅
- **Output Directory**: `.next` (par défaut) ✅
- **Install Command**: `npm install` (par défaut) ✅

### Root Directory
- Laissez vide (`.` par défaut) ✅

---

## 🔐 **ÉTAPE 5 : Ajouter les Variables d'Environnement**

**TRÈS IMPORTANT** : Cliquez sur **"Environment Variables"** et ajoutez :

### Variables Supabase (OBLIGATOIRE)
```
NEXT_PUBLIC_SUPABASE_URL = https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...votre_clé_anon
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...votre_clé_service_role
```

### Variables Stripe (OBLIGATOIRE)
```
STRIPE_SECRET_KEY = sk_test_...votre_clé_stripe_test
STRIPE_PRICE_ID = price_...votre_price_id
```

**Note** : Le `STRIPE_WEBHOOK_SECRET` sera ajouté **APRÈS** le premier déploiement.

### Variables Google Maps (OBLIGATOIRE)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIza...votre_clé_google
```

### 📋 **Où trouver vos clés** :

#### Supabase
1. [supabase.com](https://supabase.com) → Votre projet
2. **Settings** → **API**
3. Copiez :
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

#### Stripe (Mode TEST)
1. [stripe.com](https://stripe.com) → Mode **TEST** (toggle en haut)
2. **Developers** → **API keys**
3. Copiez la `Secret key` → `STRIPE_SECRET_KEY`
4. Créez un produit → Copiez le `Price ID` → `STRIPE_PRICE_ID`

#### Google Maps
1. [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. Copiez votre clé API → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## 🎯 **ÉTAPE 6 : Déployer !**

1. Une fois les variables ajoutées, cliquez sur **"Deploy"**
2. Vercel va :
   - ✅ Installer les dépendances
   - ✅ Builder votre projet
   - ✅ Déployer automatiquement
   - ⏱️ Durée : ~3-5 minutes

3. Vous obtiendrez une URL comme : **`https://ekicare-v3.vercel.app`**

---

## 🔗 **ÉTAPE 7 : Configurer le Webhook Stripe (APRÈS le déploiement)**

**Attendez que le déploiement soit terminé**, puis :

1. Allez dans votre **Dashboard Stripe**
2. **Developers** → **Webhooks**
3. Cliquez sur **"Add endpoint"**
4. URL du webhook : `https://votre-app.vercel.app/api/stripe/webhook`
5. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Cliquez sur **"Add endpoint"**
7. **Copiez la "Signing secret"** (`whsec_...`)

8. Retournez sur Vercel :
   - **Settings** → **Environment Variables**
   - Ajoutez : `STRIPE_WEBHOOK_SECRET` = `whsec_...`
   - Cliquez sur **"Save"**

9. Vercel **redéploiera automatiquement** avec cette nouvelle variable

---

## 🔧 **ÉTAPE 8 : Configurer Supabase pour la Production**

Dans votre projet Supabase :

1. **Authentication** → **URL Configuration**
2. Ajoutez votre URL Vercel aux **"Redirect URLs"** :
   ```
   https://votre-app.vercel.app/dashboard/pro
   https://votre-app.vercel.app/dashboard/proprietaire
   https://votre-app.vercel.app/**
   ```

3. **Authentication** → **Email Templates**
   - Changez les URLs des emails pour pointer vers votre domaine Vercel

---

## 🌐 **ÉTAPE 9 : Connecter votre Nom de Domaine (Optionnel)**

Si vous avez un nom de domaine (ex: `ekicare.fr`) :

1. Sur Vercel : **Settings** → **Domains**
2. Cliquez sur **"Add"**
3. Entrez votre domaine : `ekicare.fr`
4. Suivez les instructions pour configurer les **DNS**
5. Vercel générera automatiquement un **certificat SSL** ✅

---

## ✅ **Checklist Finale**

Avant de cliquer sur "Deploy" :

- [ ] ✅ Code pushé sur GitHub
- [ ] ✅ Toutes les variables d'environnement ajoutées dans Vercel
- [ ] ✅ Build local réussit (`npm run build`)
- [ ] ✅ Fichier `.env.local` **N'EST PAS** commité (vérifié par `.gitignore`)

Après le déploiement :

- [ ] Webhook Stripe configuré
- [ ] Redirect URLs Supabase configurées
- [ ] Test d'inscription PRO
- [ ] Test d'inscription PROPRIO
- [ ] Test de prise de rendez-vous
- [ ] Test du paiement Stripe (mode TEST)

---

## 🎯 **Commandes Utiles**

```bash
# Voir les logs de déploiement en temps réel
# → Disponible sur Vercel Dashboard

# Forcer un redéploiement
# → Sur Vercel : Deployments > ... > Redeploy

# Variables d'environnement
# → Settings > Environment Variables
```

---

## 🆘 **En cas de problème**

### Erreur de Build sur Vercel
- Vérifiez que toutes les variables d'env sont présentes
- Regardez les logs de build dans l'onglet "Logs"

### Erreur 500 après déploiement
- Vérifiez les variables Supabase
- Vérifiez dans les "Runtime Logs" de Vercel

### Paiement Stripe ne fonctionne pas
- Vérifiez que le webhook est bien configuré
- Vérifiez le `STRIPE_WEBHOOK_SECRET`

---

## 📞 **Support**

- Documentation Vercel : [vercel.com/docs](https://vercel.com/docs)
- Documentation Next.js : [nextjs.org/docs](https://nextjs.org/docs)
- Stripe Webhooks : [stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)

---

## 🎉 **Vous êtes prêt !**

Votre projet est **production-ready**. Bon déploiement ! 🚀

