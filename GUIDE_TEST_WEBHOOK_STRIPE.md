# 🧪 Guide Complet de Test du Webhook Stripe

Ce guide vous accompagne pour tester et valider votre intégration webhook Stripe de bout en bout.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Méthode 1 : Test avec Stripe CLI (Production)](#méthode-1--test-avec-stripe-cli-production)
3. [Méthode 2 : Test avec Stripe Dashboard](#méthode-2--test-avec-stripe-dashboard)
4. [Méthode 3 : Test en Local avec Forward](#méthode-3--test-en-local-avec-forward)
5. [Vérification des Logs](#vérification-des-logs)
6. [Checklist de Validation](#checklist-de-validation)
7. [Troubleshooting](#troubleshooting)

---

## Prérequis

### 1. Stripe CLI installé

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Ou télécharger depuis : https://stripe.com/docs/stripe-cli
```

### 2. Se connecter à Stripe

```bash
stripe login
```

Cela ouvrira votre navigateur pour vous authentifier.

### 3. Vérifier votre configuration

```bash
# Vérifier que vous êtes connecté
stripe config --list

# Vérifier vos clés API
stripe listen --print-secret
```

---

## Méthode 1 : Test avec Stripe CLI (Production)

Cette méthode envoie un événement de test directement à votre endpoint en production.

### Étape 1 : Déclencher un événement de test

```bash
stripe trigger checkout.session.completed \
  --stripe-account YOUR_ACCOUNT_ID \
  --api-key YOUR_SECRET_KEY
```

**Note :** Par défaut, `stripe trigger` crée un événement dans votre compte Stripe mais ne l'envoie pas automatiquement à votre endpoint. Vous devez utiliser les méthodes suivantes.

### Étape 2 : Envoyer l'événement à votre endpoint

```bash
# Option A : Utiliser l'ID de l'événement créé
stripe events resend evt_XXXXXXXXXX

# Option B : Envoyer directement avec curl
curl -X POST https://ekicare-v3.vercel.app/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: SIGNATURE" \
  -d @event.json
```

---

## Méthode 2 : Test avec Stripe Dashboard

La méthode la plus simple et recommandée !

### Étape 1 : Accéder au Dashboard Stripe

1. Allez sur [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
2. Cliquez sur votre endpoint webhook (`https://ekicare-v3.vercel.app/api/stripe/webhook`)

### Étape 2 : Envoyer un événement de test

1. Dans la page de détails de votre endpoint, cliquez sur **"Send test event"**
2. Sélectionnez **`checkout.session.completed`** dans la liste
3. Cliquez sur **"Send test event"**

### Étape 3 : Vérifier la réponse

Vous devriez voir :
- ✅ **Status : 200 OK** (succès)
- 🕐 **Response time** : quelques millisecondes
- 📋 **Response body** : `{"received": true}`

---

## Méthode 3 : Test en Local avec Forward

Pour tester en développement local avant de déployer.

### Étape 1 : Démarrer votre serveur local

```bash
npm run dev
# Votre app tourne sur http://localhost:3000
```

### Étape 2 : Créer un tunnel Stripe

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Important :** Cette commande vous donnera un **nouveau secret de webhook** pour le mode local :
```
> Ready! You are using Stripe API Version [2025-08-27.basil]. Your webhook signing secret is whsec_xxxxx (^C to quit)
```

### Étape 3 : Mettre à jour votre `.env.local`

```bash
# Remplacer temporairement avec le secret local
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Étape 4 : Déclencher un événement de test

Dans un **nouveau terminal** :

```bash
stripe trigger checkout.session.completed
```

Vous verrez l'événement arriver dans le terminal où tourne `stripe listen`.

---

## Vérification des Logs

### 📊 Logs Vercel (Production)

1. Allez sur [https://vercel.com/tiberefillie/ekicare-v3](https://vercel.com/tiberefillie/ekicare-v3)
2. Cliquez sur **Functions** dans le menu
3. Filtrez par `/api/stripe/webhook`
4. Vérifiez les logs en temps réel

**Logs attendus en cas de succès :**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛰️  [WEBHOOK] Nouveau webhook Stripe reçu
🕐 [WEBHOOK] Timestamp: 2025-10-12T14:23:45.123Z
🌐 [WEBHOOK] URL: https://ekicare-v3.vercel.app/api/stripe/webhook
📍 [WEBHOOK] Method: POST
✅ [WEBHOOK] Signature présente
🔐 [WEBHOOK] Signature preview: t=1728745425,v1=...
📦 [WEBHOOK] Lecture du raw body...
✅ [WEBHOOK] Raw body récupéré: 1234 bytes
📝 [WEBHOOK] Body preview: {"id":"evt_xxxxx","object":"event",...
🔍 [WEBHOOK] Vérification de la signature Stripe...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ✅ ✅ Signature Stripe validée avec succès ✅ ✅ ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📢 Type d'événement: checkout.session.completed
📋 [WEBHOOK] Event ID: evt_xxxxx
📋 [WEBHOOK] Event livemode: false
🕐 [WEBHOOK] Event created: 2025-10-12T14:23:45.000Z

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 ÉVÉNEMENT: checkout.session.completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 Session ID: cs_test_xxxxx
💳 Payment status: paid
💳 Customer email: test@example.com
💳 Amount total: 2900
💳 Currency: eur
💳 Metadata: {
  "userId": "user_123"
}
✅ Webhook traité avec succès

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ✅ ✅ WEBHOOK TRAITÉ AVEC SUCCÈS ✅ ✅ ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 🔍 Logs Stripe Dashboard

1. Allez sur [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
2. Cliquez sur votre endpoint
3. Consultez l'onglet **"Event history"**

**Détails à vérifier :**
- ✅ **Response code** : `200`
- ✅ **Response body** : `{"received": true}`
- ✅ **Attempt** : 1 (pas de retry)
- ✅ **Response time** : < 1s

### 🖥️ Logs Terminal (Local)

Si vous utilisez `stripe listen --forward-to` :

```bash
2025-10-12 14:23:45   --> checkout.session.completed [evt_xxxxx]
2025-10-12 14:23:45   <-- [200] POST http://localhost:3000/api/stripe/webhook [evt_xxxxx]
```

---

## Checklist de Validation

Utilisez cette checklist pour valider que tout fonctionne :

### ✅ Configuration

- [ ] `STRIPE_SECRET_KEY` est défini dans Vercel
- [ ] `STRIPE_WEBHOOK_SECRET` est défini dans Vercel (commence par `whsec_`)
- [ ] L'endpoint est actif dans le Dashboard Stripe
- [ ] L'endpoint est en mode **Production** (ou Test selon votre besoin)

### ✅ Test Dashboard

- [ ] Événement `checkout.session.completed` envoyé depuis le Dashboard
- [ ] Réponse `200 OK` reçue
- [ ] Response body : `{"received": true}`
- [ ] Temps de réponse < 1 seconde

### ✅ Logs Vercel

- [ ] Signature présente dans les logs
- [ ] Raw body récupéré (taille affichée)
- [ ] Message : `✅ ✅ ✅ Signature Stripe validée avec succès ✅ ✅ ✅`
- [ ] Type d'événement affiché : `checkout.session.completed`
- [ ] Détails de la session affichés (ID, email, montant, etc.)
- [ ] Message final : `✅ ✅ ✅ WEBHOOK TRAITÉ AVEC SUCCÈS ✅ ✅ ✅`

### ✅ Stripe Dashboard

- [ ] L'événement apparaît dans "Event history"
- [ ] Status : **Succeeded**
- [ ] Aucun retry nécessaire
- [ ] Response code : `200`

---

## Troubleshooting

### ❌ Erreur : "Missing Stripe signature"

**Cause :** Le header `stripe-signature` n'est pas présent.

**Solution :**
- Vérifiez que vous utilisez bien l'endpoint configuré dans Stripe
- Si vous testez manuellement avec curl, vous devez générer une signature valide

### ❌ Erreur : "No signatures found matching the expected signature"

**Cause :** La signature ne correspond pas (clé webhook incorrecte ou body modifié).

**Solutions :**
1. Vérifiez que `STRIPE_WEBHOOK_SECRET` est bien défini dans Vercel
2. Vérifiez que le secret commence par `whsec_`
3. Assurez-vous que le body n'est pas modifié (utilisation de `Buffer.from(await req.arrayBuffer())`)
4. Vérifiez que vous n'avez qu'un seul endpoint actif dans Stripe

### ❌ Erreur : "Webhook Error: ..."

**Cause :** Erreur dans la validation de la signature.

**Solution :**
- Consultez les logs Vercel pour voir le message d'erreur détaillé
- Vérifiez les informations affichées :
  - Signature présente : `true`
  - Secret présent : `true`
  - Secret format : `true`
  - Body length : > 0

### ❌ Pas de logs dans Vercel

**Cause :** L'événement n'atteint pas votre endpoint.

**Solutions :**
1. Vérifiez l'URL de l'endpoint dans le Dashboard Stripe
2. Testez l'endpoint manuellement avec curl (sans signature) pour vérifier qu'il est accessible
3. Vérifiez que l'app est déployée sur Vercel

---

## 🎯 Commandes Rapides

### Test rapide depuis le Dashboard
```
1. Dashboard Stripe > Webhooks > Votre endpoint > Send test event
2. Sélectionner "checkout.session.completed"
3. Send
```

### Test en local
```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3
stripe trigger checkout.session.completed
```

### Vérifier les logs Vercel
```bash
vercel logs --follow
```

### Lister les événements récents
```bash
stripe events list --limit 10
```

### Re-envoyer un événement spécifique
```bash
stripe events resend evt_xxxxx
```

---

## 📚 Ressources

- [Documentation Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)

---

## 🎉 Résultat Attendu

Après avoir suivi ce guide, vous devriez avoir :

✅ Un webhook fonctionnel qui valide les signatures Stripe  
✅ Des logs détaillés dans Vercel pour le debug  
✅ Une réponse `200 OK` systématique pour les événements valides  
✅ La capacité de tester en local et en production  
✅ Une compréhension claire du flux webhook Stripe  

**Prochain step :** Implémenter la logique métier pour activer le profil pro dans votre base de données !






