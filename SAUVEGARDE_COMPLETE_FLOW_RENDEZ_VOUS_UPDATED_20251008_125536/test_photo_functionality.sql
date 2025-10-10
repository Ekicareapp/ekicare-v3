-- Test de la fonctionnalité d'upload de photos de profil
-- Date: 2024-01-15

-- 1. Vérifier que la colonne photo_url existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'pro_profiles' AND column_name = 'photo_url'
    ) THEN '✅ Colonne photo_url existe'
    ELSE '❌ Colonne photo_url manquante - Exécuter: migrations/ensure_photo_url_column.sql'
  END as photo_url_status;

-- 2. Vérifier que le bucket avatars existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets WHERE name = 'avatars'
    ) THEN '✅ Bucket avatars existe'
    ELSE '❌ Bucket avatars manquant - Créer le bucket dans Supabase Dashboard'
  END as bucket_status;

-- 3. Vérifier les politiques de sécurité
SELECT 
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Politiques de sécurité configurées'
    ELSE '❌ Politiques manquantes - Exécuter: migrations/setup_avatars_bucket.sql'
  END as policies_status
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatar%';

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
  updated_at
FROM pro_profiles 
ORDER BY updated_at DESC
LIMIT 5;

-- 5. Vérifier les URLs de photos valides
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

-- 6. Statistiques sur les photos
SELECT 
  COUNT(*) as total_profiles,
  COUNT(photo_url) as profiles_with_photo,
  ROUND(COUNT(photo_url) * 100.0 / COUNT(*), 2) as photo_percentage
FROM pro_profiles;

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
