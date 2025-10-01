-- Migration pour ajouter les colonnes manquantes pour les workflows
-- Date: 2024-01-15
-- Description: Compléter les tables avec les colonnes nécessaires aux workflows

-- ==============================================
-- 1. COLONNES MANQUANTES POUR APPOINTMENTS
-- ==============================================

-- Ajouter les colonnes manquantes pour les workflows de rendez-vous
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS lieu TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS compte_rendu TEXT,
ADD COLUMN IF NOT EXISTS alternate_slots TEXT[],
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN appointments.type IS 'Type de soin ou service demandé';
COMMENT ON COLUMN appointments.lieu IS 'Lieu du rendez-vous (adresse ou nom du lieu)';
COMMENT ON COLUMN appointments.notes IS 'Notes additionnelles sur le rendez-vous';
COMMENT ON COLUMN appointments.compte_rendu IS 'Compte-rendu du professionnel après le rendez-vous';
COMMENT ON COLUMN appointments.alternate_slots IS 'Créneaux alternatifs proposés lors des replanifications';
COMMENT ON COLUMN appointments.notification_sent IS 'Indique si une notification a été envoyée';
COMMENT ON COLUMN appointments.reminder_sent IS 'Indique si un rappel a été envoyé';

-- ==============================================
-- 2. COLONNES MANQUANTES POUR EQUIDES
-- ==============================================

-- Ajouter les colonnes manquantes pour les équidés
ALTER TABLE equides 
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 0 AND age <= 50),
ADD COLUMN IF NOT EXISTS sexe TEXT CHECK (sexe IN ('Jument', 'Étalon', 'Hongre')),
ADD COLUMN IF NOT EXISTS race TEXT,
ADD COLUMN IF NOT EXISTS robe TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN equides.age IS 'Âge de l''équidé en années';
COMMENT ON COLUMN equides.sexe IS 'Sexe de l''équidé (Jument, Étalon, Hongre)';
COMMENT ON COLUMN equides.race IS 'Race de l''équidé';
COMMENT ON COLUMN equides.robe IS 'Couleur de la robe de l''équidé';
COMMENT ON COLUMN equides.description IS 'Description et particularités de l''équidé';

-- ==============================================
-- 3. COLONNES MANQUANTES POUR PRO_PROFILES
-- ==============================================

-- Ajouter les colonnes manquantes pour les profils professionnels
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS total_appointments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_appointments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN pro_profiles.is_active IS 'Indique si le profil professionnel est actif';
COMMENT ON COLUMN pro_profiles.last_activity IS 'Dernière activité du professionnel';
COMMENT ON COLUMN pro_profiles.rating IS 'Note moyenne du professionnel (0-5)';
COMMENT ON COLUMN pro_profiles.total_appointments IS 'Nombre total de rendez-vous';
COMMENT ON COLUMN pro_profiles.completed_appointments IS 'Nombre de rendez-vous terminés';
COMMENT ON COLUMN pro_profiles.subscription_start IS 'Date de début d''abonnement';
COMMENT ON COLUMN pro_profiles.stripe_customer_id IS 'ID client Stripe';
COMMENT ON COLUMN pro_profiles.stripe_subscription_id IS 'ID abonnement Stripe';

-- ==============================================
-- 4. COLONNES MANQUANTES POUR PROPRIO_PROFILES
-- ==============================================

-- Ajouter les colonnes manquantes pour les profils propriétaires
ALTER TABLE proprio_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_horses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_appointments INTEGER DEFAULT 0;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN proprio_profiles.is_active IS 'Indique si le profil propriétaire est actif';
COMMENT ON COLUMN proprio_profiles.last_activity IS 'Dernière activité du propriétaire';
COMMENT ON COLUMN proprio_profiles.total_horses IS 'Nombre total d''équidés';
COMMENT ON COLUMN proprio_profiles.total_appointments IS 'Nombre total de rendez-vous';

-- ==============================================
-- 5. COLONNES MANQUANTES POUR USERS
-- ==============================================

-- Ajouter les colonnes manquantes pour la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN users.is_active IS 'Indique si le compte utilisateur est actif';
COMMENT ON COLUMN users.last_login IS 'Dernière connexion de l''utilisateur';
COMMENT ON COLUMN users.email_verified IS 'Indique si l''email est vérifié';
COMMENT ON COLUMN users.phone_verified IS 'Indique si le téléphone est vérifié';

-- ==============================================
-- 6. COLONNES MANQUANTES POUR LOGS (OPTIONNEL)
-- ==============================================

-- Note: La table logs n'existe pas encore, ces colonnes seront ajoutées si nécessaire

-- ==============================================
-- 7. TRIGGERS POUR MAINTENIR LES COMPTEURS
-- ==============================================

-- Fonction pour mettre à jour les compteurs d'appointments
CREATE OR REPLACE FUNCTION update_appointment_counters()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le compteur pour le propriétaire
    UPDATE proprio_profiles 
    SET total_appointments = (
        SELECT COUNT(*) 
        FROM appointments 
        WHERE appointments.proprio_id = NEW.proprio_id
    )
    WHERE user_id = NEW.proprio_id;
    
    -- Mettre à jour le compteur pour le professionnel
    UPDATE pro_profiles 
    SET total_appointments = (
        SELECT COUNT(*) 
        FROM appointments 
        WHERE appointments.pro_id = NEW.pro_id
    ),
    completed_appointments = (
        SELECT COUNT(*) 
        FROM appointments 
        WHERE appointments.pro_id = NEW.pro_id 
        AND appointments.statut = 'TERMINE'
    )
    WHERE user_id = NEW.pro_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les appointments
CREATE TRIGGER trigger_update_appointment_counters
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_counters();

-- Fonction pour mettre à jour le compteur d'équidés
CREATE OR REPLACE FUNCTION update_equide_counter()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le compteur d'équidés pour le propriétaire
    UPDATE proprio_profiles 
    SET total_horses = (
        SELECT COUNT(*) 
        FROM equides 
        WHERE equides.proprio_id = NEW.proprio_id
    )
    WHERE user_id = NEW.proprio_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les equides
CREATE TRIGGER trigger_update_equide_counter
    AFTER INSERT OR UPDATE OR DELETE ON equides
    FOR EACH ROW
    EXECUTE FUNCTION update_equide_counter();

-- ==============================================
-- 8. VÉRIFICATION DES COLONNES AJOUTÉES
-- ==============================================

-- Vérifier la structure des tables mises à jour
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('users', 'proprio_profiles', 'pro_profiles', 'equides', 'appointments')
ORDER BY table_name, ordinal_position;
