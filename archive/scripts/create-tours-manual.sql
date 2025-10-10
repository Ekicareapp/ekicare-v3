-- Script SQL pour créer manuellement le système de tournées
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer la table tours
CREATE TABLE IF NOT EXISTS public.tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pro_id UUID NOT NULL REFERENCES public.pro_profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ajouter la colonne tour_id dans appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS tour_id UUID REFERENCES public.tours(id) ON DELETE SET NULL;

-- 3. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_tours_pro_id ON public.tours(pro_id);
CREATE INDEX IF NOT EXISTS idx_tours_date ON public.tours(date);
CREATE INDEX IF NOT EXISTS idx_appointments_tour_id ON public.appointments(tour_id);

-- 4. Activer RLS sur la table tours
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- 5. Créer les policies RLS pour tours
CREATE POLICY "Pro can manage own tours"
ON public.tours
FOR ALL
TO authenticated
USING (auth.uid() = pro_id)
WITH CHECK (auth.uid() = pro_id);

-- 6. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_tours_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Trigger pour updated_at sur tours
CREATE TRIGGER update_tours_updated_at 
  BEFORE UPDATE ON public.tours 
  FOR EACH ROW 
  EXECUTE FUNCTION update_tours_updated_at_column();

-- 8. Commentaires pour la documentation
COMMENT ON TABLE public.tours IS 'Table des tournées des professionnels';
COMMENT ON COLUMN public.tours.pro_id IS 'ID du professionnel (référence vers pro_profiles.user_id)';
COMMENT ON COLUMN public.tours.name IS 'Nom de la tournée';
COMMENT ON COLUMN public.tours.date IS 'Date de la tournée';
COMMENT ON COLUMN public.tours.notes IS 'Notes optionnelles sur la tournée';
COMMENT ON COLUMN public.appointments.tour_id IS 'ID de la tournée (référence vers tours.id)';
