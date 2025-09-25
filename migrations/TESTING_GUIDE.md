# Guide de test - Upload de photos de profil

## 🎯 Objectif
Vérifier que le bouton "Changer la photo" fonctionne réellement et que l'upload vers Supabase Storage fonctionne.

## 📋 Tests à effectuer

### 1. Test du bouton "Changer la photo"

#### Prérequis
- Être connecté en tant que professionnel
- Aller sur la page "Mon profil"
- Cliquer sur "Modifier"

#### Étapes
1. **Cliquer sur "Changer la photo"**
   - ✅ La fenêtre de sélection de fichier s'ouvre
   - ✅ Seuls les fichiers image sont acceptés

2. **Sélectionner une image JPG/PNG**
   - ✅ L'upload commence automatiquement
   - ✅ Un spinner "Upload en cours..." s'affiche
   - ✅ L'image apparaît immédiatement après l'upload

3. **Vérifier l'upload**
   - ✅ L'image est stockée dans Supabase Storage
   - ✅ L'URL est sauvegardée dans `pro_profiles.photo_url`
   - ✅ L'aperçu s'affiche sur la page

### 2. Test de remplacement d'image

#### Étapes
1. **Avec une image déjà uploadée**
   - ✅ Le bouton affiche "Remplacer la photo"
   - ✅ Cliquer ouvre la fenêtre de sélection

2. **Sélectionner une nouvelle image**
   - ✅ L'ancienne image est remplacée
   - ✅ La nouvelle image s'affiche immédiatement
   - ✅ L'URL en base est mise à jour

### 3. Test de suppression d'image

#### Étapes
1. **Avec une image uploadée**
   - ✅ Le bouton "Supprimer" est visible
   - ✅ Cliquer supprime l'image

2. **Vérifier la suppression**
   - ✅ L'aperçu disparaît
   - ✅ Le fichier est supprimé du Storage
   - ✅ `photo_url = NULL` en base

### 4. Test de chargement d'image existante

#### Étapes
1. **Recharger la page**
   - ✅ Si une image existe, elle s'affiche au chargement
   - ✅ L'URL est récupérée depuis `photo_url`

### 5. Test de gestion d'erreurs

#### Tests d'erreurs
1. **Fichier trop volumineux (>5MB)**
   - ✅ Message d'erreur affiché
   - ✅ Upload bloqué

2. **Format non supporté**
   - ✅ Message d'erreur affiché
   - ✅ Upload bloqué

3. **Erreur réseau**
   - ✅ Message d'erreur affiché
   - ✅ État restauré

## 🔍 Vérifications techniques

### 1. Vérifier la base de données
```sql
-- Vérifier que la colonne photo_url existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pro_profiles' AND column_name = 'photo_url';

-- Vérifier les URLs de photos
SELECT user_id, prenom, nom, photo_url 
FROM pro_profiles 
WHERE photo_url IS NOT NULL;
```

### 2. Vérifier Supabase Storage
```sql
-- Vérifier que le bucket avatars existe
SELECT name, public 
FROM storage.buckets 
WHERE name = 'avatars';

-- Vérifier les fichiers uploadés
SELECT name, bucket_id, created_at 
FROM storage.objects 
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC;
```

### 3. Vérifier les politiques de sécurité
```sql
-- Vérifier les politiques RLS
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatar%';
```

## 🚨 Dépannage

### Problème: "Changer la photo" ne fait rien
- ✅ Vérifier que `fileInputRef` est correctement connecté
- ✅ Vérifier que `handlePhotoButtonClick` est appelé
- ✅ Vérifier que l'input file est caché mais accessible

### Problème: Upload échoue
- ✅ Vérifier que le bucket `avatars` existe
- ✅ Vérifier les politiques de sécurité
- ✅ Vérifier la connexion Supabase

### Problème: Image ne s'affiche pas
- ✅ Vérifier que `photoPreview` est mis à jour
- ✅ Vérifier que l'URL est valide
- ✅ Vérifier que le bucket est public

### Problème: Suppression ne fonctionne pas
- ✅ Vérifier que `handleRemovePhoto` est appelé
- ✅ Vérifier les permissions de suppression
- ✅ Vérifier que `photo_url` est mis à NULL

## ✅ Résultat attendu

Après tous les tests, le professionnel doit pouvoir :
- ✅ Cliquer sur "Changer la photo" → fenêtre de sélection s'ouvre
- ✅ Sélectionner une image → upload automatique
- ✅ Voir l'image immédiatement → preview instantané
- ✅ Remplacer l'image → nouvelle image s'affiche
- ✅ Supprimer l'image → aperçu disparaît
- ✅ Recharger la page → image existante s'affiche

L'image doit être stockée dans Supabase Storage et l'URL dans `pro_profiles.photo_url` ! 🎉
