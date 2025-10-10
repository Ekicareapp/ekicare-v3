-- Test de la fonctionnalité de preview des photos de profil
-- Date: 2024-01-15

-- 1. Vérifier que la colonne photo_url existe et contient des données
SELECT 
  COUNT(*) as total_profiles,
  COUNT(photo_url) as profiles_with_photo,
  ROUND(COUNT(photo_url) * 100.0 / COUNT(*), 2) as photo_percentage
FROM pro_profiles;

-- 2. Vérifier les URLs de photos valides
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
  END as url_validation,
  updated_at
FROM pro_profiles 
WHERE photo_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- 3. Vérifier que les photos sont accessibles publiquement
-- (Ce test doit être fait manuellement en ouvrant les URLs dans un navigateur)
SELECT 
  user_id,
  prenom,
  nom,
  photo_url,
  'Test manuel: Ouvrir cette URL dans un navigateur' as test_instruction
FROM pro_profiles 
WHERE photo_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- 4. Vérifier la structure du bucket avatars
SELECT 
  name as file_name,
  bucket_id,
  created_at,
  updated_at
FROM storage.objects 
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Vérifier que les fichiers correspondent aux profils
SELECT 
  pp.user_id,
  pp.prenom,
  pp.nom,
  pp.photo_url,
  so.name as storage_file_name,
  CASE 
    WHEN so.name = CONCAT(pp.user_id::text, '/profile.jpg') THEN '✅ Fichier correspond'
    ELSE '❌ Fichier ne correspond pas'
  END as file_match
FROM pro_profiles pp
LEFT JOIN storage.objects so ON so.name = CONCAT(pp.user_id::text, '/profile.jpg')
WHERE pp.photo_url IS NOT NULL
ORDER BY pp.updated_at DESC
LIMIT 10;
