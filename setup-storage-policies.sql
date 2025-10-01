-- 🔐 CONFIGURATION DES POLICIES RLS POUR SUPABASE STORAGE
-- Ce script configure les policies pour les buckets de photos de profil

-- 1. POLICIES POUR LE BUCKET "avatars" (photos de profil générales)
-- ================================================================

-- Policy pour la lecture (SELECT) - Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Policy pour l'upload (INSERT) - Les utilisateurs peuvent uploader leurs propres fichiers
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la mise à jour (UPDATE) - Les utilisateurs peuvent modifier leurs propres fichiers
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la suppression (DELETE) - Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. POLICIES POUR LE BUCKET "proprio_photos" (photos de propriétaires)
-- =====================================================================

-- Policy pour la lecture (SELECT) - Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Public read access for proprio_photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'proprio_photos' AND
  auth.role() = 'authenticated'
);

-- Policy pour l'upload (INSERT) - Les utilisateurs peuvent uploader leurs propres fichiers
CREATE POLICY "Users can upload their own proprio_photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'proprio_photos' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la mise à jour (UPDATE) - Les utilisateurs peuvent modifier leurs propres fichiers
CREATE POLICY "Users can update their own proprio_photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'proprio_photos' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la suppression (DELETE) - Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own proprio_photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'proprio_photos' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. POLICIES POUR LE BUCKET "pro_photo" (photos de professionnels)
-- =================================================================

-- Policy pour la lecture (SELECT) - Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Public read access for pro_photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'pro_photo' AND
  auth.role() = 'authenticated'
);

-- Policy pour l'upload (INSERT) - Les utilisateurs peuvent uploader leurs propres fichiers
CREATE POLICY "Users can upload their own pro_photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'pro_photo' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la mise à jour (UPDATE) - Les utilisateurs peuvent modifier leurs propres fichiers
CREATE POLICY "Users can update their own pro_photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'pro_photo' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour la suppression (DELETE) - Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own pro_photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'pro_photo' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. VÉRIFICATION DES POLICIES
-- ============================

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
*/
