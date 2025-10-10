-- Configuration du bucket avatars pour les photos de profil
-- Date: 2024-01-15

-- 1. Créer le bucket avatars (à faire manuellement dans le dashboard Supabase)
-- Aller dans Storage > Buckets > Create bucket
-- Nom: avatars
-- Public: true (pour permettre la lecture publique)

-- 2. Politiques de sécurité pour le bucket avatars

-- Politique d'upload (INSERT) - Seuls les utilisateurs authentifiés peuvent uploader
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique de mise à jour (UPDATE) - Seuls les propriétaires peuvent modifier
CREATE POLICY "Users can update own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique de suppression (DELETE) - Seuls les propriétaires peuvent supprimer
CREATE POLICY "Users can delete own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique de lecture (SELECT) - Lecture publique pour que les propriétaires voient les photos
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 3. Vérifier que les politiques ont été créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatar%'
ORDER BY policyname;
