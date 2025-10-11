# Guide Complet - Webhook Stripe sur Vercel

## 🎯 Problème Résolu

### Symptômes
- ✅ **En local** : Le paiement fonctionne, le webhook met à jour `is_verified` et `is_subscribed`, l'utilisateur accède au dashboard
- ❌ **En production** : Le paiement fonctionne, mais le webhook ne met pas à jour les champs, l'utilisateur est redirigé vers "paiement requis"

### Cause Racine
Le webhook Stripe en production peut échouer pour plusieurs raisons :
1. **Body parsing automatique** : Next.js parse le body, ce qui invalide la signature Stripe
2. **Mauvaise URL de webhook** : Le webhook pointe vers localhost au lieu du domaine Vercel
3. **Webhook secret incorrect** : Le secret ne correspond pas entre Stripe et Vercel
4. **Problème de timing** : Le webhook prend du temps à être traité
5. **Variables d'environnement manquantes** : `SUPABASE_SERVICE_ROLE_KEY` manquant

## ✅ Solutions Implémentées

### 1. Configuration Next.js pour le Webhook

**Fichier**: `app/api/stripe/webhook/route.ts`

```typescript
// IMPORTANT : Désactiver le bodyParser pour que Stripe puisse vérifier la signature
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

**Pourquoi ?** Next.js App Router peut parser automatiquement le body des requêtes, ce qui invalide la signature Stripe. Ces directives forcent l'utilisation du raw body.

### 2. Logs Détaillés

Le webhook inclut maintenant des logs détaillés préfixés par `[WEBHOOK]` pour faciliter le débogage en production :

```typescript
console.log('🔔 [WEBHOOK] Stripe webhook reçu')
console.log('🌐 [WEBHOOK] Environment:', process.env.NODE_ENV)
console.log('🔑 [WEBHOOK] Webhook secret présent:', !!webhookSecret)
// ... etc
```

**Pourquoi ?** Permet d'identifier exactement où le webhook échoue dans Vercel Functions logs.

### 3. Système de Polling Intelligent

**Fichier**: `app/success-pro/page.tsx`

La page de succès implémente un système de polling qui :
- ✅ Vérifie `is_verified` et `is_subscribed` toutes les secondes
- ✅ Attend jusqu'à 30 secondes maximum
- ✅ Affiche des messages de statut progressifs
- ✅ **Après 15 secondes**, déclenche une vérification manuelle via l'API

**Pourquoi ?** Résout le problème de timing entre le paiement et la mise à jour de la base de données.

### 4. Route API de Secours

**Fichier**: `app/api/auth/verify-payment/route.ts`

Une route de secours qui :
- ✅ Vérifie le paiement directement avec l'API Stripe
- ✅ Active manuellement le profil si le paiement est confirmé
- ✅ Cherche les abonnements actifs par email
- ✅ Bypasse le webhook si nécessaire

**Pourquoi ?** Solution de repli si le webhook échoue ou prend trop de temps.

### 5. Correction du Protocole HTTPS

**Fichier**: `app/api/checkout-session/route.ts`

```typescript
const isLocalhost = requestHost?.includes('localhost')
const protocol = isLocalhost ? 'http' : 'https'
const baseUrl = `${protocol}://${requestHost}`
```

**Pourquoi ?** Vercel nécessite HTTPS pour les webhooks, localhost utilise HTTP.

## 📋 Configuration Complète

### 1. Variables d'Environnement Vercel

Allez dans **Vercel Dashboard > Settings > Environment Variables** et ajoutez :

```bash
# Stripe (OBLIGATOIRE)
STRIPE_SECRET_KEY=sk_live_... # ou sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # ⚠️ DIFFERENT de localhost !
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # ou pk_test_...

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... # ⚠️ CRITIQUE pour le webhook !

# Site URL (OPTIONNEL mais recommandé)
NEXT_PUBLIC_SITE_URL=https://votre-domaine.vercel.app
```

**⚠️ ATTENTION** : 
- Le `STRIPE_WEBHOOK_SECRET` est **différent** entre local et production
- Le `SUPABASE_SERVICE_ROLE_KEY` est **obligatoire** pour que le webhook puisse modifier la base de données

### 2. Configuration du Webhook sur Stripe

#### a) Créer le Webhook

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Cliquez sur **"Add endpoint"**
3. **Endpoint URL** : `https://votre-domaine.vercel.app/api/stripe/webhook`
4. **Events to send** : Sélectionnez `checkout.session.completed`
5. Cliquez sur **"Add endpoint"**

#### b) Récupérer le Signing Secret

1. Cliquez sur le webhook que vous venez de créer
2. Dans la section **"Signing secret"**, cliquez sur **"Reveal"**
3. Copiez le secret (commence par `whsec_...`)
4. Ajoutez-le dans Vercel comme `STRIPE_WEBHOOK_SECRET`

#### c) Tester le Webhook

1. Dans le webhook Stripe, cliquez sur **"Send test webhook"**
2. Sélectionnez `checkout.session.completed`
3. Vérifiez que le statut est "Succeeded" (200)
4. Vérifiez les logs dans Vercel Functions

