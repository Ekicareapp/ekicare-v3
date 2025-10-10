-- Script de test pour vérifier la colonne photo_url et la récupération des données
-- Date: 2024-01-15

-- 1. Vérifier que la colonne photo_url existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pro_profiles' 
AND column_name = 'photo_url';

-- 2. Vérifier la structure complète de la table pro_profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pro_profiles'
ORDER BY ordinal_position;

-- 3. Test de récupération des données avec photo_url
-- (Simulation d'une requête côté propriétaire pour voir les profils pros)
SELECT 
  pp.user_id,
  pp.prenom,
  pp.nom,
  pp.profession,
  pp.ville_nom,
  pp.rayon_km,
  pp.photo_url,
  pp.bio,
  pp.experience_years,
  pp.price_range,
  pp.payment_methods,
  pp.created_at,
  pp.updated_at
FROM pro_profiles pp
WHERE pp.photo_url IS NOT NULL
ORDER BY pp.updated_at DESC
LIMIT 10;

-- 4. Vérifier les URLs de photos valides
SELECT 
  user_id,
  prenom,
  nom,
  photo_url,
  CASE 
    WHEN photo_url LIKE 'https://%' THEN 'URL valide'
    ELSE 'URL invalide'
  END as url_status
FROM pro_profiles 
WHERE photo_url IS NOT NULL;

-- 5. Statistiques sur les photos de profil
SELECT 
  COUNT(*) as total_profiles,
  COUNT(photo_url) as profiles_with_photo,
  ROUND(COUNT(photo_url) * 100.0 / COUNT(*), 2) as photo_percentage
FROM pro_profiles;

-- 6. Test de recherche par critères (simulation recherche propriétaire)
SELECT 
  pp.prenom,
  pp.nom,
  pp.profession,
  pp.ville_nom,
  pp.rayon_km,
  pp.photo_url,
  pp.experience_years,
  pp.price_range
FROM pro_profiles pp
WHERE pp.ville_nom ILIKE '%Paris%'
  AND pp.rayon_km >= 20
  AND pp.experience_years >= 5
  AND pp.photo_url IS NOT NULL
ORDER BY pp.experience_years DESC;
