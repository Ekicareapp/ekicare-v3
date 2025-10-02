# 🗓️ Guide de Mise en Place de la Table Appointments

## 📋 Résumé

Ce guide vous explique comment mettre en place la table `appointments` de manière sécurisée, sans perdre de données existantes et en respectant toutes les bonnes pratiques.

## ⚠️ Points d'Attention Identifiés

### 1. **Pas de DROP TABLE**
- ✅ Le script ne supprime PAS la table existante
- ✅ Il vérifie d'abord la structure actuelle
- ✅ Il applique seulement les modifications nécessaires

### 2. **Clés Étrangères Sécurisées**
- ✅ Vérification que `pro_profiles.user_id` et `proprio_profiles.user_id` sont des clés primaires
- ✅ Contraintes FK ajoutées seulement si elles n'existent pas déjà
- ✅ Pas de risque de plantage

### 3. **Gestion des Équidés**
- ✅ Utilisation d'`UUID[]` pour `equide_ids` (compatible avec la structure existante)
- ✅ Index GIN pour les recherches efficaces
- ✅ Pas de table pivot nécessaire pour l'instant

### 4. **Politiques RLS Affinées**
- ✅ **PRO** peut modifier : `status`, `compte_rendu`, `compte_rendu_updated_at`
- ✅ **PROPRIO** peut modifier : `comment`, `main_slot`, `alternative_slots` (pour replanification)
- ✅ Pas de conflits entre les rôles
- ✅ Sécurité renforcée

## 🚀 Étapes d'Exécution

### Étape 1 : Sauvegarde (Recommandé)
```bash
# Dans Supabase Dashboard
# 1. Allez dans Settings > Database
# 2. Cliquez sur "Backup" 
# 3. Téléchargez la sauvegarde complète
```

### Étape 2 : Exécution du Script SQL
1. **Ouvrez Supabase Dashboard**
2. **Allez dans "SQL Editor"**
3. **Copiez-collez le contenu de `fix-appointments-table-secure.sql`**
4. **Cliquez sur "Run"**

### Étape 3 : Vérification
```bash
# Dans votre terminal
node test-appointments-final.js
```

## 📊 Ce que fait le Script

### Vérifications Préliminaires
- ✅ Existence de la table `appointments`
- ✅ Structure actuelle des colonnes
- ✅ Vérification des clés primaires dans `pro_profiles` et `proprio_profiles`
- ✅ Existence des contraintes FK

### Modifications Appliquées
- ✅ Création de la table si elle n'existe pas
- ✅ Ajout des contraintes FK si elles n'existent pas
- ✅ Création des index pour les performances
- ✅ Activation de RLS si ce n'est pas déjà fait
- ✅ Création des politiques RLS sécurisées
- ✅ Création du trigger pour `updated_at`

### Structure Finale de la Table
```sql
appointments (
    id UUID PRIMARY KEY,
    pro_id UUID NOT NULL REFERENCES pro_profiles(user_id),
    proprio_id UUID NOT NULL REFERENCES proprio_profiles(user_id),
    equide_ids UUID[] NOT NULL DEFAULT '{}',
    main_slot TIMESTAMPTZ NOT NULL,
    alternative_slots TIMESTAMPTZ[] DEFAULT '{}',
    duration_minutes INTEGER DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (...),
    comment TEXT NOT NULL,
    compte_rendu TEXT,
    compte_rendu_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

## 🔒 Politiques RLS Détaillées

### Lecture (SELECT)
- **PRO** : voit ses rendez-vous (`pro_id = auth.uid()`)
- **PROPRIO** : voit ses rendez-vous (`proprio_id = auth.uid()`)

### Création (INSERT)
- **PROPRIO** : peut créer des rendez-vous (`proprio_id = auth.uid()`)

### Mise à Jour (UPDATE)
- **PRO** : peut modifier `status` et `compte_rendu` seulement
- **PROPRIO** : peut modifier `comment`, `main_slot`, `alternative_slots` dans certains statuts

## 🧪 Tests de Validation

Le script `test-appointments-final.js` vérifie :

1. ✅ **Structure de la table** accessible
2. ✅ **Utilisateurs existants** (PRO et PROPRIETAIRE)
3. ✅ **Équidés disponibles** pour le propriétaire
4. ✅ **Création d'un rendez-vous** avec toutes les données
5. ✅ **Récupération du rendez-vous** avec jointures
6. ✅ **Mise à jour du statut** (simulation pro qui accepte)
7. ✅ **Ajout d'un compte-rendu** (simulation après consultation)
8. ✅ **Vues par rôle** (propriétaire et pro)
9. ✅ **Nettoyage** du rendez-vous de test

## 📈 Index Créés

- `idx_appointments_pro_id` : Recherches par professionnel
- `idx_appointments_proprio_id` : Recherches par propriétaire
- `idx_appointments_status` : Filtrage par statut
- `idx_appointments_main_slot` : Tri par date
- `idx_appointments_created_at` : Tri par création
- `idx_appointments_equide_ids` : Recherches dans les équidés (GIN)

## 🎯 Résultat Attendu

Après exécution, vous devriez voir :

```
✅ Table appointments prête à l'utilisation !
🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !
✅ Le système de rendez-vous est opérationnel
```

## 🚨 En Cas de Problème

### Si le script échoue :
1. Vérifiez les logs dans Supabase SQL Editor
2. Assurez-vous que les tables `pro_profiles` et `proprio_profiles` existent
3. Vérifiez que `user_id` est bien une clé primaire dans ces tables

### Si les tests échouent :
1. Vérifiez qu'il y a des utilisateurs PRO et PROPRIETAIRE
2. Vérifiez qu'il y a des équidés pour au moins un propriétaire
3. Vérifiez les permissions RLS

## 📞 Support

Si vous rencontrez des problèmes :
1. Copiez les messages d'erreur exacts
2. Vérifiez la structure des tables existantes
3. Testez avec le script de vérification

---

**🎉 Une fois terminé, votre système de rendez-vous sera 100% opérationnel !**
