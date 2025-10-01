-- CORRECTION FINALE DES POLICIES RLS STORAGE
-- Executer ce script dans le SQL Editor du dashboard Supabase

-- 1. SUPPRIMER LES ANCIENNES POLICIES PROBLEMATIQUES
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

-- 2. CREER DE NOUVELLES POLICIES SIMPLIFIEES
-- ==========================================

-- POLICIES POUR LE BUCKET "avatars"
-- ----------------------------------

-- Policy pour la lecture (SELECT) - Lecture publique
CREATE POLICY "Allow public read access for avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy pour l'upload (INSERT) - Upload autorise pour tous les utilisateurs authentifies
CREATE POLICY "Allow authenticated users to upload to avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- Policy pour la mise a jour (UPDATE) - Modification autorisee pour tous les utilisateurs authentifies
CREATE POLICY "Allow authenticated users to update avatars" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- Policy pour la suppression (DELETE) - Suppression autorisee pour tous les utilisateurs authentifies
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

-- Policy pour l'upload (INSERT) - Upload autorise pour tous les utilisateurs authentifies
CREATE POLICY "Allow authenticated users to upload to proprio_photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'proprio_photos' AND 
  auth.role() = 'authenticated'
);

-- Policy pour la mise a jour (UPDATE) - Modification autorisee pour tous les utilisateurs authentifies
CREATE POLICY "Allow authenticated users to update proprio_photos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'proprio_photos' AND 
  auth.role() = 'authenticated'
);

-- Policy pour la suppression (DELETE) - Suppression autorisee pour tous les utilisateurs authentifies
CREATE POLICY "Allow authenticated users to delete proprio_photos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'proprio_photos' AND 
  auth.role() = 'authenticated'
);

-- 3. VERIFIER QUE RLS EST ACTIVE SUR storage.objects
-- ==================================================

-- S'assurer que RLS est active sur la table storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. VERIFICATION DES POLICIES CREEES
-- ===================================

-- Verifier que les policies ont ete creees
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
