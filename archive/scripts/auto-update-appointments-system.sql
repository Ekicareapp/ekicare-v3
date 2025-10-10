-- =====================================================
-- SYSTÈME AUTOMATIQUE DE MISE À JOUR DES RENDEZ-VOUS
-- =====================================================
-- Ce script crée des triggers pour mettre à jour automatiquement
-- les compteurs et statuts des rendez-vous
-- =====================================================

-- 1. FONCTION POUR METTRE À JOUR LES COMPTEURS DU PRO
-- =====================================================

CREATE OR REPLACE FUNCTION update_pro_appointment_counters()
RETURNS TRIGGER AS $$
DECLARE
    pro_id_to_update UUID;
    total_count INTEGER;
    completed_count INTEGER;
    pending_count INTEGER;
    confirmed_count INTEGER;
BEGIN
    -- Déterminer l'ID du pro à mettre à jour
    IF TG_OP = 'DELETE' THEN
        pro_id_to_update := OLD.pro_id;
    ELSE
        pro_id_to_update := NEW.pro_id;
    END IF;

    -- Compter les appointments pour ce pro
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed
    INTO total_count, completed_count, pending_count, confirmed_count
    FROM appointments 
    WHERE pro_id = pro_id_to_update;

    -- Mettre à jour le profil pro
    UPDATE pro_profiles 
    SET 
        total_appointments = total_count,
        completed_appointments = completed_count,
        last_activity = NOW()
    WHERE id = pro_id_to_update;

    -- Log pour debug
    RAISE NOTICE 'Pro %: total=%, completed=%, pending=%, confirmed=%', 
        pro_id_to_update, total_count, completed_count, pending_count, confirmed_count;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. FONCTION POUR METTRE À JOUR LES COMPTEURS DU PROPRIO
-- =====================================================

CREATE OR REPLACE FUNCTION update_proprio_appointment_counters()
RETURNS TRIGGER AS $$
DECLARE
    proprio_id_to_update UUID;
    total_count INTEGER;
    completed_count INTEGER;
BEGIN
    -- Déterminer l'ID du proprio à mettre à jour
    IF TG_OP = 'DELETE' THEN
        proprio_id_to_update := OLD.proprio_id;
    ELSE
        proprio_id_to_update := NEW.proprio_id;
    END IF;

    -- Compter les appointments pour ce proprio
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
    INTO total_count, completed_count
    FROM appointments 
    WHERE proprio_id = proprio_id_to_update;

    -- Mettre à jour le profil proprio (si la table a ces champs)
    -- Note: Les proprio_profiles n'ont peut-être pas ces champs
    -- On peut les ajouter si nécessaire
    
    -- Log pour debug
    RAISE NOTICE 'Proprio %: total=%, completed=%', 
        proprio_id_to_update, total_count, completed_count;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. FONCTION POUR GÉRER LES CHANGEMENTS DE STATUT
-- =====================================================

CREATE OR REPLACE FUNCTION handle_appointment_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log du changement de statut
    RAISE NOTICE 'Appointment %: % -> %', 
        COALESCE(NEW.id, OLD.id), 
        COALESCE(OLD.status, 'NULL'), 
        COALESCE(NEW.status, 'NULL');

    -- Gérer les transitions de statut spécifiques
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Si le rendez-vous est confirmé, mettre à jour la date de confirmation
        IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
            NEW.updated_at := NOW();
        END IF;
        
        -- Si le rendez-vous est terminé, mettre à jour la date de completion
        IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
            NEW.updated_at := NOW();
        END IF;
        
        -- Si le rendez-vous est annulé, mettre à jour la date d'annulation
        IF NEW.status IN ('cancelled_by_pro', 'cancelled_by_proprio', 'refused') 
           AND OLD.status NOT IN ('cancelled_by_pro', 'cancelled_by_proprio', 'refused') THEN
            NEW.updated_at := NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CRÉER LES TRIGGERS
-- =====================================================

-- Trigger pour les appointments (INSERT, UPDATE, DELETE)
DROP TRIGGER IF EXISTS trigger_update_pro_counters ON appointments;
CREATE TRIGGER trigger_update_pro_counters
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_pro_appointment_counters();

DROP TRIGGER IF EXISTS trigger_update_proprio_counters ON appointments;
CREATE TRIGGER trigger_update_proprio_counters
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_proprio_appointment_counters();

DROP TRIGGER IF EXISTS trigger_handle_status_changes ON appointments;
CREATE TRIGGER trigger_handle_status_changes
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION handle_appointment_status_changes();

-- 5. FONCTION POUR METTRE À JOUR TOUS LES COMPTEURS EXISTANTS
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_all_appointment_counters()
RETURNS void AS $$
DECLARE
    pro_record RECORD;
    total_count INTEGER;
    completed_count INTEGER;
BEGIN
    -- Mettre à jour tous les profils pro
    FOR pro_record IN 
        SELECT DISTINCT pro_id FROM appointments
    LOOP
        -- Compter les appointments pour ce pro
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'completed') as completed
        INTO total_count, completed_count
        FROM appointments 
        WHERE pro_id = pro_record.pro_id;

        -- Mettre à jour le profil
        UPDATE pro_profiles 
        SET 
            total_appointments = total_count,
            completed_appointments = completed_count,
            last_activity = NOW()
        WHERE id = pro_record.pro_id;

        RAISE NOTICE 'Mis à jour pro %: total=%, completed=%', 
            pro_record.pro_id, total_count, completed_count;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. EXÉCUTER LA MISE À JOUR INITIALE
-- =====================================================

SELECT refresh_all_appointment_counters();

-- 7. VÉRIFICATION
-- =====================================================

SELECT 
    id,
    prenom,
    nom,
    total_appointments,
    completed_appointments,
    last_activity
FROM pro_profiles 
WHERE total_appointments > 0
ORDER BY total_appointments DESC;

-- 8. MESSAGE DE SUCCÈS
-- =====================================================

SELECT '🎉 SYSTÈME AUTOMATIQUE DE MISE À JOUR CRÉÉ AVEC SUCCÈS !' as message;
SELECT '✅ Les compteurs se mettront à jour automatiquement' as info1;
SELECT '✅ Les changements de statut seront trackés' as info2;
SELECT '✅ Tous les compteurs existants ont été mis à jour' as info3;
