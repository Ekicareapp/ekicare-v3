-- 🔐 POLICIES RLS POUR SUPABASE STORAGE
-- Exécuter ce script dans le SQL Editor du dashboard Supabase

-- 1. POLICIES POUR LE BUCKET "avatars"
-- ====================================

-- Policy pour la lecture (SELECT) - Lecture publique
CREATE POLICY IF NOT EXISTS "Public read access for avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy pour l'upload (INSERT) - Upload autorisé pour l'utilisateur authentifié
CREATE POLICY IF NOT EXISTS "Users can upload to avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la mise à jour (UPDATE) - Modification autorisée pour l'utilisateur
CREATE POLICY IF NOT EXISTS "Users can update in avatars" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la suppression (DELETE) - Suppression autorisée pour l'utilisateur
CREATE POLICY IF NOT EXISTS "Users can delete from avatars" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. POLICIES POUR LE BUCKET "proprio_photos"
-- ===========================================

-- Policy pour la lecture (SELECT) - Lecture publique
CREATE POLICY IF NOT EXISTS "Public read access for proprio_photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'proprio_photos');

-- Policy pour l'upload (INSERT) - Upload autorisé pour l'utilisateur authentifié
CREATE POLICY IF NOT EXISTS "Users can upload to proprio_photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'proprio_photos' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la mise à jour (UPDATE) - Modification autorisée pour l'utilisateur
CREATE POLICY IF NOT EXISTS "Users can update in proprio_photos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'proprio_photos' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la suppression (DELETE) - Suppression autorisée pour l'utilisateur
CREATE POLICY IF NOT EXISTS "Users can delete from proprio_photos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'proprio_photos' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. POLICIES POUR LE BUCKET "pro_photo"
-- ======================================

-- Policy pour la lecture (SELECT) - Lecture publique
CREATE POLICY IF NOT EXISTS "Public read access for pro_photo" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pro_photo');

-- Policy pour l'upload (INSERT) - Upload autorisé pour l'utilisateur authentifié
CREATE POLICY IF NOT EXISTS "Users can upload to pro_photo" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'pro_photo' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la mise à jour (UPDATE) - Modification autorisée pour l'utilisateur
CREATE POLICY IF NOT EXISTS "Users can update in pro_photo" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'pro_photo' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la suppression (DELETE) - Suppression autorisée pour l'utilisateur
CREATE POLICY IF NOT EXISTS "Users can delete from pro_photo" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'pro_photo' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. VÉRIFICATION DES POLICIES CRÉÉES
-- ===================================

-- Vérifier que les policies ont été créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%avatar%' 
   OR policyname LIKE '%proprio%' 
   OR policyname LIKE '%pro_photo%'
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

Pour les photos de professionnels (bucket "pro_photo"):
- Chemin: pro_photo/{user_id}/profile.jpg
- Exemple: pro_photo/123e4567-e89b-12d3-a456-426614174000/profile.jpg

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
- Chaque utilisateur ne peut uploader/modifier/supprimer que ses propres fichiers
- Les fichiers sont organisés par user_id dans des dossiers séparés
- La lecture est publique pour l'affichage des images
- Les policies RLS garantissent l'isolation des données
*/
