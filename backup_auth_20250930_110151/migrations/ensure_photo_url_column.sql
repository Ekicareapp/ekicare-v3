-- Migration pour s'assurer que la colonne photo_url existe dans pro_profiles
-- Date: 2024-01-15

-- Vérifier si la colonne existe et l'ajouter si nécessaire
DO $$ 
BEGIN
    -- Vérifier si la colonne photo_url existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pro_profiles' 
        AND column_name = 'photo_url'
    ) THEN
        -- Ajouter la colonne photo_url
        ALTER TABLE pro_profiles ADD COLUMN photo_url TEXT;
        
        -- Ajouter un commentaire
        COMMENT ON COLUMN pro_profiles.photo_url IS 'URL publique de la photo de profil stockée dans Supabase Storage (bucket avatars)';
        
        -- Créer un index pour optimiser les recherches
        CREATE INDEX IF NOT EXISTS idx_pro_profiles_photo_url ON pro_profiles(photo_url) WHERE photo_url IS NOT NULL;
        
        RAISE NOTICE 'Colonne photo_url ajoutée à la table pro_profiles';
    ELSE
        RAISE NOTICE 'Colonne photo_url existe déjà dans la table pro_profiles';
    END IF;
END $$;

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pro_profiles'
ORDER BY ordinal_position;
