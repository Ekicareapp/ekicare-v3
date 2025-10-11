# 🔍 AUDIT COMPLET WEBHOOK STRIPE - GUIDE ÉTAPE PAR ÉTAPE

## 📋 CHECKLIST D'AUDIT SYSTÉMATIQUE

### ✅ ÉTAPE 1 : NETTOYER STRIPE DASHBOARD

**URL** : https://dashboard.stripe.com/webhooks

#### Actions :
1. **Supprimer TOUS les endpoints sauf UN**
   - Endpoint à garder : `https://ekicare-v3.vercel.app/api/stripe/webhook`
   - Supprimer tous les autres (dev, test, anciens, doublons)

2. **Vérifier le mode** (coin haut droit)
   - 🧪 **Mode Test** → Toggle activé
   - 🔴 **Mode Live** → Toggle désactivé
   - **Choisir UN mode et rester cohérent**

3. **Régénérer le webhook secret**
   - Dans l'endpoint → "Signing secret" → "Roll secret"
   - Copier le nouveau `whsec_...`

4. **Vérifier les événements écoutés**
   - ✅ `checkout.session.completed`
   - ✅ `invoice.payment_succeeded`
   - ✅ `customer.subscription.updated`

---

### ✅ ÉTAPE 2 : CONFIGURER VERCEL (PRODUCTION)

**URL** : https://vercel.com/ekicareapp/ekicare-v3/settings/environment-variables

#### Variables à vérifier :

| Variable | Valeur | Mode Test | Mode Live |
|----------|--------|-----------|-----------|
| `STRIPE_SECRET_KEY` | `sk_xxxx_...` | `sk_test_` | `sk_live_` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | whsec Test | whsec Live |
| `STRIPE_PRICE_ID` | `price_...` | price Test | price Live |

#### ⚠️ CRITIQUE : Environment

**Vérifier que les variables sont en "Production"**, pas seulement "Preview" !

1. Cliquer sur chaque variable
2. Vérifier les checkboxes :
   - ✅ **Production** (obligatoire)
   - ✅ **Preview** (optionnel)
   - ⬜ **Development** (optionnel)

#### Actions :
1. Éditer `STRIPE_WEBHOOK_SECRET`
2. Coller le nouveau secret de l'Étape 1
3. **Cocher "Production"**
4. Sauvegarder

---

### ✅ ÉTAPE 3 : VÉRIFIER LE CODE

#### 3.1 Un seul handler webhook

```bash
# Vérifier qu'il n'y a qu'un seul fichier webhook
find app -name "*webhook*.ts"
```

**✅ Résultat attendu** :
```
app/api/stripe/webhook/route.ts
```

**❌ Si plusieurs fichiers** : Supprimer les doublons

#### 3.2 Pas de middleware

```bash
# Vérifier qu'il n'y a pas de middleware
ls middleware.{ts,js} 2>/dev/null && echo "❌ Middleware trouvé" || echo "✅ Pas de middleware"
```

**✅ Résultat attendu** : `✅ Pas de middleware`

#### 3.3 Configuration correcte

**Fichier** : `app/api/stripe/webhook/route.ts`

```typescript
// ✅ Vérifié dans le code
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ✅ Lecture buffer brut
const arrayBuffer = await request.arrayBuffer()
const body = Buffer.from(arrayBuffer)

// ✅ Passage à Stripe
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
```

---

### ✅ ÉTAPE 4 : REDÉPLOYER

```bash
git add -A
git commit -m "Audit webhook: logs détaillés + vérification mode"
git push origin main
```

**Attendre le déploiement** : 30-60 secondes

---

### ✅ ÉTAPE 5 : TESTER AVEC STRIPE CLI

#### 5.1 Installation (si pas déjà fait)

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

#### 5.2 Déclencher un événement de test

```bash
stripe trigger checkout.session.completed --forward-to https://ekicare-v3.vercel.app/api/stripe/webhook
```

#### 5.3 Vérifier les logs Vercel

**URL** : https://vercel.com/ekicareapp/ekicare-v3/logs

**Filtrer par** : `[WEBHOOK]`

---

## 📊 LOGS ATTENDUS (SUCCÈS ✅)

### Configuration au démarrage :

```
🔧 [WEBHOOK-INIT] Configuration chargée:
  - Stripe Secret Key: sk_test_51XXX... (ou sk_live_51XXX...)
  - Stripe Secret Key Mode: TEST (ou LIVE)
  - Webhook Secret: whsec_XXXX...
  - Webhook Secret Valid: OUI
```

### Réception d'un webhook :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛰️ [WEBHOOK] Nouveau webhook Stripe reçu
🕐 [WEBHOOK] Timestamp: 2025-10-11T20:30:45.123Z

━━━ REQUÊTE ━━━
📍 [WEBHOOK] URL complète: https://ekicare-v3.vercel.app/api/stripe/webhook
🌐 [WEBHOOK] Host: ekicare-v3.vercel.app
🔑 [WEBHOOK] Webhook ID: evt_1234567890
👤 [WEBHOOK] User-Agent: Stripe/1.0