### 3. Vérifier la Configuration

Utilisez le script de test fourni :

```bash
node test-webhook-production.js
```

Ce script vérifie :
- ✅ Accessibilité du webhook
- ✅ Présence des variables d'environnement
- ✅ Instructions de test manuel

## 🧪 Tests Complets

### Test 1 : Webhook Accessible

```bash
curl -X POST https://votre-domaine.vercel.app/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Résultat attendu** : 
```json
{"error":"Missing stripe-signature header"}
```

✅ C'est normal ! Cela prouve que le webhook est accessible.

### Test 2 : Paiement Complet

1. Créez un compte pro sur votre site en production
2. Effectuez le paiement avec la carte de test Stripe :
   - **Numéro** : `4242 4242 4242 4242`
   - **Date** : N'importe quelle date future
   - **CVC** : N'importe quel 3 chiffres
3. Observez la page `success-pro` :
   - Vous devriez voir des messages de statut
   - Après quelques secondes : "Abonnement activé !"
   - Redirection automatique vers le dashboard

### Test 3 : Vérifier les Logs Vercel

1. Allez sur **Vercel Dashboard**
2. Sélectionnez votre projet
3. Cliquez sur **Deployments** puis sur votre déploiement actif
4. Cliquez sur **Functions**
5. Cliquez sur `/api/stripe/webhook`
6. Consultez les logs

**Logs attendus** :
```
🔔 [WEBHOOK] Stripe webhook reçu
✅ [WEBHOOK] Signature webhook vérifiée avec succès
💳 [WEBHOOK] Événement checkout.session.completed reçu
👤 [WEBHOOK] User ID trouvé: abc123...
✅ [WEBHOOK] Subscription activated for user: abc123...
```

### Test 4 : Vérifier dans Supabase

1. Allez dans votre **Supabase Dashboard**
2. Ouvrez **Table Editor** > `pro_profiles`
3. Trouvez l'utilisateur qui vient de payer
4. Vérifiez que :
   - ✅ `is_verified` = `true`
   - ✅ `is_subscribed` = `true`
   - ✅ `stripe_customer_id` est renseigné
   - ✅ `stripe_subscription_id` est renseigné
   - ✅ `subscription_start` a une date

## 🔧 Débogage

### Le webhook n'est jamais appelé

**Vérifications** :
1. ✅ L'URL du webhook sur Stripe pointe vers le bon domaine
2. ✅ Le webhook est activé (toggle ON)
3. ✅ L'événement `checkout.session.completed` est sélectionné
4. ✅ Pas de firewall ou proxy bloquant Stripe

**Solution** :
- Testez avec "Send test webhook" depuis Stripe Dashboard
- Vérifiez les logs de tentatives dans Stripe Dashboard

### Le webhook est appelé mais la signature échoue

**Erreur dans les logs** :
```
❌ [WEBHOOK] Signature verification FAILED
❌ [WEBHOOK] Error message: No signatures found matching the expected signature
```

**Vérifications** :
1. ✅ `STRIPE_WEBHOOK_SECRET` est correctement configuré sur Vercel
2. ✅ Le secret correspond au webhook (il y a un secret par webhook)
3. ✅ Vous avez redéployé après avoir ajouté la variable

**Solution** :
1. Récupérez le signing secret du webhook sur Stripe
2. Mettez à jour `STRIPE_WEBHOOK_SECRET` sur Vercel
3. Redéployez (ou attendez le redéploiement automatique)

### Le webhook fonctionne mais ne met pas à jour la DB

**Erreur dans les logs** :
```
❌ [WEBHOOK] Error updating pro_profiles
❌ [WEBHOOK] Error details: {"code":"42501","message":"permission denied"}
```

**Vérifications** :
1. ✅ `SUPABASE_SERVICE_ROLE_KEY` est configuré sur Vercel
2. ✅ Le user_id existe dans la table `users`
3. ✅ Le profil existe dans `pro_profiles`
4. ✅ Les RLS policies permettent l'update avec le service role

**Solution** :
1. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien la **Service Role Key** (pas l'anon key)
2. Cette clé bypasse les RLS policies
3. Redéployez après l'avoir ajoutée

### Le polling timeout (30 secondes)

**Message** :
```
⏰ [FALLBACK] Webhook lent, tentative de vérification manuelle...
```

**C'est normal !** La solution de secours s'active :
1. Le système appelle `/api/auth/verify-payment`
2. Vérifie directement avec Stripe
3. Active manuellement le profil si le paiement est confirmé

**Si ça continue à échouer** :
- Vérifiez les logs Stripe pour voir si le webhook est bien envoyé
- Vérifiez les logs Vercel pour voir les erreurs
- Contactez le support Stripe si les webhooks ne sont jamais livrés

### L'utilisateur est redirigé vers paiement-requis

**Scénario 1** : Le webhook n'a pas fonctionné du tout
- ✅ Vérifiez les logs Vercel
- ✅ Vérifiez les logs Stripe (webhooks > attempts)
- ✅ Vérifiez la configuration du webhook

**Scénario 2** : La vérification manuelle a aussi échoué
- ✅ Vérifiez que le paiement est bien "paid" sur Stripe
- ✅ Vérifiez que l'abonnement est actif
- ✅ Contactez le support

**Solution temporaire** :
Activez manuellement l'utilisateur dans Supabase :
```sql
UPDATE pro_profiles 
SET is_verified = true, 
    is_subscribed = true,
    subscription_start = NOW()
