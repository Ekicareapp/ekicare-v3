-- Script de test pour vérifier l'upload de photos de profil
-- Date: 2024-01-15

-- 1. Vérifier que la colonne photo_url existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'pro_profiles' AND column_name = 'photo_url'
    ) THEN '✅ Colonne photo_url existe'
    ELSE '❌ Colonne photo_url manquante'
  END as photo_url_status;

-- 2. Vérifier la structure du bucket avatars
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets WHERE name = 'avatars'
    ) THEN '✅ Bucket avatars existe'
    ELSE '❌ Bucket avatars manquant'
  END as bucket_status;

-- 3. Vérifier les politiques de sécurité du bucket
SELECT 
  policyname,
  CASE 
    WHEN policyname LIKE '%upload%' THEN '✅ Politique d''upload'
    WHEN policyname LIKE '%update%' THEN '✅ Politique de mise à jour'
    WHEN policyname LIKE '%delete%' THEN '✅ Politique de suppression'
    WHEN policyname LIKE '%view%' THEN '✅ Politique de lecture'
    ELSE '❓ Politique inconnue'
  END as policy_status
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- 4. Tester la récupération des profils avec photos
SELECT 
  user_id,
  prenom,
  nom,
  photo_url,
  CASE 
    WHEN photo_url IS NOT NULL THEN '✅ Photo présente'
    ELSE '❌ Pas de photo'
  END as photo_status,
  created_at,
  updated_at
FROM pro_profiles 
ORDER BY updated_at DESC
LIMIT 5;

-- 5. Statistiques sur les photos
SELECT 
  COUNT(*) as total_profiles,
  COUNT(photo_url) as profiles_with_photo,
  ROUND(COUNT(photo_url) * 100.0 / COUNT(*), 2) as photo_percentage
FROM pro_profiles;

-- 6. Vérifier les URLs de photos valides
SELECT 
  user_id,
  prenom,
  nom,
  photo_url,
  CASE 
    WHEN photo_url LIKE 'https://%supabase%' THEN '✅ URL Supabase valide'
    WHEN photo_url LIKE 'https://%' THEN '✅ URL HTTPS valide'
    WHEN photo_url IS NULL THEN '❌ Pas de photo'
    ELSE '❌ URL invalide'
  END as url_validation
FROM pro_profiles 
WHERE photo_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- 7. Test de simulation pour les propriétaires (recherche de pros avec photos)
SELECT 
  pp.prenom,
  pp.nom,
  pp.profession,
  pp.ville_nom,
  pp.photo_url,
  pp.experience_years,
  pp.price_range
FROM pro_profiles pp
WHERE pp.photo_url IS NOT NULL
  AND pp.ville_nom IS NOT NULL
ORDER BY pp.experience_years DESC
LIMIT 10;
