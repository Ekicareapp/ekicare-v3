# 🔍 DIAGNOSTIC WEBHOOK SIGNATURE STRIPE

## 🚨 PROBLÈME : "No signatures found matching the expected signature"

Ce guide t'aide à identifier et corriger les erreurs de signature Stripe.

---

## ✅ CHECKLIST DE VÉRIFICATION

### 1. **UN SEUL ENDPOINT WEBHOOK ACTIF**

**Vérifier dans Stripe Dashboard** → Webhooks :

- ✅ **Garder uniquement** : `https://ekicare-v3.vercel.app/api/stripe/webhook`
- ❌ **Supprimer** tous les autres endpoints (test, dev, anciens, doublons)

**Pourquoi ?** Chaque endpoint a son propre secret. Si tu as plusieurs endpoints, les événements peuvent être envoyés avec des secrets différents.

**Action** :
1. Aller dans Stripe Dashboard → Developers → Webhooks
2. Supprimer tous les endpoints sauf celui de production
3. Copier le secret du webhook actif
4. Le mettre dans Vercel → `STRIPE_WEBHOOK_SECRET`

---

### 2. **MODE STRIPE COHÉRENT (Test vs Live)**

**Vérifier la cohérence** :

| Variable | Mode Test | Mode Live |
|----------|-----------|-----------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (test) | `whsec_...` (live) |
| `STRIPE_PRICE_ID` | `price_...` (test) | `price_...` (live) |

**⚠️ ERREUR FRÉQUENTE** :
- Clé secrète en mode **Live** (`sk_live_...`)
- Webhook secret en mode **Test** (`whsec_...` du test)

**Action** :
1. Dans Stripe Dashboard, vérifier le mode actif (coin haut droit : "Test mode" / "Live mode")
2. Dans Vercel, vérifier que **TOUTES** les clés correspondent au même mode
3. Si tu passes de Test → Live, **régénérer le webhook secret** dans Stripe Dashboard

---

### 3. **SECRET WEBHOOK PROPRE**

**Vérifications** :
- ✅ Secret commence par `whsec_`
- ✅ Pas d'espaces avant/après
- ✅ Pas de retour à la ligne
- ✅ Copié-collé directement depuis Stripe Dashboard

**Action** :
1. Dans Stripe Dashboard → Webhooks → Cliquer sur ton endpoint
2. Cliquer sur "Signing secret" → "Reveal"
3. Copier le secret complet (`whsec_...`)
4. Dans Vercel → Environment Variables → `STRIPE_WEBHOOK_SECRET`
5. Coller le secret (sans espaces)
6. Redéployer

---

### 4. **AUCUN DOUBLON DE ROUTE**

**Vérifier qu'il n'y a qu'une seule route** :
- ✅ `app/api/stripe/webhook/route.ts`
- ❌ PAS de `app/api/stripe/webhook-test/route.ts`
- ❌ PAS de `app/api/webhooks/stripe/route.ts`

**Action** :
```bash
find app/api -name "*webhook*.ts"
```

Si plusieurs routes, supprimer les doublons.

---

### 5. **CONFIGURATION RAW BODY**

**Vérifier que le webhook reçoit le raw body** :

```typescript
// ✅ BON
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text() // Raw body string
  const signature = request.headers.get('stripe-signature')
  
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
}
```

```typescript
// ❌ MAUVAIS
const body = await request.json() // ❌ Body parsé (signature invalide)
```

---

### 6. **NEXT.CONFIG.TS PROPRE**

