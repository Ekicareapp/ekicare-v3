# 🧪 GUIDE DE TEST - PAIEMENT STRIPE

## 📋 PRÉPARATION

### 1. Variables d'environnement Vercel

Vérifier que ces variables sont bien configurées :

```bash
STRIPE_SECRET_KEY=sk_live_xxx (ou sk_test_xxx)
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### 2. Webhook Stripe configuré

Dans le Dashboard Stripe :
- URL : `https://ekicare-v3.vercel.app/api/stripe/webhook`
- Événements : `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`
- Secret copié dans `STRIPE_WEBHOOK_SECRET`

---

## 🎯 TEST COMPLET DU FLOW

### Étape 1 : Créer un compte pro

1. Aller sur https://ekicare-v3.vercel.app/signup
2. Sélectionner "Je suis un professionnel"
3. Remplir le formulaire :
   - Email
   - Mot de passe
   - Prénom, Nom
   - Téléphone
   - Profession (ex: Vétérinaire)
   - Ville (utiliser l'autocomplete)
   - Rayon (ex: 50 km)
   - SIRET
   - Justificatif professionnel (fichier)
4. Cliquer sur "Créer mon compte"

**✅ Résultat attendu** : Redirection vers Stripe Checkout

---

### Étape 2 : Paiement Stripe

1. Sur la page Stripe, utiliser une carte test :
   - **Succès** : `4242 4242 4242 4242`
   - **Échec** : `4000 0000 0000 0002`
   - Date : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres

2. Cliquer sur "S'abonner"

**✅ Résultat attendu** : Redirection vers `/success-pro`

---

### Étape 3 : Vérifier le webhook

**Ouvrir les logs Vercel** : https://vercel.com/ekicareapp/ekicare-v3/logs

Tu devrais voir :

```
🛰️ [WEBHOOK] Webhook Stripe reçu
✅ [WEBHOOK] Signature vérifiée avec succès
📋 [WEBHOOK] Événement type: checkout.session.completed
🔍 [WEBHOOK] Données de la session:
  - client_reference_id: xxx
  - user_id final: xxx
👤 [WEBHOOK] User ID: xxx
💰 [WEBHOOK] Payment status: paid
🔍 [WEBHOOK] Recherche du profil pour user_id: xxx
📊 [WEBHOOK] Résultat recherche profil:
  - Profils trouvés: 1
✅ [WEBHOOK] Profil trouvé, ID: xxx
📊 [WEBHOOK] État actuel:
  - is_verified: false
  - is_subscribed: false
💾 [WEBHOOK] Données Stripe reçues:
  - Customer ID: cus_xxx
  - Subscription ID: sub_xxx
  - Session ID: cs_xxx
🔄 [WEBHOOK] Mise à jour avec: { is_verified: true, is_subscribed: true }
✅ [WEBHOOK] Profil mis à jour avec succès
```

**❌ Si erreur PGRST204** : C'est normal, le code gère ça gracieusement maintenant.

---

### Étape 4 : Vérifier la page success-pro

**Dans la console navigateur** (F12), tu devrais voir :

**Si le webhook est rapide (< 1s)** :
```
🛰️ [CHECK] Vérification si le webhook a déjà mis à jour le profil...
📊 [CHECK] Statut profil: { is_verified: true, is_subscribed: true }
✅ [CHECK] Webhook a déjà activé le profil !
✅ [POLLING] Webhook a réussi ! Profil activé.
```

**Si le webhook est lent (> 3s)** :
```
🔄 [POLLING] Tentative 1/10
🔄 [POLLING] Tentative 2/10
🔄 [POLLING] Tentative 3/10
🧭 [FALLBACK] Webhook lent, activation du fallback manuel...
🚀 [FALLBACK] Résultat: { verified: true, subscribed: true }
✅ [FALLBACK] Profil activé via fallback !
```

**✅ Résultat visuel** :
- Confettis animés 🎉
- Message "Abonnement activé !"
- Bouton "Accéder à mon tableau de bord Pro" devient cliquable et orange

---

### Étape 5 : Accéder au dashboard

1. Cliquer sur "Accéder à mon tableau de bord Pro"
2. Tu devrais arriver sur `/dashboard/pro`
3. Le profil devrait être entièrement fonctionnel

**✅ Vérifications** :
- Pas de redirection vers signup
- Toutes les sections accessibles
- Profil affiché correctement

---

## 🔍 VÉRIFIER EN BASE DE DONNÉES

### Supabase : Table `pro_profiles`

1. Aller dans Supabase → Table Editor → `pro_profiles`
2. Chercher l'utilisateur par email ou user_id
3. Vérifier les colonnes :
   - `is_verified` = `true` ✅
   - `is_subscribed` = `true` ✅
   - `prenom`, `nom`, `telephone`, etc. remplis

---

## ⚠️ PROBLÈMES COURANTS

### Webhook retourne 400 / Signature invalide

**Cause** : Secret webhook incorrect

**Solution** :
1. Copier le NOUVEAU secret depuis Stripe Dashboard
2. Le mettre dans Vercel → `STRIPE_WEBHOOK_SECRET`
3. Redéployer

### Profil non trouvé (PGRST116)

**Cause** : Le profil n'a pas été créé lors du signup

**Solution** :
1. Vérifier que le signup a bien créé la ligne dans `pro_profiles`
2. Vérifier les logs du signup pour voir si erreur
3. Vérifier les RLS policies Supabase

### Colonnes manquantes (PGRST204)

**Cause** : Colonnes Stripe non présentes dans le schéma

**Solution** : C'est normal ! Le code gère ça automatiquement maintenant.
- Les colonnes `stripe_customer_id`, `stripe_subscription_id`, etc. sont optionnelles
- Le webhook log les données mais ne les sauvegarde pas
- Voir `SCHEMA_PRO_PROFILES.md` pour ajouter ces colonnes si nécessaire

### Fallback ne fonctionne pas

**Cause** : Problème API verify-payment

**Solution** :
1. Vérifier les logs Vercel pour `/api/auth/verify-payment`
2. Vérifier que `STRIPE_SECRET_KEY` est correct
3. Vérifier que le profil existe bien

---

## 🎯 TEST AUTOMATISÉ (Stripe CLI)

### Installation Stripe CLI

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

### Écouter les webhooks en local

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

### Déclencher un événement test

```bash
stripe trigger checkout.session.completed
```

**✅ Tu devrais voir** :
- Logs dans le terminal Stripe CLI
- Logs dans le terminal Next.js
- Webhook traité avec succès

---

## 📊 MONITORING PRODUCTION

### Vercel Logs

Filtre recommandé : `[WEBHOOK]` ou `[FALLBACK]`

### Stripe Dashboard

- Webhooks → Événements récents
- Vérifier que les événements sont bien envoyés (200 OK)
- Si 400/500, copier les logs pour debug

---

## ✅ CHECKLIST VALIDATION

- [ ] Compte pro créé avec succès
- [ ] Redirection vers Stripe fonctionne
- [ ] Paiement accepté sur Stripe
- [ ] Webhook reçu (logs Vercel)
- [ ] Signature vérifiée ✅
- [ ] Profil trouvé (pas de PGRST116)
- [ ] Mise à jour réussie (is_verified + is_subscribed)
- [ ] Pas d'erreur PGRST204 (ou gérée gracieusement)
- [ ] Page success-pro affiche confettis
- [ ] Bouton dashboard cliquable
- [ ] Accès au dashboard pro fonctionne
- [ ] Base de données à jour (is_verified = true)

---

**Dernière mise à jour** : 11 octobre 2025  
**Version système** : 2.0 (Webhook + Fallback robuste)

