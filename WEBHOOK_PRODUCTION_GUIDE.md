# 🔒 Guide Production - Webhook Stripe

Ce guide explique la structure et les bonnes pratiques de votre webhook Stripe production-ready.

---

## 📁 Structure des fichiers

```
/app/api/stripe/webhook/
  └── route.ts              # Route webhook principale
/lib/
  └── webhook-logger.ts     # Système de logging structuré
```

---

## 🔐 Sécurité

### Vérification stricte de la signature

```typescript
// 1. Vérifier la présence de la signature
const signature = req.headers.get("stripe-signature");
if (!signature) {
  return 400; // Rejet immédiat
}

// 2. Valider avec Stripe
event = await stripe.webhooks.constructEventAsync(
  rawBody,
  signature,
  webhookSecret
);
```

**Principes :**
- ✅ Aucune requête sans signature n'est traitée
- ✅ Signature invalide → 400 (Stripe ne réessaie pas)
- ✅ Raw body utilisé sans altération

---

## 🎯 Gestion des erreurs

### Principe fondamental de Stripe

> **Stripe considère toute réponse non-2xx comme un échec et réessaie le webhook jusqu'à 3 jours.**

### Stratégie de réponse

```typescript
try {
  // Validation de la signature
  event = await stripe.webhooks.constructEventAsync(...);
} catch (err) {
  // ❌ ERREUR DE SIGNATURE → 400
  // Stripe ne doit PAS réessayer
  return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
}

try {
  // Traitement métier
  await handleStripeEvent(event);
} catch (error) {
  // ⚠️ ERREUR MÉTIER → 200 + LOG
  // On accepte le webhook mais on log l'erreur
  // Stripe ne réessaie PAS
  webhookLogger.error("Erreur traitement métier", error);
}

// ✅ TOUJOURS RETOURNER 200
return NextResponse.json({ received: true }, { status: 200 });
```

### Matrice de décision

| Situation | Status HTTP | Action Stripe | Que faire ? |
|-----------|-------------|---------------|-------------|
| Signature invalide | 400 | ❌ Ne réessaie pas | Logique - requête malveillante |
| Body vide | 400 | ❌ Ne réessaie pas | Logique - requête invalide |
| Event validé + traitement OK | 200 | ✅ OK | Parfait ! |
| Event validé + erreur DB | 200 | ✅ OK | Logger l'erreur, corriger manuellement |
| Event validé + userId manquant | 200 | ✅ OK | Logger l'erreur, investiguer |
| Erreur serveur inattendue | 500 | 🔄 Réessaie | Stripe réessaie automatiquement |

---

## 📊 Système de logging

### Structure propre

```typescript
// ✅ BIEN - Logs structurés avec contexte
webhookLogger.success("Webhook validé — type: checkout.session.completed", {
  eventId: "evt_123",
  eventType: "checkout.session.completed",
  livemode: false
});

// ❌ MAL - Logs verbeux et non structurés
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ [WEBHOOK] Signature présente');
console.log('📦 [WEBHOOK] Lecture du raw body...');
console.log('✅ [WEBHOOK] Raw body récupéré:', rawBody.length, 'bytes');
```

### Niveaux de log

```typescript
// Information générale
webhookLogger.info("Message", { context });

// Succès
webhookLogger.success("Action réussie", { context });

// Avertissement (non bloquant)
webhookLogger.warn("Événement non géré", { eventType });

// Erreur (bloquante ou non)
webhookLogger.error("Erreur détectée", error, { context });
```

### Logs en production

