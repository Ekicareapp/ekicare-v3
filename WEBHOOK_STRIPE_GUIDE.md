# 🔔 Configuration Webhook Stripe - Production

## 🎯 Objectif
Configurer le webhook Stripe pour mettre à jour automatiquement `is_verified` et `is_subscribed` dans Supabase après un paiement réussi.

## 🚀 Déploiement

### 1. Déployer le code
```bash
git add .
git commit -m "Webhook: Configuration Stripe propre et sécurisée"
git push origin main
```

### 2. Variables d'environnement Vercel
Vérifier que ces variables sont présentes sur Vercel :
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET` (à configurer après création du webhook)
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

## 🔧 Configuration Stripe Dashboard

### 1. Créer le webhook
1. Aller sur **Stripe Dashboard** → **Développeurs** → **Webhooks**
2. Cliquer sur **"Ajouter un endpoint"**
3. **URL de l'endpoint** : `https://ekicare-v3.vercel.app/api/webhooks/stripe`
4. **Événements à écouter** : `checkout.session.completed`
5. Cliquer sur **"Ajouter un endpoint"**

### 2. Récupérer le secret
1. Cliquer sur le webhook créé
2. Dans la section **"Signature du webhook"**
3. Copier la **"Clé secrète du webhook"** (commence par `whsec_`)
4. Ajouter cette clé comme `STRIPE_WEBHOOK_SECRET` sur Vercel

## 🧪 Tests

### Test 1 : Via Stripe CLI (recommandé)
```bash
# Installer Stripe CLI
# https://stripe.com/docs/stripe-cli

# Écouter les webhooks
stripe listen --forward-to https://ekicare-v3.vercel.app/api/webhooks/stripe

# Dans un autre terminal, déclencher un événement
stripe trigger checkout.session.completed
```

### Test 2 : Via Dashboard Stripe
1. Aller sur **Événements** dans le webhook
2. Cliquer sur **"Envoyer un événement de test"**
3. Sélectionner `checkout.session.completed`
4. Envoyer

### Test 3 : Paiement réel
1. Créer un compte pro
2. Effectuer un paiement avec carte test : `4242 4242 4242 4242`
3. Vérifier les logs Vercel

## 📊 Vérification

### Logs Vercel
1. Aller sur **Vercel Dashboard** → **Functions** → **Logs**
2. Filtrer par `/api/webhooks/stripe`
3. Vérifier les logs :
```
🔔 [WEBHOOK] === DÉBUT WEBHOOK STRIPE ===
✅ [WEBHOOK] Signature vérifiée - Événement: checkout.session.completed
✅ [WEBHOOK] Profil mis à jour avec succès
```

### Base de données
Vérifier dans Supabase que les champs sont mis à jour :
```sql
SELECT user_id, is_verified, is_subscribed, updated_at 
FROM pro_profiles 
WHERE is_verified = true AND is_subscribed = true
ORDER BY updated_at DESC;
```

## 🔍 Dépannage

### Problème : Signature invalide
- ✅ Vérifier `STRIPE_WEBHOOK_SECRET` sur Vercel
- ✅ Vérifier l'URL du webhook dans Stripe Dashboard
- ✅ Vérifier que le webhook écoute `checkout.session.completed`

### Problème : Profil non trouvé
- ✅ Vérifier `client_reference_id` dans la session Stripe
- ✅ Vérifier que l'utilisateur existe dans `pro_profiles`

### Problème : Erreur Supabase
- ✅ Vérifier `SUPABASE_SERVICE_ROLE_KEY` sur Vercel
- ✅ Vérifier les permissions de la clé service

## 🎯 Résultat attendu

Après un paiement réussi :
1. ✅ Webhook reçu par `/api/webhooks/stripe`
2. ✅ Signature vérifiée
3. ✅ `is_verified = true` et `is_subscribed = true` dans Supabase
4. ✅ Redirection vers dashboard pro
5. ✅ Logs détaillés dans Vercel

## 📞 Support

Si le webhook ne fonctionne toujours pas :
1. Vérifier tous les logs Vercel
2. Tester avec Stripe CLI
3. Vérifier la configuration Stripe Dashboard
4. Contacter le support si nécessaire
