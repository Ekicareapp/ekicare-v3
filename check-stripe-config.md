# ✅ CHECKLIST CONFIGURATION STRIPE

## 🎯 À FAIRE MAINTENANT

### 1. **Nettoyer Stripe Dashboard**

📍 **URL** : https://dashboard.stripe.com/webhooks

**Actions** :
1. Supprimer TOUS les webhooks sauf UN
2. Garder uniquement : `https://ekicare-v3.vercel.app/api/stripe/webhook`
3. Événements à écouter :
   - ✅ `checkout.session.completed`
   - ✅ `invoice.payment_succeeded`
   - ✅ `customer.subscription.updated`

---

### 2. **Vérifier le mode (Test vs Live)**

**Coin haut droit du Dashboard Stripe** :
- 🧪 **Mode Test** (toggle activé) → Clés test
- 🔴 **Mode Live** (toggle désactivé) → Clés live

**⚠️ IMPORTANT** : Une fois le mode choisi, TOUTES les clés doivent correspondre !

---

### 3. **Copier le secret webhook**

Dans l'endpoint webhook actif :
1. Cliquer sur "Signing secret"
2. Cliquer sur "Reveal"
3. Copier le secret complet : `whsec_xxxxxxxxxxxxxxxxx`

---

### 4. **Vérifier les variables Vercel**

📍 **URL** : https://vercel.com/ekicareapp/ekicare-v3/settings/environment-variables

**Variables à vérifier** :

| Variable | Valeur attendue | Mode Test | Mode Live |
|----------|-----------------|-----------|-----------|
| `STRIPE_SECRET_KEY` | `sk_xxxx_...` | `sk_test_` | `sk_live_` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | whsec du test | whsec du live |
| `STRIPE_PRICE_ID` | `price_...` | price du test | price du live |

**⚠️ VÉRIFICATION CRITIQUE** :
```
Si STRIPE_SECRET_KEY = sk_test_xxx
Alors STRIPE_WEBHOOK_SECRET doit être celui du mode TEST

Si STRIPE_SECRET_KEY = sk_live_xxx
Alors STRIPE_WEBHOOK_SECRET doit être celui du mode LIVE
```

---

### 5. **Mettre à jour si nécessaire**

Si les variables ne correspondent pas :

1. **Vercel** → Environment Variables → Éditer
2. Coller les nouvelles valeurs
3. **Sauvegarder**
4. **Redéployer** :
   ```bash
   git commit --allow-empty -m "Redeploy avec nouvelles variables Stripe"
   git push origin main
   ```

---

## 🧪 TEST APRÈS CONFIGURATION

### Test 1 : Créer un compte pro

1. Aller sur https://ekicare-v3.vercel.app/signup
2. Remplir le formulaire pro
3. Payer avec carte test : `4242 4242 4242 4242`

### Test 2 : Vérifier les logs Vercel

Tu devrais voir :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛰️ [WEBHOOK] Nouveau webhook Stripe reçu
🕐 [WEBHOOK] Timestamp: 2025-10-11T...
📍 [WEBHOOK] URL appelée: https://ekicare-v3.vercel.app/api/stripe/webhook
🔑 [WEBHOOK] Webhook ID: evt_xxx
👤 [WEBHOOK] User-Agent: Stripe/1.0
📦 [WEBHOOK] Body length: 3245
🔐 [WEBHOOK] Signature présente: true
🔐 [WEBHOOK] Secret starts with whsec_: true
✅ [WEBHOOK] Signature vérifiée avec succès
📋 [WEBHOOK] Event ID: evt_xxx
📋 [WEBHOOK] Event type: checkout.session.completed
📋 [WEBHOOK] Event livemode: false  <-- Doit correspondre au mode
✅ [WEBHOOK] Événement traité avec succès
⏱️ [WEBHOOK] Durée totale: 245 ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Test 3 : Vérifier Stripe Dashboard

**Webhooks** → Ton endpoint → **Event logs**

✅ **Tous les événements doivent être** : `200 Success`

---

## 🚨 SI ERREURS PERSISTENT

### Cas 1 : Un seul event passe, les autres échouent

**Cause** : Plusieurs endpoints actifs avec des secrets différents

**Solution** :
1. Supprimer tous les webhooks sauf un dans Stripe Dashboard
2. Régénérer le secret (Roll secret)
3. Mettre à jour `STRIPE_WEBHOOK_SECRET` dans Vercel
4. Redéployer

### Cas 2 : Event livemode ne correspond pas

**Exemple d'erreur** :
```
📋 [WEBHOOK] Event livemode: true   <-- Live
Mais STRIPE_SECRET_KEY = sk_test_xxx  <-- Test
```

**Solution** :
- Passer en mode Live dans Stripe Dashboard
- Copier les clés Live
- Mettre à jour TOUTES les variables dans Vercel

### Cas 3 : Secret starts with whsec_: false

**Cause** : Secret mal copié ou invalide

**Solution** :
1. Copier à nouveau le secret depuis Stripe Dashboard
2. Vérifier qu'il commence bien par `whsec_`
3. Vérifier qu'il n'y a pas d'espaces avant/après
4. Mettre à jour dans Vercel
5. Redéployer

---

## 📊 COMMANDES UTILES

### Vérifier le déploiement Vercel
```bash
# Voir les logs en temps réel
vercel logs --follow

# Filtrer les logs webhook
vercel logs --follow | grep WEBHOOK
```

### Tester avec Stripe CLI (local)
```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Terminal 3
stripe trigger checkout.session.completed
```

---

## ✅ VALIDATION FINALE

Coche chaque élément une fois vérifié :

- [ ] Un seul endpoint webhook actif dans Stripe Dashboard
- [ ] Mode Stripe cohérent (Test OU Live, pas mélangé)
- [ ] `STRIPE_SECRET_KEY` correspond au mode choisi
- [ ] `STRIPE_WEBHOOK_SECRET` correspond au mode choisi
- [ ] `STRIPE_PRICE_ID` correspond au mode choisi
- [ ] Aucun doublon de route `/api/stripe/webhook`
- [ ] Variables Vercel à jour
- [ ] Déploiement effectué
- [ ] Test paiement réussi
- [ ] Logs Vercel affichent "Signature vérifiée avec succès"
- [ ] Stripe Dashboard affiche "200 Success" pour tous les events
- [ ] `Event livemode` correspond au mode des clés

---

**Une fois tout validé, le système devrait fonctionner à 100% ! 🚀**

**Besoin d'aide ?** Voir `DIAGNOSTIC_WEBHOOK_SIGNATURE.md` pour le diagnostic détaillé.

