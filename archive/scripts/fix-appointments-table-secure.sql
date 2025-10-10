-- =====================================================
-- SCRIPT SÉCURISÉ POUR LA TABLE APPOINTMENTS
-- =====================================================
-- Ce script vérifie d'abord la structure existante
-- et applique seulement les modifications nécessaires
-- =====================================================

-- 1. VÉRIFICATION DE LA STRUCTURE EXISTANTE
-- =====================================================

-- Vérifier si la table appointments existe et sa structure
DO $$
DECLARE
    table_exists boolean;
    column_count integer;
    rec RECORD;
BEGIN
    -- Vérifier l'existence de la table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Table appointments existe déjà';
        
        -- Compter les colonnes existantes
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments';
        
        RAISE NOTICE '📊 Nombre de colonnes actuelles: %', column_count;
        
        -- Lister les colonnes existantes
        RAISE NOTICE '📋 Colonnes existantes:';
        FOR rec IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'appointments'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - % (%): nullable=%,', rec.column_name, rec.data_type, rec.is_nullable;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ Table appointments n''existe pas - création nécessaire';
    END IF;
END $$;

-- 2. VÉRIFICATION DES TABLES DE RÉFÉRENCE
-- =====================================================

-- Vérifier que pro_profiles.user_id est bien unique/primary key
DO $$
DECLARE
    pro_user_id_is_pk boolean;
    proprio_user_id_is_pk boolean;
BEGIN
    -- Vérifier pro_profiles.user_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'pro_profiles'
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = 'user_id'
    ) INTO pro_user_id_is_pk;
    
    -- Vérifier proprio_profiles.user_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'proprio_profiles'
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = 'user_id'
    ) INTO proprio_user_id_is_pk;
    
    IF pro_user_id_is_pk THEN
        RAISE NOTICE '✅ pro_profiles.user_id est une clé primaire';
    ELSE
        RAISE NOTICE '⚠️  pro_profiles.user_id n''est PAS une clé primaire - contrainte FK risquée';
    END IF;
    
    IF proprio_user_id_is_pk THEN
        RAISE NOTICE '✅ proprio_profiles.user_id est une clé primaire';
    ELSE
        RAISE NOTICE '⚠️  proprio_profiles.user_id n''est PAS une clé primaire - contrainte FK risquée';
    END IF;
END $$;

-- 3. CRÉATION/MODIFICATION SÉCURISÉE DE LA TABLE
-- =====================================================

