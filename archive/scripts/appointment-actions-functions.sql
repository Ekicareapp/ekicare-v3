-- =====================================================
-- FONCTIONS POUR LES ACTIONS SUR LES RENDEZ-VOUS
-- =====================================================
-- Ce script crée des fonctions pour gérer les actions
-- sur les rendez-vous (accepter, refuser, annuler, etc.)
-- =====================================================

-- 1. FONCTION POUR ACCEPTER UN RENDEZ-VOUS
-- =====================================================

CREATE OR REPLACE FUNCTION accept_appointment(appointment_id UUID, user_id UUID)
RETURNS JSON AS $$
DECLARE
    appointment_record RECORD;
    result JSON;
BEGIN
    -- Vérifier que le rendez-vous existe et que l'utilisateur peut l'accepter
    SELECT * INTO appointment_record
    FROM appointments 
    WHERE id = appointment_id 
    AND (pro_id IN (SELECT id FROM pro_profiles WHERE user_id = accept_appointment.user_id)
         OR proprio_id = accept_appointment.user_id);

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Rendez-vous non trouvé ou non autorisé'
        );
    END IF;

    -- Vérifier que le statut permet l'acceptation
    IF appointment_record.status NOT IN ('pending', 'proposed') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ce rendez-vous ne peut pas être accepté dans son état actuel'
        );
    END IF;

    -- Mettre à jour le statut
    UPDATE appointments 
    SET 
        status = 'confirmed',
        updated_at = NOW()
    WHERE id = appointment_id;

    -- Retourner le résultat
    RETURN json_build_object(
        'success', true,
        'message', 'Rendez-vous accepté avec succès',
        'new_status', 'confirmed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FONCTION POUR REFUSER UN RENDEZ-VOUS
-- =====================================================

CREATE OR REPLACE FUNCTION refuse_appointment(appointment_id UUID, user_id UUID)
RETURNS JSON AS $$
DECLARE
    appointment_record RECORD;
BEGIN
    -- Vérifier que le rendez-vous existe et que l'utilisateur peut le refuser
    SELECT * INTO appointment_record
    FROM appointments 
    WHERE id = appointment_id 
    AND (pro_id IN (SELECT id FROM pro_profiles WHERE user_id = refuse_appointment.user_id)
         OR proprio_id = refuse_appointment.user_id);

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Rendez-vous non trouvé ou non autorisé'
        );
    END IF;

    -- Vérifier que le statut permet le refus
    IF appointment_record.status NOT IN ('pending', 'proposed') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ce rendez-vous ne peut pas être refusé dans son état actuel'
        );
    END IF;

    -- Mettre à jour le statut
    UPDATE appointments 
    SET 
        status = 'refused',
        updated_at = NOW()
    WHERE id = appointment_id;

    -- Retourner le résultat
    RETURN json_build_object(
        'success', true,
        'message', 'Rendez-vous refusé',
        'new_status', 'refused'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FONCTION POUR ANNULER UN RENDEZ-VOUS
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_appointment(appointment_id UUID, user_id UUID, cancellation_reason TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    appointment_record RECORD;
    new_status TEXT;
BEGIN
    -- Vérifier que le rendez-vous existe et que l'utilisateur peut l'annuler
    SELECT * INTO appointment_record
    FROM appointments 
    WHERE id = appointment_id 
    AND (pro_id IN (SELECT id FROM pro_profiles WHERE user_id = cancel_appointment.user_id)
         OR proprio_id = cancel_appointment.user_id);

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Rendez-vous non trouvé ou non autorisé'
        );
    END IF;

    -- Vérifier que le statut permet l'annulation
    IF appointment_record.status IN ('completed', 'refused', 'cancelled_by_pro', 'cancelled_by_proprio') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ce rendez-vous ne peut pas être annulé dans son état actuel'
        );
    END IF;

    -- Déterminer le nouveau statut selon qui annule
    IF appointment_record.pro_id IN (SELECT id FROM pro_profiles WHERE user_id = cancel_appointment.user_id) THEN
        new_status := 'cancelled_by_pro';
    ELSE
        new_status := 'cancelled_by_proprio';
    END IF;

    -- Mettre à jour le statut
    UPDATE appointments 
    SET 
        status = new_status,
        updated_at = NOW(),
        comment = CASE 
            WHEN cancellation_reason IS NOT NULL THEN comment || ' [Annulé: ' || cancellation_reason || ']'
            ELSE comment
        END
    WHERE id = appointment_id;

    -- Retourner le résultat
    RETURN json_build_object(
        'success', true,
        'message', 'Rendez-vous annulé',
        'new_status', new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FONCTION POUR PROPOSER UN REPROGRAMMAGE
-- =====================================================

CREATE OR REPLACE FUNCTION propose_reschedule(appointment_id UUID, user_id UUID, new_slot TIMESTAMP WITH TIME ZONE, alternative_slots TIMESTAMP WITH TIME ZONE[] DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    appointment_record RECORD;
BEGIN
    -- Vérifier que le rendez-vous existe et que l'utilisateur peut le reprogrammer
    SELECT * INTO appointment_record
    FROM appointments 
    WHERE id = appointment_id 
    AND (pro_id IN (SELECT id FROM pro_profiles WHERE user_id = propose_reschedule.user_id)
         OR proprio_id = propose_reschedule.user_id);

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Rendez-vous non trouvé ou non autorisé'
        );
    END IF;

    -- Vérifier que le statut permet la reprogrammation
    IF appointment_record.status NOT IN ('pending', 'confirmed') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ce rendez-vous ne peut pas être reprogrammé dans son état actuel'
        );
    END IF;

    -- Mettre à jour le rendez-vous
    UPDATE appointments 
    SET 
        status = 'proposed',
        main_slot = new_slot,
        alternative_slots = COALESCE(alternative_slots, alternative_slots),
        updated_at = NOW()
    WHERE id = appointment_id;

    -- Retourner le résultat
    RETURN json_build_object(
        'success', true,
        'message', 'Reprogrammation proposée',
        'new_status', 'proposed',
        'new_slot', new_slot
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FONCTION POUR MARQUER UN RENDEZ-VOUS COMME TERMINÉ
-- =====================================================

CREATE OR REPLACE FUNCTION complete_appointment(appointment_id UUID, user_id UUID, compte_rendu TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    appointment_record RECORD;
BEGIN
    -- Vérifier que le rendez-vous existe et que l'utilisateur peut le terminer
    SELECT * INTO appointment_record
    FROM appointments 
    WHERE id = appointment_id 
    AND pro_id IN (SELECT id FROM pro_profiles WHERE user_id = complete_appointment.user_id);

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Rendez-vous non trouvé ou non autorisé (seuls les professionnels peuvent terminer un rendez-vous)'
        );
    END IF;

    -- Vérifier que le statut permet la completion
    IF appointment_record.status NOT IN ('confirmed') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ce rendez-vous ne peut pas être terminé dans son état actuel'
        );
    END IF;

    -- Mettre à jour le rendez-vous
    UPDATE appointments 
    SET 
        status = 'completed',
        compte_rendu = COALESCE(compte_rendu, compte_rendu),
        compte_rendu_updated_at = NOW(),
        updated_at = NOW()
    WHERE id = appointment_id;

    -- Retourner le résultat
    RETURN json_build_object(
        'success', true,
        'message', 'Rendez-vous marqué comme terminé',
        'new_status', 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. MESSAGE DE SUCCÈS
-- =====================================================

SELECT '🎉 FONCTIONS D\'ACTIONS SUR LES RENDEZ-VOUS CRÉÉES AVEC SUCCÈS !' as message;
SELECT '✅ accept_appointment() - Accepter un rendez-vous' as info1;
SELECT '✅ refuse_appointment() - Refuser un rendez-vous' as info2;
SELECT '✅ cancel_appointment() - Annuler un rendez-vous' as info3;
SELECT '✅ propose_reschedule() - Proposer un reprogrammage' as info4;
SELECT '✅ complete_appointment() - Marquer comme terminé' as info5;
