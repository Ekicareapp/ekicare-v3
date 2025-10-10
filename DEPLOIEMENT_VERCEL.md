# 🚀 Guide de Déploiement sur Vercel - EKICARE V3

## ✅ Points Positifs

Votre projet est **presque prêt** pour le déploiement :
- ✅ Configuration Next.js 15 optimisée
- ✅ API routes fonctionnelles
- ✅ Intégration Supabase configurée
- ✅ Stripe en mode TEST (parfait pour commencer)
- ✅ Configuration sécurisée (headers, env vars)

## ⚠️ Actions Requises AVANT le Déploiement

### 1. Créer un `.env.local` avec vos VRAIES clés

Copiez `.env.example` et remplissez avec vos vraies valeurs :

```bash
cp .env.example .env.local
```

### 2. Push votre code sur GitHub/GitLab

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 3. Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "New Project"
3. Importez votre repository GitHub
4. **IMPORTANT** : Ajoutez les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY` (vos clés TEST pour commencer)
   - `STRIPE_PRICE_ID`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `STRIPE_WEBHOOK_SECRET` (vous le configurerez après)

5. Cliquez sur "Deploy"

### 4. Configurer le Webhook Stripe (APRÈS le déploiement)

Une fois déployé sur Vercel, vous aurez une URL comme `https://ekicare.vercel.app`

1. Allez dans votre Dashboard Stripe
2. Créez un webhook pointant vers : `https://ekicare.vercel.app/api/stripe/webhook`
3. Copiez la clé de signature du webhook
4. Ajoutez-la dans les variables d'environnement Vercel : `STRIPE_WEBHOOK_SECRET`
5. Redéployez (Vercel le fait automatiquement)

### 5. Configurer Supabase pour la Production

Dans votre projet Supabase :
1. Ajoutez l'URL Vercel aux "Redirect URLs" autorisées
2. Ajoutez l'URL dans la configuration CORS si nécessaire

### 6. Connecter votre Nom de Domaine (Optionnel)

Dans Vercel :
1. Allez dans Settings > Domains
2. Ajoutez votre nom de domaine
3. Suivez les instructions pour configurer les DNS

## 📋 Checklist Finale

- [ ] Toutes les variables d'environnement sont configurées dans Vercel
- [ ] Le webhook Stripe est configuré avec la bonne URL de production
- [ ] Les Redirect URLs Supabase incluent votre URL Vercel
- [ ] Le projet se déploie sans erreur
- [ ] Vous pouvez créer un compte de test
- [ ] Le paiement Stripe fonctionne (en mode TEST)

## 🔧 Note sur le Build Actuel

Il y a quelques warnings TypeScript (variables inutilisées, types `any`) mais ce sont des **warnings**, pas des erreurs bloquantes. Vercel peut déployer avec ces warnings.

Si vous voulez un build 100% clean avant de déployer, nous pouvons les corriger ensemble, mais ce n'est pas obligatoire pour déployer !

## 🎯 Recommandations

1. **Déployez d'abord** avec les clés Stripe TEST
2. **Testez** toutes les fonctionnalités en production
3. **Passez en production Stripe** seulement quand tout fonctionne parfaitement
4. **Activez les sauvegardes automatiques** Supabase

## 💡 Prochaines Étapes

Après le déploiement :
1. Testez l'inscription PRO et PROPRIO
2. Testez la prise de rendez-vous
3. Testez le paiement Stripe (mode TEST)
4. Vérifiez les emails Supabase
5. Configurez votre nom de domaine

---

**Vous êtes prêt ! 🎉**