-- Créer la table seulement si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relations (clés étrangères)
    pro_id UUID NOT NULL,
    proprio_id UUID NOT NULL,
    equide_ids UUID[] NOT NULL DEFAULT '{}',
    
    -- Informations du rendez-vous
    main_slot TIMESTAMP WITH TIME ZONE NOT NULL,
    alternative_slots TIMESTAMP WITH TIME ZONE[] DEFAULT '{}',
    duration_minutes INTEGER DEFAULT 60,
    
    -- Statut et gestion
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'rescheduled', 'completed')),
    comment TEXT NOT NULL,
    
    -- Compte rendu
    compte_rendu TEXT,
    compte_rendu_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AJOUT DES CONTRAINTES DE CLÉS ÉTRANGÈRES (SEULEMENT SI ELLES N'EXISTENT PAS)
-- =====================================================

-- Contrainte FK vers pro_profiles (seulement si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND constraint_name = 'fk_appointments_pro_id'
    ) THEN
        ALTER TABLE public.appointments 
        ADD CONSTRAINT fk_appointments_pro_id 
        FOREIGN KEY (pro_id) REFERENCES public.pro_profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Contrainte FK pro_id ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️  Contrainte FK pro_id existe déjà';
    END IF;
END $$;

-- Contrainte FK vers proprio_profiles (seulement si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND constraint_name = 'fk_appointments_proprio_id'
    ) THEN
        ALTER TABLE public.appointments 
        ADD CONSTRAINT fk_appointments_proprio_id 
        FOREIGN KEY (proprio_id) REFERENCES public.proprio_profiles(user_id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Contrainte FK proprio_id ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️  Contrainte FK proprio_id existe déjà';
    END IF;
END $$;

-- 5. CRÉATION DES INDEX (SEULEMENT S'ILS N'EXISTENT PAS)
-- =====================================================

-- Index pour pro_id
CREATE INDEX IF NOT EXISTS idx_appointments_pro_id ON public.appointments(pro_id);

-- Index pour proprio_id  
CREATE INDEX IF NOT EXISTS idx_appointments_proprio_id ON public.appointments(proprio_id);

-- Index pour status
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Index pour main_slot
CREATE INDEX IF NOT EXISTS idx_appointments_main_slot ON public.appointments(main_slot);

-- Index pour created_at
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON public.appointments(created_at);

-- Index GIN pour les recherches dans equide_ids
CREATE INDEX IF NOT EXISTS idx_appointments_equide_ids ON public.appointments USING GIN(equide_ids);

-- 6. ACTIVATION DE RLS (SEULEMENT SI CE N'EST PAS DÉJÀ ACTIVÉ)
-- =====================================================

-- Activer RLS si ce n'est pas déjà fait
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'appointments' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS activé pour appointments';
    ELSE
        RAISE NOTICE 'ℹ️  RLS déjà activé pour appointments';
    END IF;
END $$;

-- 7. CRÉATION DES POLITIQUES RLS SÉCURISÉES
-- =====================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Pros can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Proprios can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Pros can update their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Proprios can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Proprios can update their appointments" ON public.appointments;

-- Politiques de lecture (SELECT)
CREATE POLICY "Pros can view their appointments" ON public.appointments
    FOR SELECT USING (pro_id = auth.uid());

CREATE POLICY "Proprios can view their appointments" ON public.appointments
    FOR SELECT USING (proprio_id = auth.uid());

-- Politiques de création (INSERT)
CREATE POLICY "Proprios can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (proprio_id = auth.uid());

-- Politiques de mise à jour (UPDATE) - SÉCURISÉES
-- Le PRO peut modifier : status, compte_rendu, compte_rendu_updated_at
CREATE POLICY "Pros can update appointment status and reports" ON public.appointments
    FOR UPDATE USING (pro_id = auth.uid());

-- Le PROPRIO peut modifier : comment, main_slot, alternative_slots (pour replanification)
CREATE POLICY "Proprios can update appointment details" ON public.appointments
    FOR UPDATE USING (proprio_id = auth.uid());

-- 8. CRÉATION DU TRIGGER POUR updated_at
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at (seulement s'il n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_appointments_updated_at'
        AND event_object_table = 'appointments'
    ) THEN
        CREATE TRIGGER update_appointments_updated_at 
            BEFORE UPDATE ON public.appointments 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger updated_at créé';
    ELSE
        RAISE NOTICE 'ℹ️  Trigger updated_at existe déjà';
    END IF;
END $$;

-- 9. VÉRIFICATION FINALE
-- =====================================================

-- Vérifier la structure finale
DO $$
DECLARE
    final_column_count integer;
    final_policy_count integer;
    final_index_count integer;
BEGIN
    -- Compter les colonnes finales
    SELECT COUNT(*) INTO final_column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments';
    
    -- Compter les politiques RLS
    SELECT COUNT(*) INTO final_policy_count
    FROM pg_policies 
    WHERE tablename = 'appointments';
    
    -- Compter les index
    SELECT COUNT(*) INTO final_index_count
    FROM pg_indexes 
    WHERE tablename = 'appointments';
    
    RAISE NOTICE '🎉 VÉRIFICATION FINALE:';
    RAISE NOTICE '  📊 Colonnes: %', final_column_count;
    RAISE NOTICE '  🔒 Politiques RLS: %', final_policy_count;
    RAISE NOTICE '  📈 Index: %', final_index_count;
    RAISE NOTICE '✅ Table appointments prête à l''utilisation !';
END $$;

-- 10. COMMENTAIRES POUR LA DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.appointments IS 'Table des rendez-vous entre propriétaires et professionnels';
COMMENT ON COLUMN public.appointments.pro_id IS 'ID du professionnel concerné par le rendez-vous';
COMMENT ON COLUMN public.appointments.proprio_id IS 'ID du propriétaire ayant demandé le rendez-vous';
COMMENT ON COLUMN public.appointments.equide_ids IS 'Tableau des IDs des équidés concernés par le rendez-vous';
COMMENT ON COLUMN public.appointments.main_slot IS 'Créneau principal proposé ou confirmé pour le rendez-vous';
COMMENT ON COLUMN public.appointments.alternative_slots IS 'Tableau des créneaux alternatifs proposés par le propriétaire';
COMMENT ON COLUMN public.appointments.status IS 'Statut actuel du rendez-vous (pending, confirmed, rescheduled, rejected, completed)';
COMMENT ON COLUMN public.appointments.comment IS 'Commentaire ou motif de consultation du propriétaire';
COMMENT ON COLUMN public.appointments.compte_rendu IS 'Compte-rendu du professionnel après le rendez-vous';
COMMENT ON COLUMN public.appointments.duration_minutes IS 'Durée estimée ou réelle du rendez-vous en minutes';
