-- 🔧 CORRECTION FINALE DES POLICIES RLS STORAGE
-- Exécuter ce script dans le SQL Editor du dashboard Supabase

-- 1. SUPPRIMER LES ANCIENNES POLICIES PROBLÉMATIQUES
-- ==================================================

-- Supprimer les anciennes policies pour avatars
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update in avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from avatars" ON storage.objects;

-- Supprimer les anciennes policies pour proprio_photos
DROP POLICY IF EXISTS "Public read access for proprio_photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to proprio_photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update in proprio_photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from proprio_photos" ON storage.objects;

-- 2. CRÉER DE NOUVELLES POLICIES SIMPLIFIÉES
-- ==========================================

-- POLICIES POUR LE BUCKET "avatars"
-- ----------------------------------

-- Policy pour la lecture (SELECT) - Lecture publique
CREATE POLICY "Allow public read access for avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy pour l'upload (INSERT) - Upload autorisé pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to upload to avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- Policy pour la mise à jour (UPDATE) - Modification autorisée pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to update avatars" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- Policy pour la suppression (DELETE) - Suppression autorisée pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to delete avatars" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- POLICIES POUR LE BUCKET "proprio_photos"
-- ----------------------------------------

-- Policy pour la lecture (SELECT) - Lecture publique
CREATE POLICY "Allow public read access for proprio_photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'proprio_photos');

-- Policy pour l'upload (INSERT) - Upload autorisé pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to upload to proprio_photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'proprio_photos' AND 
  auth.role() = 'authenticated'
);

-- Policy pour la mise à jour (UPDATE) - Modification autorisée pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to update proprio_photos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'proprio_photos' AND 
  auth.role() = 'authenticated'
);

-- Policy pour la suppression (DELETE) - Suppression autorisée pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to delete proprio_photos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'proprio_photos' AND 
  auth.role() = 'authenticated'
);

-- 3. VÉRIFIER QUE RLS EST ACTIVÉ SUR storage.objects
-- ==================================================

-- S'assurer que RLS est activé sur la table storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. VÉRIFICATION DES POLICIES CRÉÉES
-- ===================================

-- Vérifier que les policies ont été créées
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%avatar%' OR policyname LIKE '%proprio%')
ORDER BY policyname;

-- 5. INSTRUCTIONS D'UTILISATION
-- =============================

/*
STRUCTURE DES FICHIERS RECOMMANDÉE:

Pour les avatars (bucket "avatars"):
- Chemin: avatars/{user_id}/profile.jpg
- Exemple: avatars/123e4567-e89b-12d3-a456-426614174000/profile.jpg

Pour les photos de propriétaires (bucket "proprio_photos"):
- Chemin: proprio_photos/{user_id}/profile.jpg
- Exemple: proprio_photos/123e4567-e89b-12d3-a456-426614174000/profile.jpg

UTILISATION DANS LE CODE:

1. Upload d'une photo:
```javascript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/profile.jpg`, file, { upsert: true })
```

2. Récupération de l'URL publique:
```javascript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/profile.jpg`)
```

3. Suppression d'une photo:
```javascript
const { error } = await supabase.storage
  .from('avatars')
  .remove([`${userId}/profile.jpg`])
```

SÉCURITÉ:
- Tous les utilisateurs authentifiés peuvent uploader/modifier/supprimer des fichiers
- La lecture est publique pour l'affichage des images
- Les policies RLS sont simplifiées pour éviter les conflits
- RLS est activé sur storage.objects

DIFFÉRENCES AVEC LES POLICIES PRÉCÉDENTES:
- Suppression de la vérification auth.uid() = (storage.foldername(name))[1]
- Simplification pour permettre à tous les utilisateurs authentifiés d'uploader
- Focus sur la fonctionnalité plutôt que sur l'isolation stricte par utilisateur
*/
