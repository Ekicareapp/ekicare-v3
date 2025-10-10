-- CORRECTION CONTRAINTES UPSERT POUR pro_profiles
-- Exécuter ce script dans le SQL Editor du dashboard Supabase

-- 1. VÉRIFIER LES CONTRAINTES EXISTANTES
-- =====================================
SELECT 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'pro_profiles' 
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- 2. AJOUTER LA CONTRAINTE UNIQUE SUR user_id
-- ===========================================
-- Vérifier d'abord si la contrainte existe déjà
DO $$
BEGIN
    -- Vérifier si la contrainte unique sur user_id existe déjà
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'pro_profiles' 
          AND constraint_name = 'pro_profiles_user_id_unique'
          AND constraint_type = 'UNIQUE'
    ) THEN
        -- Ajouter la contrainte unique
        ALTER TABLE pro_profiles 
        ADD CONSTRAINT pro_profiles_user_id_unique UNIQUE (user_id);
        
        RAISE NOTICE 'Contrainte unique ajoutée sur user_id';
    ELSE
        RAISE NOTICE 'Contrainte unique sur user_id existe déjà';
    END IF;
END
$$;

-- 3. VÉRIFIER QUE LA CONTRAINTE A ÉTÉ AJOUTÉE
-- ===========================================
SELECT 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'pro_profiles' 
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;
