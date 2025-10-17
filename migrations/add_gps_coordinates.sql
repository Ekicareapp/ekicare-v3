-- Ajouter les colonnes pour les coordonnées GPS exactes des établissements
-- Ces coordonnées sont capturées via Google Places API quand le PROPRIO sélectionne un établissement

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS address_lat DECIMAL(10, 8), -- Latitude (précision de 8 décimales)
ADD COLUMN IF NOT EXISTS address_lng DECIMAL(11, 8); -- Longitude (précision de 8 décimales)

-- Ajouter des commentaires pour expliquer l'utilisation
COMMENT ON COLUMN appointments.address_lat IS 'Latitude GPS exacte de l''établissement sélectionné via Google Places API';
COMMENT ON COLUMN appointments.address_lng IS 'Longitude GPS exacte de l''établissement sélectionné via Google Places API';

-- Créer un index pour optimiser les requêtes géographiques
CREATE INDEX IF NOT EXISTS idx_appointments_gps_coordinates 
ON appointments (address_lat, address_lng) 
WHERE address_lat IS NOT NULL AND address_lng IS NOT NULL;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('address_lat', 'address_lng')
ORDER BY column_name;