**Ce que vous verrez :**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[WEBHOOK] Webhook reçu - 2025-10-12T14:23:45.123Z
[WEBHOOK] ✅ Webhook validé — type: checkout.session.completed {"eventId":"evt_123","eventType":"checkout.session.completed","livemode":false}
[WEBHOOK] Traitement checkout.session.completed {"sessionId":"cs_123","paymentStatus":"paid","customerEmail":"test@example.com","amountTotal":2900,"currency":"eur"}
[WEBHOOK] ✅ Profil pro activé {"userId":"user_123","sessionId":"cs_123"}
[WEBHOOK] ✅ Événement traité avec succès {"eventId":"evt_123","eventType":"checkout.session.completed"}
[WEBHOOK] ✅ Traitement réussi
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**En cas d'erreur métier (mais webhook accepté) :**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[WEBHOOK] Webhook reçu - 2025-10-12T14:23:45.123Z
[WEBHOOK] ✅ Webhook validé — type: checkout.session.completed {"eventId":"evt_123"}
[WEBHOOK] ❌ userId manquant dans les metadata  Missing userId in session metadata {"sessionId":"cs_123"}
[WEBHOOK] ❌ Erreur traitement métier (webhook accepté, mais action échouée) Missing userId in session metadata {"eventId":"evt_123","eventType":"checkout.session.completed"}
[WEBHOOK] ✅ Traitement réussi
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🏗️ Architecture du code

### Séparation des responsabilités

```typescript
// 1. Route principale (route.ts)
//    → Valide la signature
//    → Délègue le traitement
//    → Gère les erreurs globales

// 2. Dispatcher d'événements (handleStripeEvent)
//    → Route vers le bon handler selon event.type

// 3. Handlers spécifiques
//    → handleCheckoutSessionCompleted
//    → handlePaymentIntentSucceeded
//    → handleSubscriptionChange
```

### Avantages de cette structure

✅ **Maintenabilité** : Chaque fonction a une responsabilité unique  
✅ **Testabilité** : Facile de tester chaque handler individuellement  
✅ **Évolutivité** : Ajouter un nouveau type d'événement = ajouter un case  
✅ **Lisibilité** : Le flux est clair et facile à suivre  

---

## 🔧 Ajout d'un nouvel événement

### Étape 1 : Ajouter le case dans le switch

```typescript
async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    // ... événements existants
    
    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
  }
}
```

### Étape 2 : Créer le handler

```typescript
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  webhookLogger.info("Traitement invoice.payment_succeeded", {
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
    customerId: invoice.customer
  });

  // Votre logique ici
  
  webhookLogger.success("Invoice traitée", {
    invoiceId: invoice.id
  });
}
```

### Étape 3 : Activer l'événement dans Stripe

```bash
stripe webhook-endpoints update we_xxxxx \
  --enabled-events invoice.payment_succeeded
```

---

## 🚨 Erreurs courantes à éviter

### ❌ Retourner 400 pour une erreur métier

```typescript
// ❌ MAL
if (!userId) {
  return NextResponse.json({ error: "No userId" }, { status: 400 });
  // Stripe réessaie indéfiniment !
}

// ✅ BIEN
if (!userId) {
  webhookLogger.error("userId manquant", undefined, { sessionId });
  throw new Error("Missing userId");
  // L'erreur est catchée, on log, et on retourne 200
}
```

### ❌ Logger trop d'informations

```typescript
// ❌ MAL - Bruit inutile
console.log('📦 [WEBHOOK] Lecture du raw body...');
console.log('✅ [WEBHOOK] Raw body récupéré:', rawBody.length, 'bytes');
console.log('📝 [WEBHOOK] Body preview:', rawBody.toString().substring(0, 100));
console.log('🔍 [WEBHOOK] Vérification de la signature Stripe...');

// ✅ BIEN - Logs ciblés
webhookLogger.success("Webhook validé — type: checkout.session.completed", {
  eventId: event.id
});
```

### ❌ Ne pas gérer les événements non attendus

```typescript
// ❌ MAL - Le webhook plante
case "unknown_event":
  throw new Error("Unknown event");

// ✅ BIEN - On log et on continue
default:
  webhookLogger.warn(`Événement non géré: ${event.type}`, {
    eventId: event.id
  });
```

---

## 📋 Checklist avant la mise en production

### Configuration