WHERE user_id = 'USER_ID_ICI';
```

## 📊 Schéma du Flow Complet

```
1. Utilisateur paie sur Stripe
   ↓
2. Stripe redirige vers /success-pro?session_id=cs_...
   ↓
3. Page success-pro lance le polling
   ├─ Tentative 1-14 : Vérifie is_verified & is_subscribed
   ├─ Tentative 15 : Active la vérification manuelle (fallback)
   │   ├─ Appelle /api/auth/verify-payment
   │   ├─ Vérifie avec l'API Stripe
   │   └─ Active le profil si paiement confirmé
   ├─ Tentative 16-29 : Continue le polling
   └─ Tentative 30 : Dernière tentative de vérification manuelle
   ↓
4a. SUCCESS : Redirection vers /dashboard/pro ✅
4b. FAILURE : Redirection vers /paiement-requis?error=verification_failed ❌
```

**En parallèle**, le webhook Stripe :
```
1. Stripe envoie checkout.session.completed
   ↓
2. Vercel reçoit la requête sur /api/stripe/webhook
   ↓
3. Vérifie la signature
   ↓
4. Met à jour is_verified & is_subscribed dans Supabase
   ↓
5. Le polling détecte le changement et redirige l'utilisateur ✅
```

## 🚀 Déploiement

### Checklist Pre-Déploiement

- [ ] Toutes les variables d'environnement sont configurées sur Vercel
- [ ] Le webhook est créé sur Stripe Dashboard
- [ ] Le `STRIPE_WEBHOOK_SECRET` correspond au webhook de production
- [ ] `SUPABASE_SERVICE_ROLE_KEY` est configuré
- [ ] Le code a été commité et poussé

### Commandes

```bash
# Commiter les changements
git add .
git commit -m "Fix: Webhook Stripe avec système de polling et fallback"

# Push vers Vercel (si auto-deploy activé)
git push origin main

# Ou déployer manuellement
vercel --prod
```

### Post-Déploiement

1. ✅ Testez avec un paiement de test
2. ✅ Vérifiez les logs Vercel
3. ✅ Vérifiez les logs Stripe
4. ✅ Vérifiez Supabase
5. ✅ Testez le flow complet plusieurs fois

## 📞 Support

### Logs Utiles

**Vercel Logs** :
```
Vercel Dashboard > Deployments > Functions > /api/stripe/webhook
```

**Stripe Logs** :
```
Stripe Dashboard > Developers > Webhooks > [Votre webhook] > Attempts
```

**Console Navigateur** (page success-pro) :
```
F12 > Console
Recherchez les logs avec 🔍, ✅, ❌
```

### Problèmes Connus

1. **Timeout Vercel** : Les fonctions Vercel ont un timeout de 10s par défaut (60s pour Pro). Si le webhook prend trop de temps, il peut timeout.
   - **Solution** : Optimiser le code du webhook ou upgrade Vercel Pro

2. **Rate Limiting** : Stripe peut rate-limiter les webhooks si trop d'erreurs.
   - **Solution** : Corriger les erreurs avant de tester en masse

3. **Webhooks multiples** : Si vous créez plusieurs webhooks, tous seront appelés.
   - **Solution** : Désactivez les anciens webhooks

## ✅ Checklist Finale

- [ ] Variables d'environnement sur Vercel ✓
- [ ] Webhook créé sur Stripe ✓
- [ ] `STRIPE_WEBHOOK_SECRET` copié ✓
- [ ] `SUPABASE_SERVICE_ROLE_KEY` copié ✓
- [ ] Code déployé sur Vercel ✓
- [ ] Test de paiement réussi ✓
- [ ] Logs Vercel vérifiés ✓
- [ ] Logs Stripe vérifiés ✓
- [ ] Base de données Supabase vérifiée ✓
- [ ] Flow complet testé plusieurs fois ✓

## 🎉 Conclusion

Avec ces modifications, votre webhook Stripe devrait fonctionner de manière **stable et fiable** en production :

1. ✅ **Configuration Next.js optimisée** pour les webhooks
2. ✅ **Logs détaillés** pour le débogage
3. ✅ **Système de polling intelligent** qui attend le webhook
4. ✅ **Solution de secours automatique** après 15 secondes
5. ✅ **Vérification manuelle** en cas d'échec du webhook
6. ✅ **Gestion d'erreurs robuste** avec messages clairs

Le système est maintenant **résilient** et fonctionne même si le webhook Stripe prend du temps ou échoue temporairement.

