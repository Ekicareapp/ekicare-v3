# 🔐 RAW BODY ET SIGNATURE STRIPE - EXPLICATION

## 🚨 PROBLÈME : "No signatures found matching the expected signature"

### 📋 CONTEXTE

Stripe calcule une signature HMAC basée sur :
1. Le **timestamp** de l'événement
2. Le **body brut exact** de la requête (raw body)
3. Le **secret webhook** (`whsec_...`)

**⚠️ SI LE BODY EST MODIFIÉ** (même légèrement), la signature ne correspond plus.

---

## ❌ CE QUI NE FONCTIONNE PAS

### 1. Utiliser `request.text()`

```typescript
// ❌ MAUVAIS
const body = await request.text()
event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
```

**Problème** : `request.text()` peut modifier l'encodage ou ajouter/supprimer des caractères invisibles.

### 2. Utiliser `request.json()`

```typescript
// ❌ MAUVAIS
const body = await request.json()
event = stripe.webhooks.constructEvent(JSON.stringify(body), signature, webhookSecret)
```

**Problème** : Le body est parsé puis re-sérialisé, ce qui change l'ordre des clés, l'espacement, etc.

### 3. Laisser Next.js parser le body automatiquement

```typescript
// ❌ MAUVAIS (Next.js parse le body avant que tu puisses l'intercepter)
```

**Problème** : Par défaut, Next.js peut parser le body automatiquement.

---

## ✅ SOLUTION : arrayBuffer() + Buffer.from()

### Code correct :

```typescript
// ✅ BON
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // 1. Récupérer le raw body en ArrayBuffer
  const arrayBuffer = await request.arrayBuffer()
  
  // 2. Convertir en Buffer Node.js
  const body = Buffer.from(arrayBuffer)
  
  // 3. Récupérer la signature
  const signature = request.headers.get('stripe-signature')
  
  // 4. Vérifier avec Stripe (buffer brut)
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  
  // ✅ Signature valide !
}
```

### Pourquoi ça fonctionne :

1. **`request.arrayBuffer()`** :
   - Récupère le body en tant que `ArrayBuffer`
   - C'est une **représentation binaire brute**
   - Aucune transformation, aucun parsing

2. **`Buffer.from(arrayBuffer)`** :
   - Convertit l'`ArrayBuffer` en `Buffer` Node.js
   - Stripe accepte un `Buffer` directement
   - Le buffer conserve les octets exacts

3. **`stripe.webhooks.constructEvent(buffer, ...)`** :
   - Stripe calcule la signature sur le buffer brut
   - Compare avec la signature dans le header
   - ✅ Match parfait !

---

## 🔍 DIAGNOSTIC

### Logs à vérifier :

```typescript
console.log('📦 [WEBHOOK] Body type:', typeof body)
// ✅ Doit afficher: object

console.log('📦 [WEBHOOK] Body instanceof Buffer:', body instanceof Buffer)
// ✅ Doit afficher: true

console.log('📦 [WEBHOOK] Body length:', body.length)
// ✅ Doit afficher un nombre (ex: 3245)
```

Si ces logs ne sont pas corrects :
- ❌ `typeof body === 'string'` → Tu utilises `request.text()`
- ❌ `body instanceof Buffer === false` → Tu n'utilises pas `Buffer.from()`

---

## 🧪 TEST LOCAL

### Avec Stripe CLI :

```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Terminal 3
stripe trigger checkout.session.completed
```

**✅ Résultat attendu** :
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛰️ [WEBHOOK] Nouveau webhook Stripe reçu
📦 [WEBHOOK] Body type: object
📦 [WEBHOOK] Body instanceof Buffer: true
📦 [WEBHOOK] Body length: 3245
✅ [WEBHOOK] Signature vérifiée avec succès
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**❌ Si erreur** :
```
❌ [WEBHOOK] Erreur vérification signature: No signatures found matching...
❌ [WEBHOOK] Body reçu (Buffer): false   <-- Problème ici !
```

---

## 📚 RÉFÉRENCES STRIPE

### Documentation officielle :

> "You must pass the raw request body string to Stripe's signature verification function. Don't parse the body into a JSON object first. If you use a web framework that automatically parses the body for you, check whether you can disable that behavior for this specific endpoint."

**Source** : https://stripe.com/docs/webhooks/signatures

### Types de body acceptés par Stripe :

```typescript
stripe.webhooks.constructEvent(
  payload: string | Buffer,  // ✅ Buffer recommandé
  header: string,
  secret: string
)
```

---

## 🎯 COMPARAISON

| Méthode | Type retourné | Parsing | Signature OK ? |
|---------|---------------|---------|----------------|
| `request.text()` | `string` | Oui (encoding) | ⚠️ Parfois |
| `request.json()` | `object` | Oui (JSON parse) | ❌ Jamais |
| `request.arrayBuffer()` + `Buffer.from()` | `Buffer` | Non | ✅ Toujours |

---

## 🚀 CONFIGURATION REQUISE

### 1. Route webhook :

```typescript
// app/api/stripe/webhook/route.ts

// ⚡ IMPORTANT : Forcer Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // ⚡ CRITIQUE : arrayBuffer + Buffer.from
  const arrayBuffer = await request.arrayBuffer()
  const body = Buffer.from(arrayBuffer)
  
  const signature = request.headers.get('stripe-signature')!
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  
  // Suite du traitement...
}
```

### 2. Next.js config :

```typescript
// next.config.ts

const nextConfig: NextConfig = {
  serverExternalPackages: ['stripe'], // ✅ Important pour Node.js modules
}
```

### 3. Pas de middleware :

```typescript
// ❌ NE PAS CRÉER de middleware qui intercepte /api/stripe/webhook
// ❌ NE PAS parser le body avant la route webhook
```

---

## 🔧 DÉPANNAGE

### Erreur 1 : "Buffer is not defined"

**Cause** : Runtime Edge au lieu de Node.js

**Solution** :
```typescript
export const runtime = 'nodejs' // ✅ Ajouter ceci
```

### Erreur 2 : "arrayBuffer is not a function"

**Cause** : Vieille version de Next.js

**Solution** :
```bash
npm install next@latest
```

### Erreur 3 : Signature toujours invalide

**Causes possibles** :
1. Secret webhook incorrect → Vérifier dans Stripe Dashboard
2. Mode incohérent (Test vs Live) → Vérifier `event.livemode` dans les logs
3. Plusieurs endpoints actifs → Garder un seul endpoint
4. Middleware qui modifie la requête → Supprimer le middleware

---

## ✅ RÉSULTAT FINAL

Avec `arrayBuffer()` + `Buffer.from()` :

✅ **Body brut exact** transmis à Stripe  
✅ **Aucune transformation** du contenu  
✅ **Signature valide** à chaque fois  
✅ **0 erreur** "No signatures found..."  
✅ **Compatible** avec tous les événements Stripe  

---

**Dernière mise à jour** : 11 octobre 2025  
**Version** : 4.0 (Raw body avec Buffer)

