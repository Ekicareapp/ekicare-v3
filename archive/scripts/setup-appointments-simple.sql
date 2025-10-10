-- Script simplifié pour créer la table appointments
-- À exécuter directement dans l'éditeur SQL de Supabase

-- Supprimer la table si elle existe (pour un reset complet)
DROP TABLE IF EXISTS appointments CASCADE;

-- Créer la table appointments
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

-- Créer les index
CREATE INDEX idx_appointments_pro_id ON appointments(pro_id);
CREATE INDEX idx_appointments_proprio_id ON appointments(proprio_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_main_slot ON appointments(main_slot);

-- Activer RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
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
