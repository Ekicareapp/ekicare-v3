-- Migration pour la mise à jour automatique des statuts des rendez-vous
-- Ce script crée une fonction et un trigger pour mettre à jour automatiquement
-- les rendez-vous passés en statut "terminé"

-- 1. Créer une fonction pour mettre à jour les statuts
CREATE OR REPLACE FUNCTION update_past_appointment_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mettre à jour tous les rendez-vous passés en statut "terminé"
    UPDATE appointments 
    SET status = 'terminé',
        updated_at = NOW()
    WHERE status IN ('confirmed', 'pending', 'rescheduled')
    AND main_slot < NOW()
    AND (status != 'terminé' OR status IS NULL);
    
    -- Log des mises à jour pour debugging
    IF FOUND THEN
        RAISE NOTICE 'Mise à jour automatique: % rendez-vous(s) passé(s) en statut "terminé"', ROW_COUNT;
    END IF;
END;
$$;

-- 2. Créer un trigger qui s'exécute automatiquement
-- Ce trigger utilise pg_cron pour s'exécuter toutes les minutes
-- Note: pg_cron doit être activé sur votre instance Supabase

-- Vérifier si pg_cron est disponible
DO $$
BEGIN
    -- Tenter de créer une tâche cron
    BEGIN
        -- Supprimer la tâche existante si elle existe
        PERFORM cron.unschedule('update-appointment-statuses');
        
        -- Créer la nouvelle tâche qui s'exécute toutes les minutes
        PERFORM cron.schedule(
            'update-appointment-statuses',
            '* * * * *', -- Toutes les minutes
            'SELECT update_past_appointment_statuses();'
        );
        
        RAISE NOTICE 'Tâche cron créée avec succès pour la mise à jour automatique des statuts';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'pg_cron non disponible, création d''une fonction alternative';
            
            -- Créer une fonction alternative qui peut être appelée manuellement
            -- ou via un webhook/API
            CREATE OR REPLACE FUNCTION manual_update_appointment_statuses()
            RETURNS json
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $func$
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
                SET status = 'terminé',
                    updated_at = NOW()
                WHERE status IN ('confirmed', 'pending', 'rescheduled')
                AND main_slot < NOW();
                
                RETURN json_build_object(
                    'success', true,
                    'updated_count', updated_count,
                    'timestamp', NOW()
                );
            END;
            $func$;
    END;
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

-- 6. Instructions pour l'activation
COMMENT ON FUNCTION update_past_appointment_statuses() IS 
'Fonction pour mettre à jour automatiquement les statuts des rendez-vous passés. 
Si pg_cron est activé, elle s''exécute toutes les minutes automatiquement.
Sinon, utilisez manual_update_appointment_statuses() via une API ou webhook.';

COMMENT ON FUNCTION manual_update_appointment_statuses() IS 
'Fonction alternative pour mettre à jour manuellement les statuts des rendez-vous passés.
Retourne le nombre de rendez-vous mis à jour.';

-- 7. Test de la fonction
-- SELECT update_past_appointment_statuses();
-- SELECT manual_update_appointment_statuses();
