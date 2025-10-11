# 🔍 IDENTIFIER L'ENDPOINT STRIPE PROBLÉMATIQUE

## 🎯 OBJECTIF

Tu as quelques erreurs `StripeSignatureVerificationError` mais pas toutes.  
**Cause probable** : Plusieurs endpoints Stripe sont actifs avec des secrets différents.

Ce guide t'aide à **identifier quel endpoint pose problème** et le corriger.

---

## 📊 MÉTHODE D'IDENTIFICATION

### Étape 1 : Récupérer le timestamp de l'erreur

Dans les **logs Vercel** d'une erreur, chercher :

```
━━━ SIGNATURE REÇUE ━━━
🔐 [WEBHOOK] Timestamp (t): 1697123456
```

**Copier ce timestamp** (ex: `1697123456`)

### Étape 2 : Chercher dans Stripe Dashboard

1. Aller sur https://dashboard.stripe.com/webhooks
2. Pour chaque endpoint, cliquer dessus
3. Aller dans l'onglet **"Event logs"**
4. Chercher un event avec le même timestamp

**Conversion timestamp** (si besoin) :
```bash
# Unix timestamp → Date
date -r 1697123456
```

### Étape 3 : Identifier l'endpoint fautif

Une fois l'event trouvé :
- Tu verras **quel endpoint** l'a envoyé
- Tu verras le **status** (200 ou 400)
- Tu peux comparer le **secret** de cet endpoint

---

## 🔧 SOLUTION : UN SEUL ENDPOINT

### Option A : Nettoyer (RECOMMANDÉ)

1. **Supprimer TOUS les endpoints** sauf un
2. **Garder uniquement** :
   ```
   https://ekicare-v3.vercel.app/api/stripe/webhook
   ```
3. **Régénérer le secret** : "Roll secret"
4. **Copier** le nouveau `whsec_...`
5. **Mettre à jour** dans Vercel en **Production**
6. **Redéployer**

### Option B : Map de secrets (si nécessaire)

Si tu as **besoin** de plusieurs endpoints (dev, staging, prod) :

```typescript
// app/api/stripe/webhook/route.ts

// Map des secrets par host
const WEBHOOK_SECRETS: Record<string, string> = {
  'ekicare-v3.vercel.app': process.env.STRIPE_WEBHOOK_SECRET_PROD!,
  'ekicare-v3-preview.vercel.app': process.env.STRIPE_WEBHOOK_SECRET_PREVIEW!,
  'localhost:3000': process.env.STRIPE_WEBHOOK_SECRET_LOCAL!,
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const webhookSecret = WEBHOOK_SECRETS[host] || process.env.STRIPE_WEBHOOK_SECRET!
  
  console.log('🔑 [WEBHOOK] Host:', host)
  console.log('🔑 [WEBHOOK] Secret sélectionné:', webhookSecret.substring(0, 12) + '...')
  
  // ... reste du code
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
}
```

**Puis configurer dans Vercel** :
- `STRIPE_WEBHOOK_SECRET_PROD` = secret de l'endpoint prod
- `STRIPE_WEBHOOK_SECRET_PREVIEW` = secret de l'endpoint preview

---

## 📋 LOGS DÉTAILLÉS POUR DEBUG

### Logs en cas d'erreur (ajoutés automatiquement) :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ ERREUR SIGNATURE STRIPE - MISMATCH DÉTECTÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ SIGNATURE REÇUE ━━━
🔐 [WEBHOOK] Timestamp (t): 1697123456
🔐 [WEBHOOK] Signature v1: abc123def4...
🔐 [WEBHOOK] Signature v0: xyz789ghi0...

━━━ SECRET CONFIGURÉ ━━━
🔑 [WEBHOOK] Secret tronqué: whsec_XXXX...
🔑 [WEBHOOK] Environment: production

