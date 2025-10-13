# 🔒 GUIDE DE RÉACTIVATION RLS ET SÉCURISATION DES DONNÉES

## 📋 Vue d'ensemble

Ce guide vous accompagne dans la réactivation de la Row Level Security (RLS) sur Supabase et la mise en place de toutes les policies de sécurité nécessaires pour Ekicare.

---

## ⚠️ IMPORTANT : Avant de commencer

### État actuel détecté
- La table `appointments` a probablement RLS **désactivé** (mode Unrestricted)
- Les tables `pro_profiles` et `proprio_profiles` peuvent avoir RLS activé mais avec des policies incomplètes
- **RISQUE** : Les données sont potentiellement accessibles publiquement

### Ce qui va être corrigé
1. ✅ Réactivation de RLS sur `appointments`
2. ✅ Vérification et correction de RLS sur `pro_profiles` et `proprio_profiles`
3. ✅ Mise en place de policies strictes et sécurisées
4. ✅ Suppression de tout accès public non autorisé

---

## 🚀 ÉTAPE 1 : Exécuter le script SQL

### Option A : Via l'interface Supabase (RECOMMANDÉ)

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Cliquez sur **New Query**
4. Copiez-collez le contenu du fichier `reactivate-rls-and-policies.sql`
5. Cliquez sur **Run** (ou appuyez sur `Cmd+Enter` / `Ctrl+Enter`)
6. Vérifiez qu'il n'y a **aucune erreur** dans les résultats

### Option B : Via l'API Supabase (si vous préférez)

```bash
# Depuis le terminal, dans le dossier du projet
# (nécessite d'avoir configuré vos variables d'environnement)
psql $DATABASE_URL -f reactivate-rls-and-policies.sql
```

---

## 🔍 ÉTAPE 2 : Vérifier que RLS est activé

### Dans Supabase UI

1. Allez dans **Table Editor**
2. Sélectionnez la table `appointments`
3. Cliquez sur l'icône **RLS** (en haut à droite)
4. **Vérifiez** que RLS est **enabled** (icône avec un cadenas fermé)
5. Répétez pour `pro_profiles` et `proprio_profiles`

### Via SQL Editor

