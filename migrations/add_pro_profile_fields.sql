-- Migration pour ajouter les champs manquants à la table pro_profiles
-- Date: 2024-01-15

-- Ajouter le champ experience_years (années d'expérience)
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0 AND experience_years <= 60);

-- Ajouter le champ bio (description professionnelle)
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Ajouter le champ price_range (fourchette tarifaire)
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS price_range TEXT DEFAULT '€€' CHECK (price_range IN ('€', '€€', '€€€'));

-- Ajouter le champ payment_methods (moyens de paiement acceptés)
-- Utilisation d'un array de textes pour stocker plusieurs moyens de paiement
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}';

-- Ajouter un index sur experience_years pour les recherches
CREATE INDEX IF NOT EXISTS idx_pro_profiles_experience_years ON pro_profiles(experience_years);

-- Ajouter un index sur price_range pour les recherches
CREATE INDEX IF NOT EXISTS idx_pro_profiles_price_range ON pro_profiles(price_range);

-- Commentaires pour documenter les nouveaux champs
COMMENT ON COLUMN pro_profiles.experience_years IS 'Nombre d''années d''expérience professionnelle (0-60)';
COMMENT ON COLUMN pro_profiles.bio IS 'Description professionnelle et bio du professionnel';
COMMENT ON COLUMN pro_profiles.price_range IS 'Fourchette tarifaire: € (économique), €€ (moyen), €€€ (premium)';
COMMENT ON COLUMN pro_profiles.payment_methods IS 'Array des moyens de paiement acceptés (ex: ["CB", "Espèces", "Chèque"])';
