-- Migration CORRIGÉE pour la mise à jour automatique des statuts des rendez-vous
-- Utilise le bon statut selon votre contrainte de table

-- 1. Créer une fonction pour mettre à jour les statuts
CREATE OR REPLACE FUNCTION update_past_appointment_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mettre à jour tous les rendez-vous passés en statut "completed"
    UPDATE appointments 
    SET status = 'completed',
        updated_at = NOW()
    WHERE status IN ('confirmed', 'pending', 'rescheduled')
    AND main_slot < NOW()
    AND status != 'completed';
    
    -- Log des mises à jour pour debugging
    IF FOUND THEN
        RAISE NOTICE 'Mise à jour automatique: % rendez-vous(s) passé(s) en statut "completed"', ROW_COUNT;
    END IF;
END;
$$;

-- 2. Créer une fonction alternative pour mise à jour manuelle
CREATE OR REPLACE FUNCTION manual_update_appointment_statuses()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Compter les rendez-vous à mettre à jour
    SELECT COUNT(*) INTO updated_count
    FROM appointments 
    WHERE status IN ('confirmed', 'pending', 'rescheduled')
    AND main_slot < NOW();
    
    -- Mettre à jour
    UPDATE appointments 
    SET status = 'completed',
        updated_at = NOW()
    WHERE status IN ('confirmed', 'pending', 'rescheduled')
    AND main_slot < NOW();
    
    RETURN json_build_object(
        'success', true,
        'updated_count', updated_count,
        'timestamp', NOW()
    );
END;
$$;

-- 3. Créer un index pour optimiser les requêtes de mise à jour
CREATE INDEX IF NOT EXISTS idx_appointments_status_main_slot 
ON appointments (status, main_slot) 
WHERE status IN ('confirmed', 'pending', 'rescheduled');

-- 4. Ajouter une colonne updated_at si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'updated_at') THEN
        ALTER TABLE appointments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END;
$$;

-- 5. Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur la table appointments
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Tester la fonction manuelle
SELECT manual_update_appointment_statuses();

-- 7. Vérifier le résultat
SELECT 
    status,
    COUNT(*) as count
FROM appointments 
WHERE main_slot < NOW()
GROUP BY status
ORDER BY status;
