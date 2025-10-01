-- AJOUT DES COLONNES MANQUANTES À pro_profiles
-- Exécuter ce script dans le SQL Editor du dashboard Supabase

-- 1. AJOUT DE LA COLONNE bio
-- ==========================
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

COMMENT ON COLUMN pro_profiles.bio IS 'Biographie du professionnel';

-- 2. AJOUT DE LA COLONNE experience_years
-- =======================================
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS experience_years INTEGER;

COMMENT ON COLUMN pro_profiles.experience_years IS 'Années d''expérience';

-- 3. AJOUT DE LA COLONNE price_range
-- ==================================
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS price_range TEXT;

COMMENT ON COLUMN pro_profiles.price_range IS 'Gamme de prix (ex: "€€€")';

-- 4. AJOUT DE LA COLONNE payment_methods
-- ======================================
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS payment_methods TEXT[];

COMMENT ON COLUMN pro_profiles.payment_methods IS 'Méthodes de paiement acceptées';

-- 5. VÉRIFICATION DES COLONNES AJOUTÉES
-- =====================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pro_profiles' 
  AND column_name IN ('bio', 'experience_years', 'price_range', 'payment_methods')
ORDER BY column_name;

-- 6. TEST D'INSERTION DE DONNÉES DE TEST
-- ======================================
-- (Optionnel - pour vérifier que les colonnes fonctionnent)
/*
UPDATE pro_profiles 
SET 
  bio = 'Vétérinaire expérimenté avec 10 ans d''expérience',
  experience_years = 10,
  price_range = '€€€',
  payment_methods = ARRAY['CB', 'Espèces', 'Chèque']
WHERE user_id = (SELECT id FROM users WHERE role = 'PRO' LIMIT 1);
*/
