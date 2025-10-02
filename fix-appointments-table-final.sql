-- =====================================================
-- SCRIPT FINAL SÉCURISÉ POUR LA TABLE APPOINTMENTS
-- =====================================================
-- Version simplifiée sans références problématiques
-- =====================================================

-- 1. VÉRIFICATION ET CRÉATION DE LA TABLE
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

-- 2. AJOUT DES CONTRAINTES DE CLÉS ÉTRANGÈRES
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

-- 3. CRÉATION DES INDEX
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

-- 4. ACTIVATION DE RLS
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

-- 5. CRÉATION DES POLITIQUES RLS SIMPLIFIÉES
-- =====================================================

-- Supprimer les anciennes politiques si elles existent (sans erreur si elles n'existent pas)
DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Pros can view their appointments" ON public.appointments;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️  Politique "Pros can view their appointments" non trouvée';
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Proprios can view their appointments" ON public.appointments;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️  Politique "Proprios can view their appointments" non trouvée';
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Pros can update their appointments" ON public.appointments;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️  Politique "Pros can update their appointments" non trouvée';
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Proprios can create appointments" ON public.appointments;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️  Politique "Proprios can create appointments" non trouvée';
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Proprios can update their appointments" ON public.appointments;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️  Politique "Proprios can update their appointments" non trouvée';
    END;
END $$;

-- Créer les politiques RLS de manière sécurisée
DO $$
BEGIN
    -- Politiques de lecture (SELECT)
    BEGIN
        CREATE POLICY "Pros can view their appointments" ON public.appointments
            FOR SELECT USING (pro_id = auth.uid());
        RAISE NOTICE '✅ Politique SELECT pour les pros créée';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️  Politique SELECT pour les pros existe déjà';
    END;

    BEGIN
        CREATE POLICY "Proprios can view their appointments" ON public.appointments
            FOR SELECT USING (proprio_id = auth.uid());
        RAISE NOTICE '✅ Politique SELECT pour les propriétaires créée';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️  Politique SELECT pour les propriétaires existe déjà';
    END;

    -- Politiques de création (INSERT)
    BEGIN
        CREATE POLICY "Proprios can create appointments" ON public.appointments
            FOR INSERT WITH CHECK (proprio_id = auth.uid());
        RAISE NOTICE '✅ Politique INSERT pour les propriétaires créée';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️  Politique INSERT pour les propriétaires existe déjà';
    END;

    -- Politiques de mise à jour (UPDATE)
    BEGIN
        CREATE POLICY "Pros can update their appointments" ON public.appointments
            FOR UPDATE USING (pro_id = auth.uid());
        RAISE NOTICE '✅ Politique UPDATE pour les pros créée';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️  Politique UPDATE pour les pros existe déjà';
    END;

    BEGIN
        CREATE POLICY "Proprios can update their appointments" ON public.appointments
            FOR UPDATE USING (proprio_id = auth.uid());
        RAISE NOTICE '✅ Politique UPDATE pour les propriétaires créée';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️  Politique UPDATE pour les propriétaires existe déjà';
    END;
END $$;

-- 6. CRÉATION DU TRIGGER POUR updated_at
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

-- 7. COMMENTAIRES POUR LA DOCUMENTATION
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

-- 8. MESSAGE DE SUCCÈS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 TABLE APPOINTMENTS CONFIGURÉE AVEC SUCCÈS !';
    RAISE NOTICE '✅ Structure de la table créée';
    RAISE NOTICE '✅ Contraintes de clés étrangères ajoutées';
    RAISE NOTICE '✅ Index de performance créés';
    RAISE NOTICE '✅ RLS activé et politiques configurées';
    RAISE NOTICE '✅ Trigger updated_at configuré';
    RAISE NOTICE '🚀 Le système de rendez-vous est prêt à l''utilisation !';
END $$;