━━━ COMPARAISON POUR DEBUG ━━━
Pour identifier l'endpoint problématique:
1. Comparer le timestamp: 1697123456
2. Chercher dans Stripe Dashboard → Webhooks → Event logs
3. Trouver l'event avec ce timestamp
4. Voir quel endpoint l'a envoyé
```

### Utiliser ces infos :

1. **Copier le timestamp** (ex: `1697123456`)
2. **Aller dans Stripe Dashboard** → Webhooks
3. Pour **chaque endpoint**, cliquer → Event logs
4. **Chercher l'event** avec ce timestamp
5. **Identifier l'endpoint** qui l'a envoyé
6. **Supprimer cet endpoint** OU mettre à jour son secret

---

## 🧪 TESTER LA CORRECTION

### Test 1 : Stripe CLI

```bash
stripe trigger checkout.session.completed --forward-to https://ekicare-v3.vercel.app/api/stripe/webhook
```

**✅ Résultat attendu** :
```
✅ [WEBHOOK] Signature vérifiée avec succès
✅ [WEBHOOK] Mode cohérent: TEST
✅ [WEBHOOK] Événement traité avec succès
```

### Test 2 : Vrai paiement

1. Créer un compte pro
2. Effectuer le paiement
3. Vérifier les logs Vercel
4. **0 erreur** de signature

### Test 3 : Stripe Dashboard

1. Aller dans Webhooks → Ton endpoint → Event logs
2. **Tous les events** doivent être en `200 Success`
3. **Aucun event** en `400` (signature invalide)

---

## 📊 STATISTIQUES UTILES

### Commande pour compter les erreurs :

```bash
# Dans les logs Vercel, chercher :
# - Nombre de succès : grep "Signature vérifiée avec succès"
# - Nombre d'erreurs : grep "ERREUR SIGNATURE STRIPE"
```

### Objectif final :

- ✅ **100% de succès** sur les webhooks
- ✅ **0 erreur 400** dans Stripe Dashboard
- ✅ **0 erreur signature** dans les logs Vercel

---

## 🔍 EXEMPLE COMPLET DE DEBUG

### Scénario : 3 webhooks sur 10 échouent

#### Étape 1 : Récupérer les timestamps

Dans les logs Vercel, chercher les 3 erreurs :
```
Erreur 1: Timestamp (t): 1697123456
Erreur 2: Timestamp (t): 1697123789
Erreur 3: Timestamp (t): 1697124012
```

#### Étape 2 : Chercher dans Stripe

1. Dashboard → Webhooks
2. Supposons 3 endpoints actifs :
   - Endpoint A : `https://ekicare-v3.vercel.app/api/stripe/webhook`
   - Endpoint B : `https://ekicare-dev.vercel.app/api/stripe/webhook`
   - Endpoint C : `https://old-ekicare.vercel.app/api/stripe/webhook`

3. Vérifier les event logs de chaque endpoint
4. Trouver les 3 timestamps

#### Étape 3 : Identifier le pattern

Si les 3 timestamps sont tous sur **Endpoint B** :
→ **C'est Endpoint B qui pose problème**

**Solution** : Supprimer Endpoint B

#### Étape 4 : Vérifier

Après suppression de Endpoint B :
- ✅ Plus d'erreur sur les 3 timestamps
- ✅ 100% de succès sur les nouveaux webhooks

---

## 🎯 CHECKLIST FINALE

- [ ] Identifier les timestamps des erreurs
- [ ] Chercher dans Stripe Dashboard → Event logs
- [ ] Identifier quel endpoint envoie les erreurs
- [ ] Supprimer cet endpoint OU mettre à jour son secret
- [ ] Garder UN SEUL endpoint actif
- [ ] Régénérer le secret de cet endpoint unique
- [ ] Mettre à jour `STRIPE_WEBHOOK_SECRET` en Production sur Vercel
- [ ] Redéployer
- [ ] Tester avec Stripe CLI
- [ ] Vérifier 100% de succès

---

## 💡 PRÉVENTION FUTURE

### Bonne pratique :

**Un seul endpoint par environnement** :
- Production : `https://ekicare-v3.vercel.app/api/stripe/webhook`
- Preview : (optionnel) avec son propre secret
- Dev : Stripe CLI local

**Éviter** :
- ❌ Plusieurs endpoints sur la même URL
- ❌ Endpoints oubliés (anciens projets)
- ❌ Secrets non mis à jour après régénération

---

**Avec ces logs détaillés, tu peux maintenant identifier précisément quel endpoint pose problème ! 🎯**

