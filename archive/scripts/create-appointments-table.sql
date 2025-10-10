-- Création de la table appointments pour le système de rendez-vous
-- Cette table gère tous les rendez-vous entre propriétaires et professionnels

CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relations
  pro_id UUID NOT NULL REFERENCES pro_profiles(user_id) ON DELETE CASCADE,
  proprio_id UUID NOT NULL REFERENCES proprio_profiles(user_id) ON DELETE CASCADE,
  equide_ids UUID[] NOT NULL, -- Tableau des IDs des équidés concernés
  
  -- Informations du rendez-vous
  main_slot TIMESTAMP WITH TIME ZONE NOT NULL, -- Créneau principal
  alternative_slots TIMESTAMP WITH TIME ZONE[], -- Créneaux alternatifs (max 2)
  duration_minutes INTEGER DEFAULT 60, -- Durée en minutes
  
  -- Statut et gestion
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'rescheduled', 'completed')),
  comment TEXT NOT NULL, -- Commentaire obligatoire du propriétaire
  
  -- Compte rendu (après le RDV)
  compte_rendu TEXT, -- Compte rendu du professionnel
  compte_rendu_updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_equide_ids CHECK (array_length(equide_ids, 1) > 0),
  CONSTRAINT valid_alternative_slots CHECK (array_length(alternative_slots, 1) <= 2),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480) -- Max 8h
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_appointments_pro_id ON appointments(pro_id);
CREATE INDEX IF NOT EXISTS idx_appointments_proprio_id ON appointments(proprio_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_main_slot ON appointments(main_slot);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- Index pour les recherches par équidés
CREATE INDEX IF NOT EXISTS idx_appointments_equide_ids ON appointments USING GIN(equide_ids);

-- RLS (Row Level Security)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Politique pour les professionnels : voir leurs rendez-vous
CREATE POLICY "Pros can view their appointments" ON appointments
  FOR SELECT USING (pro_id = auth.uid());

-- Politique pour les propriétaires : voir leurs rendez-vous
CREATE POLICY "Proprios can view their appointments" ON appointments
  FOR SELECT USING (proprio_id = auth.uid());

-- Politique pour les professionnels : modifier leurs rendez-vous
CREATE POLICY "Pros can update their appointments" ON appointments
  FOR UPDATE USING (pro_id = auth.uid());

-- Politique pour les propriétaires : créer leurs rendez-vous
CREATE POLICY "Proprios can create appointments" ON appointments
  FOR INSERT WITH CHECK (proprio_id = auth.uid());

-- Politique pour les propriétaires : modifier leurs rendez-vous (pour les replanifications)
CREATE POLICY "Proprios can update their appointments" ON appointments
  FOR UPDATE USING (proprio_id = auth.uid());

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour le statut en 'completed' automatiquement
CREATE OR REPLACE FUNCTION update_completed_appointments()
RETURNS void AS $$
BEGIN
  UPDATE appointments 
  SET status = 'completed'
  WHERE status = 'confirmed' 
    AND main_slot < NOW() - INTERVAL '1 hour'; -- 1h de marge après l'heure prévue
END;
$$ language 'plpgsql';

-- Commentaires pour la documentation
COMMENT ON TABLE appointments IS 'Table des rendez-vous entre propriétaires et professionnels';
COMMENT ON COLUMN appointments.pro_id IS 'ID du professionnel (référence vers pro_profiles.user_id)';
COMMENT ON COLUMN appointments.proprio_id IS 'ID du propriétaire (référence vers proprio_profiles.user_id)';
COMMENT ON COLUMN appointments.equide_ids IS 'Tableau des IDs des équidés concernés par le rendez-vous';
COMMENT ON COLUMN appointments.main_slot IS 'Créneau principal du rendez-vous';
COMMENT ON COLUMN appointments.alternative_slots IS 'Créneaux alternatifs proposés par le propriétaire (max 2)';
COMMENT ON COLUMN appointments.status IS 'Statut du rendez-vous: pending, confirmed, rejected, rescheduled, completed';
COMMENT ON COLUMN appointments.comment IS 'Commentaire obligatoire du propriétaire expliquant la demande';
COMMENT ON COLUMN appointments.compte_rendu IS 'Compte rendu du professionnel après le rendez-vous';
COMMENT ON COLUMN appointments.duration_minutes IS 'Durée prévue du rendez-vous en minutes (défaut: 60)';
