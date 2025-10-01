-- 🔧 CORRECTION COMPLÈTE : pro_profiles + Storage RLS
-- Exécuter ce script dans le SQL Editor du dashboard Supabase

-- 1. AJOUT DES COLONNES MANQUANTES À pro_profiles
-- ===============================================

-- Ajouter la colonne bio
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Ajouter la colonne experience_years
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS experience_years INTEGER;

-- Ajouter la colonne price_range
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS price_range TEXT;

-- Ajouter la colonne payment_methods
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS payment_methods TEXT[];

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN pro_profiles.bio IS 'Biographie du professionnel';
COMMENT ON COLUMN pro_profiles.experience_years IS 'Années d\'expérience';
COMMENT ON COLUMN pro_profiles.price_range IS 'Gamme de prix (ex: "€€€")';
COMMENT ON COLUMN pro_profiles.payment_methods IS 'Méthodes de paiement acceptées';

-- 2. POLICIES RLS POUR SUPABASE STORAGE
-- =====================================

-- POLICIES POUR LE BUCKET "avatars"
-- ----------------------------------

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

-- POLICIES POUR LE BUCKET "proprio_photos"
-- ----------------------------------------

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

-- POLICIES POUR LE BUCKET "pro_photo"
-- -----------------------------------

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

-- 3. VÉRIFICATION DES MODIFICATIONS
-- =================================

-- Vérifier les colonnes ajoutées à pro_profiles
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'pro_profiles' 
  AND column_name IN ('bio', 'experience_years', 'price_range', 'payment_methods')
ORDER BY column_name;

-- Vérifier les policies RLS créées
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%avatar%' 
   OR policyname LIKE '%proprio%' 
   OR policyname LIKE '%pro_photo%'
ORDER BY policyname;

-- 4. INSTRUCTIONS D'UTILISATION
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

NOUVELLES COLONNES pro_profiles:

- bio: TEXT (nullable) - Biographie du professionnel
- experience_years: INTEGER (nullable) - Années d'expérience
- price_range: TEXT (nullable) - Gamme de prix (ex: "€€€")
- payment_methods: TEXT[] (nullable) - Méthodes de paiement acceptées

UTILISATION DANS LE CODE:

1. Upload d'une photo:
```javascript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/profile.jpg`, file, { upsert: true })
```

2. Mise à jour du profil avec bio:
```javascript
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

SÉCURITÉ:
- Chaque utilisateur ne peut uploader/modifier/supprimer que ses propres fichiers
- Les fichiers sont organisés par user_id dans des dossiers séparés
- La lecture est publique pour l'affichage des images
- Les policies RLS garantissent l'isolation des données
*/