━━━ BODY ━━━
📦 [WEBHOOK] Body type: object
📦 [WEBHOOK] Body instanceof Buffer: true
📦 [WEBHOOK] Body length: 3245 bytes
📦 [WEBHOOK] Body preview (50 chars): {"id":"evt_xxx","object":"event","api_version"...

━━━ SIGNATURE ━━━
🔐 [WEBHOOK] Signature présente: true
🔐 [WEBHOOK] Signature tronquée: t=1697123456,v1=abc123def456...

━━━ CONFIGURATION ━━━
🔑 [WEBHOOK] Webhook Secret chargé: whsec_XXXX...
🔑 [WEBHOOK] Secret valid (whsec_): true
🔑 [WEBHOOK] Stripe Key Mode: TEST (ou LIVE)

━━━ SIGNATURE VALIDÉE ✅ ━━━
✅ [WEBHOOK] Signature vérifiée avec succès
📋 [WEBHOOK] Event ID: evt_1234567890
📋 [WEBHOOK] Event type: checkout.session.completed
📋 [WEBHOOK] Event livemode: false (ou true)
📋 [WEBHOOK] Event created: 2025-10-11T20:30:45.000Z
✅ [WEBHOOK] Mode cohérent: TEST (ou LIVE)

✅ [WEBHOOK] Événement traité avec succès
⏱️ [WEBHOOK] Durée totale: 245 ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🚨 LOGS EN CAS D'ERREUR (DIAGNOSTIC)

### Erreur signature invalide :

```
━━━ ERREUR SIGNATURE ❌ ━━━
❌ [WEBHOOK] Échec vérification signature
❌ [WEBHOOK] Erreur: No signatures found matching the expected signature for payload
❌ [WEBHOOK] Type: StripeSignatureVerificationError
❌ [WEBHOOK] Code: undefined

━━━ DIAGNOSTIC ━━━
🔍 [WEBHOOK] Timestamp: 2025-10-11T20:30:45.123Z
🔍 [WEBHOOK] Webhook ID: evt_1234567890
🔍 [WEBHOOK] Host: ekicare-v3.vercel.app
🔍 [WEBHOOK] URL: https://ekicare-v3.vercel.app/api/stripe/webhook
🔍 [WEBHOOK] Body Buffer: true
🔍 [WEBHOOK] Body Length: 3245 bytes
🔍 [WEBHOOK] Signature tronquée: t=1697123456,v1=abc123def456...
🔍 [WEBHOOK] Secret tronqué: whsec_XXXX...
🔍 [WEBHOOK] Secret valid (whsec_): true
🔍 [WEBHOOK] Stripe Key Mode: TEST

━━━ ACTIONS RECOMMANDÉES ━━━
1. Vérifier qu'un seul endpoint est actif dans Stripe Dashboard
2. Vérifier que STRIPE_WEBHOOK_SECRET correspond à cet endpoint
3. Vérifier que le mode (Test/Live) est cohérent
4. Régénérer le webhook secret si nécessaire
```

### Erreur mode incohérent :

```
━━━ ERREUR MODE INCOHÉRENT ❌ ━━━
⚠️ [WEBHOOK] MODE MISMATCH DÉTECTÉ !
  - Event livemode: true (reçu de Stripe)
  - Stripe Key Mode: TEST (configuré)
  - Action: Vérifier que les clés Stripe correspondent au même mode
```

---

## 🔧 DIAGNOSTIC PAR SYMPTÔME

### Symptôme 1 : "No signatures found matching"

**Causes possibles** :
1. ❌ Secret webhook incorrect
2. ❌ Plusieurs endpoints actifs avec secrets différents
3. ❌ Mode incohérent (Test vs Live)
4. ❌ Variable pas en "Production" sur Vercel

**Solution** :
- Suivre Étapes 1, 2 et 4 ci-dessus
- Vérifier les logs pour identifier la cause exacte

### Symptôme 2 : Mode incohérent détecté

**Cause** : `event.livemode` ne correspond pas à `STRIPE_SECRET_KEY`

**Solution** :
1. Vérifier le mode dans Stripe Dashboard
2. Mettre à jour TOUTES les variables Vercel pour correspondre
3. Redéployer

### Symptôme 3 : Body instanceof Buffer: false

**Cause** : Body parsé avant la vérification

**Solution** :
- Vérifier qu'il n'y a pas de middleware
- Vérifier le code : doit utiliser `arrayBuffer()` + `Buffer.from()`

### Symptôme 4 : Secret valid (whsec_): false

**Cause** : Secret mal copié ou invalide

**Solution** :
1. Copier à nouveau le secret depuis Stripe Dashboard
2. Vérifier qu'il commence par `whsec_`
3. Vérifier qu'il n'y a pas d'espaces
4. Mettre à jour dans Vercel (en Production)

---

## ✅ VALIDATION FINALE

### Checklist de validation :

- [ ] Un seul endpoint actif dans Stripe Dashboard
- [ ] Secret régénéré et copié
- [ ] Mode choisi (Test OU Live, pas mélangé)
- [ ] Variables Vercel en "Production"
- [ ] `STRIPE_SECRET_KEY` correspond au mode
- [ ] `STRIPE_WEBHOOK_SECRET` correspond au mode
- [ ] `STRIPE_PRICE_ID` correspond au mode
- [ ] Aucun doublon de route webhook
- [ ] Aucun middleware
- [ ] Code utilise `arrayBuffer()` + `Buffer.from()`
- [ ] Déploiement effectué
- [ ] Test avec Stripe CLI réussi
- [ ] Logs affichent "Signature vérifiée avec succès"
- [ ] Logs affichent "Mode cohérent"
- [ ] Stripe Dashboard affiche "200 Success"

---

## 🎯 RÉSULTAT ATTENDU

Après audit complet :

✅ **Configuration au démarrage** : mode et secrets affichés  
✅ **Tous les webhooks** : signature validée  
✅ **Mode cohérent** : event.livemode = config  
✅ **Body correct** : Buffer avec raw data  
✅ **Logs détaillés** : diagnostic facile  
✅ **0 erreur** de signature  
✅ **100% des événements** traités  

---

**Dernière mise à jour** : 11 octobre 2025  
**Version audit** : 5.0 (Complet avec logs détaillés)

