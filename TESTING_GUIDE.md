# 🧪 Guide de Test - Logique d'Authentification Ekicare

Ce guide vous explique comment tester la logique d'authentification complète de votre application Ekicare.

## 📋 Prérequis

1. **Serveur démarré** : `npm run dev`
2. **Base de données configurée** : Supabase avec les migrations appliquées
3. **Variables d'environnement** : Configurées dans `.env.local`

## 🚀 Tests Disponibles

### 1. Test Simple du Serveur

```bash
node test-server.js
```

**Ce que ça teste :**
- ✅ Connectivité du serveur
- ✅ Accessibilité des pages principales
- ✅ Réponse des endpoints API

### 2. Test Complet de l'Authentification

```bash
node test-auth-flow.js
```

**Ce que ça teste :**
- ✅ Signup propriétaire → Dashboard
- ✅ Signup professionnel → Stripe
- ✅ Login avec différents rôles
- ✅ Redirections correctes
- ✅ Vérification des profils

### 3. Test avec Postman

1. **Importer la collection** : `Ekicare-Auth-Test-Collection.postman_collection.json`
2. **Exécuter la collection** : Tous les tests s'exécutent automatiquement
3. **Vérifier les résultats** : Chaque test a des assertions

**Tests inclus :**
- Signup propriétaire
- Signup professionnel
- Login propriétaire
- Login professionnel (non vérifié)
- Checkout session Stripe
- Logout
- Pages d'erreur
- Endpoints API

### 4. Test de la Base de Données

```sql
-- Exécuter dans Supabase SQL Editor
\i test-database-structure.sql
```

**Ce que ça teste :**
- ✅ Structure des tables
- ✅ RLS policies
- ✅ Contraintes de clés étrangères
- ✅ Index de performance
- ✅ Triggers
- ✅ Données de test

## 🔍 Tests Manuels Recommandés

### Test 1: Inscription Propriétaire
1. Aller sur `http://localhost:3000/signup`
2. Sélectionner "Propriétaire"
3. Remplir le formulaire
4. **Résultat attendu** : Redirection vers `/dashboard/proprietaire`

### Test 2: Inscription Professionnel
1. Aller sur `http://localhost:3000/signup`
2. Sélectionner "Professionnel"
3. Remplir le formulaire complet
4. **Résultat attendu** : Redirection vers Stripe Checkout

### Test 3: Connexion Propriétaire
1. Aller sur `http://localhost:3000/login`
2. Se connecter avec un compte propriétaire
3. **Résultat attendu** : Redirection vers `/dashboard/proprietaire`

### Test 4: Connexion Professionnel Non Vérifié
1. Aller sur `http://localhost:3000/login`
2. Se connecter avec un compte pro non vérifié
3. **Résultat attendu** : Redirection vers `/paiement-requis`

### Test 5: Connexion Professionnel Vérifié
1. Se connecter avec un compte pro vérifié
2. **Résultat attendu** : Redirection vers `/dashboard/pro`

## 🐛 Dépannage

### Erreur "Serveur non accessible"
```bash
# Vérifier que le serveur est démarré
npm run dev

# Vérifier le port
lsof -i :3000
```

### Erreur "Supabase client not initialized"
```bash
# Vérifier les variables d'environnement
cat .env.local

# Variables requises :
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# STRIPE_SECRET_KEY
# STRIPE_PRICE_ID
```

### Erreur "Database connection error"
```bash
# Vérifier la connexion Supabase
# Tester dans Supabase Dashboard > SQL Editor
SELECT * FROM users LIMIT 1;
```

### Erreur "Stripe configuration missing"
```bash
# Vérifier les variables Stripe
echo $STRIPE_SECRET_KEY
echo $STRIPE_PRICE_ID
```

## 📊 Interprétation des Résultats

### Test Réussi ✅
- Tous les endpoints répondent correctement
- Les redirections fonctionnent
- Les profils sont créés en base
- Les RLS policies sont actives

### Test Échoué ❌
- Vérifier les logs du serveur
- Vérifier la configuration Supabase
- Vérifier les variables d'environnement
- Vérifier que les migrations sont appliquées

## 🔧 Configuration de Test

### Variables d'Environnement de Test
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Maps (pour les tests de signup)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Données de Test
Les scripts créent automatiquement des données de test avec des emails uniques :
- `test-proprio-{timestamp}@ekicare.com`
- `test-pro-{timestamp}@ekicare.com`

## 📈 Métriques de Performance

### Temps de Réponse Attendus
- **Signup** : < 2 secondes
- **Login** : < 1 seconde
- **Redirection** : < 500ms
- **Chargement page** : < 1 seconde

### Tests de Charge
```bash
# Test simple de charge
for i in {1..10}; do
  node test-auth-flow.js &
done
wait
```

## 🎯 Objectifs de Test

### Fonctionnalités Critiques
- ✅ Inscription propriétaire → Dashboard
- ✅ Inscription pro → Stripe → Dashboard
- ✅ Login avec redirection correcte
- ✅ AuthGuard fonctionnel
- ✅ RLS policies actives

### Sécurité
- ✅ Pas de bypass d'authentification
- ✅ Isolation des données
- ✅ Validation des rôles
- ✅ Protection des endpoints

### Performance
- ✅ Temps de réponse acceptables
- ✅ Pas de fuites mémoire
- ✅ Gestion d'erreurs robuste

## 📝 Rapport de Test

Après avoir exécuté tous les tests, vous devriez avoir :

1. **Résultats des tests automatiques** (scripts Node.js)
2. **Résultats des tests Postman** (collection)
3. **Vérification de la base de données** (script SQL)
4. **Tests manuels** (navigateur)

Tous les tests doivent passer pour considérer que la logique d'authentification est fonctionnelle.

## 🚀 Prochaines Étapes

Une fois tous les tests passés :

1. **Déployer en production** avec les mêmes tests
2. **Configurer la surveillance** des performances
3. **Mettre en place les sauvegardes** automatiques
4. **Documenter les procédures** de maintenance

---

**🎉 Félicitations ! Votre logique d'authentification Ekicare est maintenant testée et fonctionnelle !**
