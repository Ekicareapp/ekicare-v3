# 🚀 SYSTÈME DE PAIEMENT ROBUSTE : WEBHOOK + FALLBACK

## 📋 VUE D'ENSEMBLE

Ce document explique le système de paiement Stripe robuste mis en place pour Ekicare, combinant **Webhook (source de vérité)** et **Fallback (sécurité UX)**.

---

## 🛰️ WEBHOOK STRIPE - SOURCE DE VÉRITÉ

### 📍 Localisation
`app/api/stripe/webhook/route.ts`

### 🎯 Rôle
Le webhook est la **source principale** de mise à jour des statuts (`is_verified`, `is_subscribed`) après un paiement réussi.

### ⚙️ Fonctionnement

1. **Stripe envoie** automatiquement un événement à `/api/stripe/webhook`
2. **Vérification de la signature** avec `STRIPE_WEBHOOK_SECRET`
3. **Traitement de l'événement** selon le type :
   - `checkout.session.completed` : Activation initiale du profil
   - `invoice.payment_succeeded` : Renouvellement de paiement
   - `customer.subscription.updated` : Changement de statut d'abonnement

4. **Mise à jour de la base de données** Supabase

### 🔍 Gestion du `user_id`

Le webhook récupère l'ID utilisateur depuis **3 sources possibles** :
```typescript
const userId = session.client_reference_id || session.metadata?.userId || session.metadata?.user_id
```

### ✅ Gestion des erreurs PGRST116

**Problème résolu** : Le webhook ne fait plus d'erreur `PGRST116` (profil non trouvé)

**Solution** :
- Utilisation de `select('*').eq('user_id', userId)` au lieu de `.single()`
- Vérification explicite si le profil existe
- Logs détaillés pour diagnostic
- Pas de crash si le profil n'existe pas

```typescript
// ❌ AVANT (générait PGRST116)
const { data: profile, error } = await supabase
  .from('pro_profiles')
  .select('*')
  .eq('user_id', userId)
  .single() // ❌ Crash si aucune ligne

// ✅ MAINTENANT (robuste)
const { data: profiles, error } = await supabase
  .from('pro_profiles')
  .select('*')
  .eq('user_id', userId)

if (!profiles || profiles.length === 0) {
  console.error('⚠️ Profil non trouvé')
  return // Pas de crash
}
```

### 📊 Logs clairs

Le webhook affiche des logs détaillés pour chaque étape :
```
🛰️ [WEBHOOK] Webhook Stripe reçu
🔍 [WEBHOOK] Données de la session:
  - client_reference_id: xxx
  - user_id final: xxx
👤 [WEBHOOK] User ID: xxx
💰 [WEBHOOK] Payment status: paid
🔍 [WEBHOOK] Recherche du profil...
📊 [WEBHOOK] Profils trouvés: 1
✅ [WEBHOOK] Profil trouvé, ID: xxx
🔄 [WEBHOOK] Mise à jour avec: {...}
✅ [WEBHOOK] Profil mis à jour avec succès
```

---

## 🧭 FALLBACK - SÉCURITÉ UX

### 📍 Localisation
- **Route API** : `app/api/auth/verify-payment/route.ts`
- **Client** : `app/success-pro/page.tsx`

### 🎯 Rôle
Le fallback est un **plan B** qui garantit une excellente expérience utilisateur même si le webhook est lent ou échoue.

### ⚙️ Fonctionnement

1. **User arrive** sur `/success-pro` après paiement
2. **Polling intelligent** : Vérification toutes les secondes (10 secondes max)
3. **Priorité au webhook** : Le client vérifie d'abord si le webhook a déjà fait le travail
4. **Fallback après 3 secondes** : Si le webhook est lent, appel manuel à `/api/auth/verify-payment`
5. **Activation du profil** : Le fallback active le profil si nécessaire

### 🧩 Architecture hybride

```
┌─────────────────────────────────────────────────┐
│  SYSTÈME HYBRIDE : WEBHOOK + FALLBACK          │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
  🛰️ WEBHOOK                 🧭 FALLBACK
  (source de vérité)         (sécurité UX)
        │                           │
        │ Stripe → Serveur         │ Client → Serveur
        │ Instantané               │ 3 secondes
        │ Automatique              │ Manuel
        │                           │
        └─────────────┬─────────────┘
                      │
                      ▼
            ✅ PROFIL ACTIVÉ
         (is_verified + is_subscribed)
```

### 📊 Timeline du flow

