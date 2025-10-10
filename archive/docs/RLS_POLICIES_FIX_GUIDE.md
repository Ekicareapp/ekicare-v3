# 🔐 CORRECTION DES POLICIES RLS - UPLOAD DE PHOTO
**Date :** 30 Septembre 2025  
**Problème :** "new row violates row-level security policy"

## 🎯 PROBLÈME IDENTIFIÉ

**Erreur :** `new row violates row-level security policy` lors de l'upload de photo de profil  
**Cause :** Les policies RLS des buckets Supabase Storage ne sont pas configurées  
**Impact :** Impossible d'uploader des photos de profil côté client

## ✅ SOLUTION

### 📋 **ÉTAPE 1 : Exécuter le script SQL**

1. **Ouvrez le dashboard Supabase :**
   - Allez sur [supabase.com](https://supabase.com)
   - Connectez-vous à votre projet
   - Allez dans **SQL Editor**

2. **Exécutez le script :**
   - Copiez le contenu du fichier `storage-rls-policies.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur **Run** pour exécuter

### 📋 **ÉTAPE 2 : Vérifier l'exécution**

Le script va créer les policies suivantes pour chaque bucket :

#### **Bucket `avatars` :**
- ✅ **SELECT** : Lecture publique pour tous
- ✅ **INSERT** : Upload autorisé pour `auth.uid()`
- ✅ **UPDATE** : Modification autorisée pour `auth.uid()`
- ✅ **DELETE** : Suppression autorisée pour `auth.uid()`

#### **Bucket `proprio_photos` :**
- ✅ **SELECT** : Lecture publique pour tous
- ✅ **INSERT** : Upload autorisé pour `auth.uid()`
- ✅ **UPDATE** : Modification autorisée pour `auth.uid()`
- ✅ **DELETE** : Suppression autorisée pour `auth.uid()`

#### **Bucket `pro_photo` :**
- ✅ **SELECT** : Lecture publique pour tous
- ✅ **INSERT** : Upload autorisé pour `auth.uid()`
- ✅ **UPDATE** : Modification autorisée pour `auth.uid()`
- ✅ **DELETE** : Suppression autorisée pour `auth.uid()`

### 📋 **ÉTAPE 3 : Tester l'upload**

Après avoir exécuté le script SQL :

1. **Rechargez votre application**
2. **Allez dans "Mon profil"**
3. **Essayez d'uploader une photo**
4. **L'upload devrait maintenant fonctionner !**

## 🔧 DÉTAILS TECHNIQUES

### **Structure des policies :**

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

### **Structure des fichiers :**
```
avatars/{user_id}/profile.jpg
proprio_photos/{user_id}/profile.jpg
pro_photo/{user_id}/profile.jpg
```

### **Sécurité :**
- ✅ Chaque utilisateur ne peut modifier que ses propres fichiers
- ✅ Les fichiers sont organisés par `user_id`
- ✅ La lecture est publique pour l'affichage des images
- ✅ L'isolation des données est garantie par RLS

## 🧪 VÉRIFICATION

### **Test automatique :**
```bash
node test-client-upload.js
```

### **Résultat attendu :**
- ✅ Connexion utilisateur réussie
- ✅ Upload de photo réussi
- ✅ URL publique générée
- ✅ Profil mis à jour
- ✅ Aucune erreur RLS

## 🎯 RÉSULTAT FINAL

**Après exécution du script SQL :**

- ✅ **Professionnels** : Peuvent uploader des photos de profil
- ✅ **Propriétaires** : Peuvent uploader des photos de profil
- ✅ **Sécurité** : Policies RLS configurées correctement
- ✅ **Performance** : Upload rapide et fiable
- ✅ **UX** : Interface intuitive sans erreurs

## 🚨 IMPORTANT

**Le script SQL doit être exécuté dans le dashboard Supabase pour que l'upload fonctionne !**

Sans ces policies RLS, l'erreur `new row violates row-level security policy` persistera.

**Une fois le script exécuté, l'upload de photo de profil fonctionnera parfaitement !** 🎉
