# 🔧 CORRECTION COMPLÈTE - UPLOAD PHOTO + PROFIL BIO
**Date :** 30 Septembre 2025  
**Problèmes :** RLS Storage + Colonne bio manquante

## 🎯 PROBLÈMES IDENTIFIÉS

### ❌ **Problème 1 : Upload photo de profil**
- **Erreur :** `new row violates row-level security policy`
- **Cause :** Policies RLS des buckets Supabase Storage non configurées
- **Impact :** Impossible d'uploader des photos de profil

### ❌ **Problème 2 : Sauvegarde profil**
- **Erreur :** `Could not find the 'bio' column of 'pro_profiles' in the schema cache`
- **Cause :** Colonnes manquantes dans la table `pro_profiles`
- **Impact :** Impossible de sauvegarder le profil avec le champ bio

## ✅ SOLUTION COMPLÈTE

### 📋 **ÉTAPE 1 : Exécuter le script SQL**

1. **Ouvrez le dashboard Supabase :**
   - Allez sur [supabase.com](https://supabase.com)
   - Connectez-vous à votre projet
   - Allez dans **SQL Editor**

2. **Exécutez le script :**
   - Copiez le contenu du fichier `fix-pro-profiles-and-storage.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur **Run** pour exécuter

### 📋 **ÉTAPE 2 : Vérifier l'exécution**

Le script va :

#### **🔧 Ajouter les colonnes manquantes à `pro_profiles` :**
- ✅ **`bio`** : TEXT (nullable) - Biographie du professionnel
- ✅ **`experience_years`** : INTEGER (nullable) - Années d'expérience
- ✅ **`price_range`** : TEXT (nullable) - Gamme de prix (ex: "€€€")
- ✅ **`payment_methods`** : TEXT[] (nullable) - Méthodes de paiement acceptées

#### **🔐 Configurer les policies RLS pour les buckets :**

**Bucket `avatars` :**
- ✅ **SELECT** : Lecture publique pour tous
- ✅ **INSERT** : Upload autorisé pour `auth.uid()`
- ✅ **UPDATE** : Modification autorisée pour `auth.uid()`
- ✅ **DELETE** : Suppression autorisée pour `auth.uid()`

**Bucket `proprio_photos` :**
- ✅ **SELECT** : Lecture publique pour tous
- ✅ **INSERT** : Upload autorisé pour `auth.uid()`
- ✅ **UPDATE** : Modification autorisée pour `auth.uid()`
- ✅ **DELETE** : Suppression autorisée pour `auth.uid()`

**Bucket `pro_photo` :**
- ✅ **SELECT** : Lecture publique pour tous
- ✅ **INSERT** : Upload autorisé pour `auth.uid()`
- ✅ **UPDATE** : Modification autorisée pour `auth.uid()`
- ✅ **DELETE** : Suppression autorisée pour `auth.uid()`

### 📋 **ÉTAPE 3 : Tester la correction**

Après avoir exécuté le script SQL :

```bash
# Test automatique complet
node test-complete-fix.js
```

**Résultat attendu :**
- ✅ Structure pro_profiles correcte
- ✅ Upload de photo fonctionnel
- ✅ Sauvegarde du profil fonctionnelle
- ✅ Champ bio et autres colonnes opérationnels

### 📋 **ÉTAPE 4 : Vérifier dans l'application**

1. **Rechargez votre application**
2. **Allez dans "Mon profil"**
3. **Testez l'upload de photo** → Devrait fonctionner sans erreur RLS
4. **Testez la sauvegarde du profil** → Devrait fonctionner avec le champ bio

## 🔧 DÉTAILS TECHNIQUES

### **Structure des fichiers :**
```
avatars/{user_id}/profile.jpg
proprio_photos/{user_id}/profile.jpg
pro_photo/{user_id}/profile.jpg
```

### **Nouvelles colonnes `pro_profiles` :**
```sql
bio TEXT,                    -- Biographie du professionnel
experience_years INTEGER,    -- Années d'expérience
price_range TEXT,           -- Gamme de prix (ex: "€€€")
payment_methods TEXT[]      -- Méthodes de paiement acceptées
```

### **Policies RLS Storage :**
```sql
-- Lecture publique
CREATE POLICY "Public read access for avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Upload autorisé pour l'utilisateur authentifié
CREATE POLICY "Users can upload to avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### **Utilisation dans le code :**
```javascript
// Upload d'une photo
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/profile.jpg`, file, { upsert: true })

// Mise à jour du profil avec bio
const { error } = await supabase
  .from('pro_profiles')
  .update({ 
    bio: 'Ma biographie',
    experience_years: 5,
    price_range: '€€€',
    payment_methods: ['card', 'cash']
  })
  .eq('user_id', userId)
```

## 🎯 RÉSULTAT FINAL

**Après exécution du script SQL :**

- ✅ **Upload de photo** : Fonctionne sans erreur RLS
- ✅ **Sauvegarde profil** : Fonctionne avec le champ bio
- ✅ **Sécurité** : Policies RLS configurées correctement
- ✅ **Performance** : Upload rapide et fiable
- ✅ **UX** : Interface intuitive sans erreurs

## 🚨 IMPORTANT

**Le script SQL `fix-pro-profiles-and-storage.sql` doit être exécuté dans le dashboard Supabase !**

Sans ce script :
- ❌ L'erreur RLS persistera pour l'upload de photo
- ❌ L'erreur de colonne bio persistera pour la sauvegarde

**Une fois le script exécuté, les deux problèmes seront résolus !** 🎉

## 📋 RÉCAPITULATIF DES FICHIERS

- **`fix-pro-profiles-and-storage.sql`** : Script SQL à exécuter dans Supabase
- **`test-complete-fix.js`** : Test automatique après correction
- **`COMPLETE_FIX_GUIDE.md`** : Ce guide d'instructions

**Exécutez le script SQL et testez !** 🚀