```
T=0s    User paie sur Stripe
        ↓
T=0s    Stripe redirige vers /success-pro
        ↓
T=0s    🛰️ WEBHOOK déclenché par Stripe (en parallèle)
        ↓
T=1s    🔄 POLLING : Check si webhook a fait le travail
        ↓
T=2s    🔄 POLLING : Check si webhook a fait le travail
        ↓
T=3s    🧭 FALLBACK activé (webhook lent)
        │   → Vérification directe avec Stripe
        │   → Activation manuelle du profil
        ↓
T=3-10s 🔄 POLLING continue (attente webhook ou fallback)
        ↓
        ✅ PROFIL ACTIVÉ
        └→ Confettis + Bouton dashboard activé
```

### 🔄 Polling intelligent

```typescript
// Priorité au webhook
const checkWebhookStatus = async () => {
  const { data: proProfile } = await supabase
    .from('pro_profiles')
    .select('is_verified, is_subscribed')
    .eq('user_id', session.user.id)
    .single()
  
  return proProfile?.is_verified && proProfile?.is_subscribed
}

// Fallback après 3 secondes
if (attempts === 3) {
  const response = await fetch('/api/auth/verify-payment', {
    method: 'POST',
    body: JSON.stringify({
      user_id: session.user.id,
      session_id: stripeSessionId
    })
  })
  // ...
}
```

---

## 🔐 CONFIGURATION REQUISE

### Variables d'environnement Vercel

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### Configuration webhook Stripe

1. **Dashboard Stripe** → Webhooks → Ajouter un endpoint
2. **URL** : `https://ekicare-v3.vercel.app/api/stripe/webhook`
3. **Événements à écouter** :
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
4. **Copier le secret** → `STRIPE_WEBHOOK_SECRET` dans Vercel

---

## 🧪 TESTS

### Test avec Stripe CLI (local)

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

### Test en production

1. Créer un vrai compte pro
2. Effectuer un paiement test
3. Observer les logs Vercel
4. Vérifier que le profil est activé

---

## 📊 MONITORING

### Logs à surveiller

**Webhook Vercel** :
```
🛰️ [WEBHOOK] Webhook Stripe reçu
✅ [WEBHOOK] Signature vérifiée avec succès
✅ [WEBHOOK] Profil mis à jour avec succès
```

**Fallback client** :
```
🔄 [POLLING] Tentative 1/10
✅ [POLLING] Webhook a réussi ! Profil activé.
```

ou

```
🧭 [FALLBACK] Webhook lent, activation du fallback manuel...
✅ [FALLBACK] Profil activé via fallback !
```

### Cas d'erreur à surveiller

❌ `PGRST116` : Profil non trouvé → **Résolu** avec la nouvelle logique  
❌ `Signature invalide` : Secret webhook incorrect  
❌ `user_id manquant` : Problème dans `checkout-session`  
❌ `Aucun profil trouvé` : Le profil n'a pas été créé lors du signup

---

## ✅ AVANTAGES DU SYSTÈME

| Aspect | Webhook seul | Fallback seul | **Webhook + Fallback** |
|--------|--------------|---------------|------------------------|
| **Vitesse** | ⚡ Instantané | 🐌 3 secondes | ⚡ Instantané (webhook) |
| **Fiabilité** | ⚠️ Peut échouer | ✅ 100% | ✅ 100% |
| **UX** | ⚠️ Risque blocage | ✅ Bon | ✅ Excellent |
| **Charge serveur** | ✅ Faible | ⚠️ Moyenne | ✅ Optimale |
| **Robustesse** | ⚠️ Moyenne | ✅ Bonne | ✅ Excellente |

---

## 🎯 RÉSULTAT

✅ **Webhook = Vérité absolue** : Source principale, instantané, fiable  
✅ **Fallback = Sécurité UX** : Plan B intelligent si webhook lent  
✅ **Aucune dépendance exclusive** : Les deux systèmes se complètent  
✅ **Plus d'erreur PGRST116** : Gestion propre des profils manquants  
✅ **Logs clairs** : Diagnostic facile en production  
✅ **Code propre et documenté** : Maintenable et évolutif

---

## 📞 DÉPANNAGE

### Le webhook ne reçoit rien

1. Vérifier l'URL dans Stripe Dashboard
2. Vérifier que `STRIPE_WEBHOOK_SECRET` est correct
3. Tester avec Stripe CLI

### Le fallback échoue

1. Vérifier que le profil existe dans `pro_profiles`
2. Vérifier que `session_id` est présent dans l'URL
3. Vérifier les logs de `/api/auth/verify-payment`

### Le profil n'est pas créé

1. Vérifier le flow signup dans `app/api/auth/signup/route.ts`
2. S'assurer que `pro_profiles` est créé avant le paiement
3. Vérifier les RLS policies Supabase

---

**Dernière mise à jour** : 11 octobre 2025  
**Version** : 2.0 (Webhook + Fallback hybride)