- [ ] `STRIPE_SECRET_KEY` défini dans Vercel (commence par `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` défini dans Vercel (commence par `whsec_`)
- [ ] Endpoint webhook créé dans Stripe Dashboard (mode production)
- [ ] URL de l'endpoint : `https://ekicare-v3.vercel.app/api/stripe/webhook`

### Tests

- [ ] Test avec événement depuis Stripe Dashboard → 200 OK
- [ ] Test avec signature invalide → 400
- [ ] Test sans signature → 400
- [ ] Vérification des logs dans Vercel (propres et clairs)
- [ ] Vérification dans Stripe Dashboard (delivery succeeded)

### Code

- [ ] Aucun console.log verbeux restant
- [ ] Gestion d'erreur robuste (try/catch)
- [ ] Logs structurés avec contexte
- [ ] Retour 200 même en cas d'erreur métier
- [ ] Handlers pour tous les événements activés dans Stripe

### Monitoring

- [ ] Logs Vercel configurés et accessibles
- [ ] Alertes configurées pour les erreurs critiques
- [ ] Dashboard Stripe consulté régulièrement (Event history)

---

## 🎯 Bonnes pratiques

### 1. Idempotence

Assurez-vous que votre logique métier est idempotente (peut être appelée plusieurs fois sans effet de bord).

```typescript
// ✅ BIEN - Vérifier avant de créer
const existingProfile = await getProProfile(userId);
if (existingProfile) {
  webhookLogger.info("Profil pro déjà actif", { userId });
  return; // Ne rien faire
}

// Créer le profil
await createProProfile(userId);
```

### 2. Métadonnées

Toujours passer les métadonnées nécessaires lors de la création du checkout :

```typescript
const session = await stripe.checkout.sessions.create({
  // ...
  metadata: {
    userId: user.id,
    plan: 'pro',
    source: 'web'
  }
});
```

### 3. Logging contextuel

Toujours inclure le contexte pour faciliter le debug :

```typescript
webhookLogger.error("Action échouée", error, {
  userId,
  sessionId,
  eventId,
  timestamp: new Date().toISOString()
});
```

---

## 🔍 Monitoring en production

### Vérifier régulièrement

```bash
# Logs Vercel en temps réel
vercel logs --follow

# Voir les erreurs uniquement
vercel logs | grep "❌"

# Voir les webhooks traités
vercel logs | grep "[WEBHOOK]"
```

### Dashboard Stripe

1. **Event history** : [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
   - Vérifier que tous les événements ont un status "Succeeded"
   - Vérifier qu'il n'y a pas de retries inutiles

2. **Delivery attempts** : Cliquer sur un événement
   - Response code : doit être `200`
   - Response time : doit être < 1s
   - Attempts : doit être `1` (pas de retry)

---

## 🚀 Déploiement

### Étapes

```bash
# 1. Vérifier les variables d'environnement dans Vercel
vercel env ls

# 2. Déployer
git add .
git commit -m "feat: webhook Stripe production-ready"
git push

# 3. Tester immédiatement après le déploiement
# Aller sur Stripe Dashboard > Send test event

# 4. Vérifier les logs
vercel logs --follow
```

---

## 📚 Ressources

- **Code** : `/app/api/stripe/webhook/route.ts`
- **Logger** : `/lib/webhook-logger.ts`
- **Tests** : `GUIDE_TEST_WEBHOOK_STRIPE.md`
- **Quickstart** : `QUICKSTART_WEBHOOK_TEST.md`
- **Doc Stripe** : [stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)

---

## ✨ Résumé

Votre webhook est maintenant :

✅ **Sécurisé** - Vérification stricte des signatures  
✅ **Robuste** - Gestion d'erreur appropriée  
✅ **Propre** - Logs structurés et ciblés  
✅ **Maintenable** - Code organisé et documenté  
✅ **Production-ready** - Prêt pour un trafic réel  

**Vous êtes prêt pour la production ! 🎉**






