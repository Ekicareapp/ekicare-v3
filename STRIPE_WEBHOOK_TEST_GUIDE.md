# 🧪 Guide de Test - Webhook Stripe `checkout.session.completed`

## 🎯 Objectif
Vérifier que le webhook Stripe met correctement à jour `is_verified = true` et `is_subscribed = true` dans la table `pro_profiles` après un paiement réussi.

## 📋 Prérequis

### 1. **Variables d'environnement requises**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 2. **Outils nécessaires**
- Serveur Next.js démarré
- Stripe CLI installé
- Accès à Supabase Dashboard

## 🚀 Test Complet

### Étape 1: Démarrer les services

**Terminal 1 - Serveur Next.js:**
```bash
npm run dev
# Le serveur doit être sur http://localhost:3002
```

**Terminal 2 - Stripe CLI:**
```bash
stripe listen --forward-to localhost:3002/api/webhooks/stripe
# Notez le webhook secret affiché (whsec_...)
```

### Étape 2: Créer un compte professionnel

1. **Aller sur** `http://localhost:3002/signup`
2. **Sélectionner** "Professionnel"
3. **Remplir les champs:**
   - Email: `test.webhook@example.com`
   - Mot de passe: `test123456`
   - Prénom: `Test`
   - Nom: `Webhook`
   - Téléphone: `0612345678`
   - Profession: `Vétérinaire équin`
   - Localisation: `Paris, France`
   - Rayon: `30`
   - SIRET: `12345678901234`
   - Photo: Uploader une image
   - Justificatif: Uploader un PDF

4. **Cliquer sur** "S'inscrire"
5. **Être redirigé** vers Stripe Checkout

### Étape 3: Effectuer le paiement test

1. **Utiliser la carte de test:**
   - Numéro: `4242 4242 4242 4242`
   - Date: `12/34`
   - CVC: `123`
   - Code postal: `12345`

2. **Confirmer le paiement**

### Étape 4: Vérifier les logs du webhook

Dans le terminal du serveur Next.js, vous devriez voir :

```
🔔 Webhook Stripe reçu
✅ Signature webhook vérifiée
💳 Événement checkout.session.completed reçu
🕐 Timestamp: 2025-01-26T...
📋 Session ID: cs_test_...
📋 Session metadata complète: {
  "userId": "uuid-utilisateur",
  "source": "signup_pro",
  "user_type": "professional"
}
✅ userId trouvé directement dans metadata.userId
👤 User ID extrait avec succès: uuid-utilisateur
🔍 Type du userId: string
🔍 Vérification de l'existence du profil pour user_id: uuid-utilisateur
📊 Profil existant trouvé: { user_id: 'uuid-utilisateur', is_verified: false, is_subscribed: false }
🔄 Début de la mise à jour de pro_profiles
📝 User ID ciblé: uuid-utilisateur
📝 Valeurs à mettre à jour:
   - is_verified: true
   - is_subscribed: true
   - subscription_end: +30 jours
📅 Date de fin d'abonnement calculée: 2025-02-25T...
✅ Mise à jour SQL effectuée avec succès
📊 Résultat de la mise à jour: [...]
🔍 Vérification post-mise à jour...
✅ Vérification réussie - Profil final:
   👤 User ID: uuid-utilisateur
   ✅ is_verified: true
   💳 is_subscribed: true
   📅 subscription_end: 2025-02-25T...
   🕐 updated_at: 2025-01-26T...
🎯 Vérifications finales:
   ✅ is_verified = true: ✅
   ✅ is_subscribed = true: ✅
   ✅ subscription_end défini: ✅
🎉 MISE À JOUR COMPLÈTE ET RÉUSSIE pour user: uuid-utilisateur
```

### Étape 5: Vérifier dans Supabase

1. **Aller sur** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Sélectionner** votre projet
3. **Aller dans** Table Editor → `pro_profiles`
4. **Filtrer** par `user_id` = `uuid-utilisateur`
5. **Vérifier** que :
   - `is_verified` = `true`
   - `is_subscribed` = `true`
   - `subscription_end` = date future (30 jours)

### Étape 6: Vérifier l'accès au dashboard

1. **Être redirigé** vers `/success-pro`
2. **Cliquer sur** "Accéder à mon tableau de bord Pro"
3. **Vérifier** que l'accès au dashboard est autorisé
4. **Aller sur** `/dashboard/pro/profil`
5. **Vérifier** que les informations du profil sont chargées

## 🔍 Tests de Validation

### Test 1: Vérification des logs
- [ ] Webhook reçu et signature vérifiée
- [ ] `userId` extrait correctement des metadata
- [ ] Profil existant trouvé dans `pro_profiles`
- [ ] Mise à jour SQL réussie
- [ ] Vérification post-mise à jour confirmée

### Test 2: Vérification de la base de données
- [ ] `is_verified` = `true`
- [ ] `is_subscribed` = `true`
- [ ] `subscription_end` défini et valide
- [ ] `updated_at` mis à jour

### Test 3: Vérification de l'interface
- [ ] Redirection vers `/success-pro`
- [ ] Accès autorisé au dashboard pro
- [ ] Profil chargé correctement

## 🚨 Dépannage

### Problème: Webhook non reçu
```bash
# Vérifier que Stripe CLI est actif
stripe listen --forward-to localhost:3002/api/webhooks/stripe

# Vérifier les logs Stripe
stripe events list --limit 5
```

### Problème: Signature invalide
```bash
# Vérifier le webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Redémarrer Stripe CLI
stripe listen --forward-to localhost:3002/api/webhooks/stripe
```

### Problème: userId non trouvé
- Vérifier que l'API `/api/checkout-session` utilise `metadata.userId`
- Vérifier les logs de création de session Stripe

### Problème: Profil non trouvé
- Vérifier que l'utilisateur a bien un profil dans `pro_profiles`
- Vérifier que `user_id` correspond exactement

## 📊 Résultats Attendus

Après un paiement réussi :
- ✅ Webhook déclenché avec logs détaillés
- ✅ `userId` récupéré depuis `session.metadata.userId`
- ✅ `is_verified = true` dans `pro_profiles`
- ✅ `is_subscribed = true` dans `pro_profiles`
- ✅ `subscription_end` défini (30 jours dans le futur)
- ✅ Accès autorisé au dashboard professionnel
- ✅ Aucune modification d'autres tables

## 🎯 Points de Contrôle Critiques

1. **🔔 Webhook reçu** : Logs montrent la réception
2. **✅ Signature vérifiée** : Pas d'erreur de signature
3. **👤 userId extrait** : `session.metadata.userId` trouvé
4. **🔍 Profil existant** : Profil trouvé dans `pro_profiles`
5. **🔄 Mise à jour SQL** : Requête UPDATE réussie
6. **✅ Vérification** : `is_verified = true` confirmé
7. **🎉 Succès complet** : Tous les champs mis à jour

## 📝 Notes Importantes

- Le webhook supporte les deux formats : `userId` et `user_id`
- Les logs sont très détaillés pour faciliter le debugging
- La vérification post-mise à jour confirme le succès
- L'abonnement est défini pour 30 jours à partir du paiement