**Vérifier `next.config.ts`** :

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ['stripe'], // ✅ Bon
  
  async headers() {
    return [
      {
        source: '/api/stripe/webhook', // ✅ Bon chemin
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST' },
          { key: 'Access-Control-Allow-Headers', value: 'stripe-signature, content-type' },
        ],
      },
    ]
  },
}
```

**⚠️ NE PAS METTRE** :
- ❌ `bodyParser: false` (déprécié en Next.js 15)
- ❌ `experimental.serverComponentsExternalPackages`

---

## 🔍 ANALYSER LES LOGS VERCEL

### Logs à chercher :

**✅ Signature valide** :
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛰️ [WEBHOOK] Nouveau webhook Stripe reçu
📍 [WEBHOOK] URL appelée: https://ekicare-v3.vercel.app/api/stripe/webhook
🔑 [WEBHOOK] Webhook ID: evt_xxx
👤 [WEBHOOK] User-Agent: Stripe/1.0
📦 [WEBHOOK] Body length: 3245
🔐 [WEBHOOK] Secret starts with whsec_: true
✅ [WEBHOOK] Signature vérifiée avec succès
📋 [WEBHOOK] Event ID: evt_xxx
📋 [WEBHOOK] Event type: checkout.session.completed
📋 [WEBHOOK] Event livemode: false
✅ [WEBHOOK] Événement traité avec succès
⏱️ [WEBHOOK] Durée totale: 245 ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**❌ Signature invalide** :
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛰️ [WEBHOOK] Nouveau webhook Stripe reçu
📍 [WEBHOOK] URL appelée: https://ekicare-v3.vercel.app/api/stripe/webhook
🔑 [WEBHOOK] Webhook ID: evt_xxx
📦 [WEBHOOK] Body length: 3245
🔐 [WEBHOOK] Secret starts with whsec_: true
❌ [WEBHOOK] Erreur vérification signature: No signatures found matching...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Diagnostic selon les logs :

| Observation | Cause probable | Solution |
|-------------|----------------|----------|
| `Secret starts with whsec_: false` | Secret mal configuré | Copier le bon secret |
| `Event livemode: true` mais `sk_test_` | Mode incohérent | Passer en mode Live |
| `Event livemode: false` mais `sk_live_` | Mode incohérent | Passer en mode Test |
| Plusieurs webhooks ID différents | Plusieurs endpoints actifs | Garder un seul endpoint |
| `Body length: 0` | Body parsé avant webhook | Vérifier middleware |

---

## 🧪 TEST AVEC STRIPE CLI

### Installation :
```bash
brew install stripe/stripe-cli/stripe
stripe login
```

### Test local :
```bash
# Terminal 1 : Lancer le serveur local
npm run dev

# Terminal 2 : Écouter les webhooks
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Terminal 3 : Déclencher un événement
stripe trigger checkout.session.completed
```

**✅ Résultat attendu** :
- Terminal 2 : `✅ 200 POST /api/stripe/webhook`
- Logs Next.js : Signature vérifiée avec succès

---

## 🎯 SOLUTION DÉFINITIVE

### Étape 1 : Nettoyer Stripe Dashboard

1. Aller dans Stripe Dashboard → Webhooks
2. Supprimer tous les endpoints sauf un
3. Garder : `https://ekicare-v3.vercel.app/api/stripe/webhook`
4. Événements écoutés :
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`

### Étape 2 : Régénérer le secret

1. Dans l'endpoint actif, cliquer sur "Signing secret"
2. Cliquer sur "Roll secret" (régénérer)
3. Copier le nouveau secret (`whsec_...`)

### Étape 3 : Mettre à jour Vercel

1. Vercel → Project → Settings → Environment Variables
2. Éditer `STRIPE_WEBHOOK_SECRET`
3. Coller le nouveau secret
4. Sauvegarder

### Étape 4 : Redéployer

```bash
git commit --allow-empty -m "Redeploy pour nouveau webhook secret"
git push origin main
```

### Étape 5 : Tester

1. Faire un vrai paiement test
2. Vérifier les logs Vercel
3. Tous les événements doivent passer (200 OK)

---

## 📊 MONITORING

### Dashboard Stripe

Webhooks → Cliquer sur ton endpoint → Event logs

**✅ Bon signe** :
- Tous les événements : `200` (Success)
- Response time : < 1s

**❌ Mauvais signe** :
- Événements : `400` (Signature invalide)
- Événements : `500` (Erreur serveur)

### Logs Vercel

Filtre : `[WEBHOOK]`

**✅ Pattern normal** :
```
━━━━━━ Webhook 1 ━━━━━━
✅ Signature vérifiée
✅ Événement traité
━━━━━━━━━━━━━━━━━━━━━━

━━━━━━ Webhook 2 ━━━━━━
✅ Signature vérifiée
✅ Événement traité
━━━━━━━━━━━━━━━━━━━━━━
```

**❌ Pattern anormal (rafale d'erreurs)** :
```
━━━━━━ Webhook 1 ━━━━━━
✅ Signature vérifiée
━━━━━━━━━━━━━━━━━━━━━━

━━━━━━ Webhook 2 ━━━━━━
❌ Signature invalide
━━━━━━━━━━━━━━━━━━━━━━

━━━━━━ Webhook 3 ━━━━━━
❌ Signature invalide
━━━━━━━━━━━━━━━━━━━━━━
```

**Cause** : Plusieurs endpoints envoient des événements avec des secrets différents.

---

## 🚀 RÉSULTAT FINAL

Après ces corrections :

✅ **Un seul endpoint** actif dans Stripe Dashboard  
✅ **Un seul secret** valide dans Vercel  
✅ **Mode cohérent** (Test ou Live partout)  
✅ **Aucun doublon** de route webhook  
✅ **Raw body** correctement transmis  
✅ **Logs détaillés** pour diagnostic rapide  
✅ **100% de réussite** sur tous les événements  

---

**Dernière mise à jour** : 11 octobre 2025  
**Version** : 3.0 (Diagnostic complet)

