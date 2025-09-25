-- Migration pour ajouter la colonne photo_url à la table pro_profiles
-- Date: 2024-01-15

-- Ajouter la colonne photo_url si elle n'existe pas déjà
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN pro_profiles.photo_url IS 'URL publique de la photo de profil stockée dans Supabase Storage (bucket avatars)';

-- Créer un index pour optimiser les recherches par photo_url
CREATE INDEX IF NOT EXISTS idx_pro_profiles_photo_url ON pro_profiles(photo_url) WHERE photo_url IS NOT NULL;
