-- Ajouter la colonne address à la table appointments
-- Cette colonne stockera l'adresse exacte du rendez-vous

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Ajouter un commentaire pour clarifier l'usage
COMMENT ON COLUMN appointments.address IS 'Adresse exacte où se déroule le rendez-vous (saisie par le propriétaire)';

-- Optionnel : Ajouter un index pour les recherches par adresse si nécessaire
-- CREATE INDEX IF NOT EXISTS idx_appointments_address ON appointments USING gin(to_tsvector('french', address));





