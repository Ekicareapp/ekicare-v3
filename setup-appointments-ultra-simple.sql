-- =====================================================
-- SCRIPT ULTRA SIMPLE POUR LA TABLE APPOINTMENTS
-- =====================================================
-- Version sans aucune référence problématique
-- =====================================================

-- 1. CRÉER LA TABLE COMPLÈTE EN UNE FOIS
-- =====================================================

DROP TABLE IF EXISTS public.appointments CASCADE;

CREATE TABLE public.appointments (
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

-- 2. AJOUTER LES CONTRAINTES DE CLÉS ÉTRANGÈRES
-- =====================================================

ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_pro_id 
FOREIGN KEY (pro_id) REFERENCES public.pro_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_proprio_id 
FOREIGN KEY (proprio_id) REFERENCES public.proprio_profiles(user_id) ON DELETE CASCADE;

-- 3. CRÉER LES INDEX
-- =====================================================

CREATE INDEX idx_appointments_pro_id ON public.appointments(pro_id);
CREATE INDEX idx_appointments_proprio_id ON public.appointments(proprio_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_main_slot ON public.appointments(main_slot);
CREATE INDEX idx_appointments_created_at ON public.appointments(created_at);
CREATE INDEX idx_appointments_equide_ids ON public.appointments USING GIN(equide_ids);

-- 4. ACTIVER RLS
-- =====================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 5. CRÉER LES POLITIQUES RLS
-- =====================================================

-- Politiques de lecture (SELECT)
CREATE POLICY "Pros can view their appointments" ON public.appointments
    FOR SELECT USING (pro_id = auth.uid());

CREATE POLICY "Proprios can view their appointments" ON public.appointments
    FOR SELECT USING (proprio_id = auth.uid());

-- Politiques de création (INSERT)
CREATE POLICY "Proprios can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (proprio_id = auth.uid());

-- Politiques de mise à jour (UPDATE)
CREATE POLICY "Pros can update their appointments" ON public.appointments
    FOR UPDATE USING (pro_id = auth.uid());

CREATE POLICY "Proprios can update their appointments" ON public.appointments
    FOR UPDATE USING (proprio_id = auth.uid());

-- 6. CRÉER LE TRIGGER POUR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON public.appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. COMMENTAIRES
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

SELECT '🎉 TABLE APPOINTMENTS CRÉÉE AVEC SUCCÈS !' as message;
