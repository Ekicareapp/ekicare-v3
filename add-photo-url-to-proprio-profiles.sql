-- 📸 AJOUT DE LA COLONNE photo_url À LA TABLE proprio_profiles
-- Ce script ajoute la colonne photo_url pour stocker l'URL de la photo de profil

-- 1. Vérifier si la colonne existe déjà
DO $$
BEGIN
    -- Vérifier si la colonne photo_url existe dans proprio_profiles
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'proprio_profiles' 
        AND column_name = 'photo_url'
    ) THEN
        -- Ajouter la colonne photo_url
        ALTER TABLE proprio_profiles 
        ADD COLUMN photo_url TEXT;
        
        RAISE NOTICE 'Colonne photo_url ajoutée à la table proprio_profiles';
    ELSE
        RAISE NOTICE 'Colonne photo_url existe déjà dans la table proprio_profiles';
    END IF;
END $$;

-- 2. Vérifier si la colonne photo_url existe dans pro_profiles
DO $$
BEGIN
    -- Vérifier si la colonne photo_url existe dans pro_profiles
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pro_profiles' 
        AND column_name = 'photo_url'
    ) THEN
        -- Ajouter la colonne photo_url
        ALTER TABLE pro_profiles 
        ADD COLUMN photo_url TEXT;
        
        RAISE NOTICE 'Colonne photo_url ajoutée à la table pro_profiles';
    ELSE
        RAISE NOTICE 'Colonne photo_url existe déjà dans la table pro_profiles';
    END IF;
END $$;

-- 3. Vérifier la structure des tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('proprio_profiles', 'pro_profiles')
  AND column_name = 'photo_url'
ORDER BY table_name, column_name;

-- 4. Commentaires sur l'utilisation
COMMENT ON COLUMN proprio_profiles.photo_url IS 'URL de la photo de profil du propriétaire stockée dans Supabase Storage';
COMMENT ON COLUMN pro_profiles.photo_url IS 'URL de la photo de profil du professionnel stockée dans Supabase Storage';
