# 🚀 Quickstart : Tester votre Webhook Stripe en 5 minutes

Guide ultra-rapide pour valider que votre webhook fonctionne parfaitement.

---

## ⚡ Test le plus simple (recommandé)

### Option 1 : Depuis le Stripe Dashboard (30 secondes)

1. **Ouvrez :** [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)

2. **Cliquez** sur votre endpoint webhook

3. **Cliquez** sur "Send test event"

4. **Sélectionnez** `checkout.session.completed`

5. **Cliquez** sur "Send test event"

6. **Vérifiez** : Status `200 OK` ✅

**C'est tout !** Si vous voyez `200 OK`, votre webhook fonctionne ! 🎉

---

## 🧪 Test avec notre script (1 minute)

```bash
# Tester en production
node test-webhook-stripe.js

# Tester en local
node test-webhook-stripe.js --local
```

**Résultat attendu :**
```
✅ Test 1 PASSÉ : Requête rejetée sans signature (400)
✅ Test 2 PASSÉ : Requête rejetée avec signature invalide (400)
✅ Test 3 PASSÉ : Endpoint accessible et GET bloqué (405)
```

---

## 🔍 Vérifier les logs en production

### Dans Vercel

```bash
# Méthode 1 : CLI
vercel logs --follow

# Méthode 2 : Dashboard
# Ouvrir : https://vercel.com/tiberefillie/ekicare-v3
# Aller dans : Functions > /api/stripe/webhook
```

### Dans Stripe Dashboard

```bash
# Ouvrir : https://dashboard.stripe.com/test/webhooks
# Cliquer sur votre endpoint
# Onglet : Event history
```

---

## ✅ Ce que vous devez voir

### 1. Dans Stripe Dashboard

```
✅ Status: 200 OK
✅ Response: {"received":true}
✅ Response time: < 1s
✅ Attempts: 1
```

### 2. Dans Vercel Logs

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛰️  [WEBHOOK] Nouveau webhook Stripe reçu
🕐 [WEBHOOK] Timestamp: 2025-10-12T14:23:45.123Z
✅ [WEBHOOK] Signature présente
📦 [WEBHOOK] Lecture du raw body...
✅ [WEBHOOK] Raw body récupéré: 1234 bytes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ✅ ✅ Signature Stripe validée avec succès ✅ ✅ ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 Type d'événement: checkout.session.completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 ÉVÉNEMENT: checkout.session.completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 Session ID: cs_test_xxxxx
💳 Payment status: paid
✅ Webhook traité avec succès
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ✅ ✅ WEBHOOK TRAITÉ AVEC SUCCÈS ✅ ✅ ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🐛 Problèmes courants

### ❌ Erreur 400 : "No signatures found matching..."

**Causes possibles :**
1. `STRIPE_WEBHOOK_SECRET` incorrect dans Vercel
2. Plusieurs endpoints actifs dans Stripe (gardez-en un seul)
3. Le secret ne correspond pas à l'endpoint

**Solution :**
```bash
# 1. Vérifier le secret dans Stripe Dashboard
# 2. Copier le secret (commence par whsec_)
# 3. Mettre à jour dans Vercel :
#    Settings > Environment Variables > STRIPE_WEBHOOK_SECRET
# 4. Redéployer l'application
```

### ❌ Pas de logs dans Vercel

**Solution :**
```bash
# Vérifier que l'app est déployée
vercel --prod

# Forcer un redéploiement
git commit --allow-empty -m "Trigger deploy"
git push
```

### ❌ Erreur : "Missing Stripe signature"

**Solution :**
- Assurez-vous d'envoyer l'événement depuis Stripe (pas manuellement avec curl)
- Utilisez le Dashboard Stripe pour envoyer un test event

---

## 🎯 Commandes ultra-rapides

```bash
# Test rapide
node test-webhook-stripe.js

# Voir les logs en temps réel
vercel logs --follow

# Envoyer un événement test (si Stripe CLI installé)
stripe trigger checkout.session.completed

# Lister les événements récents
stripe events list --limit 10
```

---

## 📦 Fichiers créés

- ✅ `/app/api/stripe/webhook/route.ts` - Route webhook corrigée
- ✅ `GUIDE_TEST_WEBHOOK_STRIPE.md` - Guide complet détaillé
- ✅ `test-webhook-stripe.js` - Script de test rapide
- ✅ `QUICKSTART_WEBHOOK_TEST.md` - Ce fichier

---

## 🎉 Prochaines étapes

Une fois que votre webhook fonctionne (retourne 200 OK) :

1. **Implémenter la logique métier**
   ```typescript
   if (event.type === "checkout.session.completed") {
     const session = event.data.object;
     const userId = session.metadata?.userId;
     
     // Activer le profil pro dans votre base de données
     await activateProProfile(userId);
   }
   ```

2. **Tester un vrai paiement** avec une carte de test Stripe

3. **Activer le mode production** et utiliser les vraies clés

---

## 📚 Ressources

- **Guide détaillé :** `GUIDE_TEST_WEBHOOK_STRIPE.md`
- **Documentation Stripe :** [stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **Cartes de test :** [stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## ✨ Résumé

Votre webhook est configuré pour :
- ✅ Lire le raw body sans altération
- ✅ Valider la signature Stripe avec `constructEventAsync`
- ✅ Logger tous les détails pour le debug
- ✅ Retourner `200 OK` pour les événements valides
- ✅ Gérer proprement les erreurs

**Vous êtes prêt ! 🚀**