Exécutez cette requête pour vérifier l'état de RLS :

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles');
```

**Résultat attendu** :
```
schemaname | tablename        | rowsecurity
-----------+------------------+------------
public     | appointments     | true
public     | pro_profiles     | true
public     | proprio_profiles | true
```

---

## 🛡️ ÉTAPE 3 : Vérifier les policies

Exécutez cette requête pour lister toutes les policies :

```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles')
ORDER BY tablename, policyname;
```

**Résultat attendu** :

### Pour `appointments` (7 policies)
- ✅ `Proprios can create appointments` (INSERT)
- ✅ `Proprios can view their appointments` (SELECT)
- ✅ `Pros can view their appointments` (SELECT)
- ✅ `Proprios can update their appointments` (UPDATE)
- ✅ `Pros can update their appointments` (UPDATE)
- ✅ `Proprios can delete their appointments` (DELETE)
- ✅ `Pros can delete their appointments` (DELETE)

### Pour `pro_profiles` (3 policies)
- ✅ `Pros can view their own profile` (SELECT)
- ✅ `Pros can update their own profile` (UPDATE)
- ✅ `Proprios can view verified and subscribed pros` (SELECT)

### Pour `proprio_profiles` (3 policies)
- ✅ `Proprios can view their own profile` (SELECT)
- ✅ `Proprios can update their own profile` (UPDATE)
- ✅ `Pros can view proprio profiles for their appointments` (SELECT)

---

## 🧪 ÉTAPE 4 : Tester la sécurité

### Test 1 : Accès non authentifié (doit échouer)

Essayez de lire la table `appointments` sans être connecté :

```sql
-- Dans une nouvelle fenêtre SQL Editor en mode "anon"
SELECT * FROM appointments;
```

**Résultat attendu** : `0 rows` ou erreur de permission

### Test 2 : Accès en tant que propriétaire

1. Connectez-vous avec un compte **propriétaire**
2. Essayez de créer un rendez-vous via l'application
3. **Résultat attendu** : ✅ Succès

### Test 3 : Accès en tant que professionnel

1. Connectez-vous avec un compte **professionnel**
2. Allez dans **Mes rendez-vous**
3. **Résultat attendu** : ✅ Vous voyez uniquement vos rendez-vous

### Test 4 : Tentative d'accès aux données d'un autre utilisateur

Essayez de modifier un rendez-vous qui ne vous appartient pas :

```sql
-- Remplacez <autre_rdv_id> par un ID de rendez-vous qui n'est pas le vôtre
UPDATE appointments
SET status = 'completed'
WHERE id = '<autre_rdv_id>';
```

**Résultat attendu** : ❌ Erreur ou 0 rows affected

---

## ✅ ÉTAPE 5 : Vérification finale

### Checklist de sécurité

- [ ] RLS est **activé** sur `appointments`
- [ ] RLS est **activé** sur `pro_profiles`
- [ ] RLS est **activé** sur `proprio_profiles`
- [ ] Toutes les policies sont **présentes** (13 au total)
- [ ] Les propriétaires peuvent **créer** des rendez-vous
- [ ] Les propriétaires peuvent **voir uniquement** leurs rendez-vous
- [ ] Les pros peuvent **voir uniquement** leurs rendez-vous
- [ ] Les pros peuvent **voir** les profils des proprios avec qui ils ont des RDV
- [ ] Les proprios peuvent **voir** les pros vérifiés et abonnés
- [ ] Aucun accès public non autorisé

---

## 📊 IMPACT SUR L'APPLICATION

### Ce qui continuera de fonctionner normalement

✅ Création de rendez-vous par les propriétaires
✅ Affichage des rendez-vous dans "Mes rendez-vous" (proprio et pro)
✅ Recherche de professionnels par les propriétaires
✅ Modification et annulation de rendez-vous
✅ Visualisation des profils

### Ce qui sera bloqué (NORMAL)

❌ Accès aux rendez-vous d'autres utilisateurs
❌ Modification des rendez-vous d'autres utilisateurs
❌ Accès public aux données sensibles
❌ Création de rendez-vous par des utilisateurs non authentifiés

---

## 🔧 EN CAS DE PROBLÈME

### Problème : L'application ne peut plus créer de rendez-vous

**Cause probable** : Les API routes utilisent le client Supabase avec la clé ANON au lieu de la clé SERVICE_ROLE

**Solution** : Vérifiez que les API routes (`/app/api/appointments/route.ts`) utilisent bien `supabaseAdmin` (avec SERVICE_ROLE) pour contourner RLS lors des opérations serveur.

```typescript
// ✅ BON
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ❌ MAUVAIS pour les opérations serveur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Problème : Les pros ne voient pas les profils des propriétaires

**Cause probable** : La policy `Pros can view proprio profiles for their appointments` n'est pas appliquée correctement

**Solution** : Vérifiez que le pro a bien des rendez-vous avec le propriétaire en question :

```sql
SELECT * FROM appointments
WHERE pro_id IN (SELECT id FROM pro_profiles WHERE user_id = '<votre_user_id>')
AND proprio_id = '<proprio_id>';
```

### Problème : Les propriétaires ne peuvent pas voir les pros

**Cause probable** : Les pros ne sont pas `is_verified = true` et `is_subscribed = true`

**Solution** : Vérifiez les flags du profil pro :

```sql
SELECT id, prenom, nom, is_verified, is_subscribed
FROM pro_profiles
WHERE user_id = '<pro_user_id>';
```

---

## 🔐 SÉCURITÉ RENFORCÉE

### Ce que fait ce script

1. **Isole les données** : Chaque utilisateur ne voit que ses propres données
2. **Vérifie les rôles** : Les policies vérifient le rôle de l'utilisateur (PRO vs PROPRIETAIRE)
3. **Empêche les accès croisés** : Un propriétaire ne peut pas voir/modifier les données d'un pro et vice-versa (sauf pour les rendez-vous en commun)
4. **Bloque l'accès public** : Aucune donnée n'est accessible sans authentification

### Bonnes pratiques

- ✅ Toujours utiliser `supabaseAdmin` (service role) dans les API routes
- ✅ Toujours vérifier `auth.uid()` dans les policies
- ✅ Toujours vérifier le rôle de l'utilisateur (`users.role`)
- ✅ Toujours tester les policies avant de déployer en production

---

## 📞 SUPPORT

Si vous rencontrez des problèmes après l'exécution de ce script :

1. Vérifiez les logs de Supabase (Dashboard > Logs)
2. Vérifiez les erreurs dans la console du navigateur
3. Testez les requêtes SQL manuellement dans le SQL Editor
4. Vérifiez que les variables d'environnement sont correctement configurées

---

**Date de création** : 7 octobre 2025  
**Version** : 1.0  
**Auteur** : Ekicare Team










