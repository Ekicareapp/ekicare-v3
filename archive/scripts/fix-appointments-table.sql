-- Script pour créer/corriger la table appointments
-- À exécuter dans l'éditeur SQL de Supabase

-- Supprimer la table si elle existe (pour un reset complet)
DROP TABLE IF EXISTS appointments CASCADE;

-- Créer la table appointments avec la structure complète
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relations
  pro_id UUID NOT NULL,
  proprio_id UUID NOT NULL,
  equide_ids UUID[] NOT NULL,
  
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

-- Ajouter les contraintes de clés étrangères
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_pro_id 
FOREIGN KEY (pro_id) REFERENCES pro_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_proprio_id 
FOREIGN KEY (proprio_id) REFERENCES proprio_profiles(user_id) ON DELETE CASCADE;

-- Créer les index pour les performances
CREATE INDEX idx_appointments_pro_id ON appointments(pro_id);
CREATE INDEX idx_appointments_proprio_id ON appointments(proprio_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_main_slot ON appointments(main_slot);
CREATE INDEX idx_appointments_created_at ON appointments(created_at);

-- Index pour les recherches par équidés
CREATE INDEX idx_appointments_equide_ids ON appointments USING GIN(equide_ids);

-- Activer RLS (Row Level Security)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour la sécurité
CREATE POLICY "Pros can view their appointments" ON appointments
  FOR SELECT USING (pro_id = auth.uid());

CREATE POLICY "Proprios can view their appointments" ON appointments
  FOR SELECT USING (proprio_id = auth.uid());

CREATE POLICY "Pros can update their appointments" ON appointments
  FOR UPDATE USING (pro_id = auth.uid());

CREATE POLICY "Proprios can create appointments" ON appointments
  FOR INSERT WITH CHECK (proprio_id = auth.uid());

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
