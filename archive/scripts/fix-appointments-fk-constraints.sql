-- Script pour corriger les contraintes de clé étrangère de la table appointments
-- Date: 2024-01-15

-- Supprimer les anciennes contraintes
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS fk_appointments_proprio_id;

ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS fk_appointments_pro_id;

-- Recréer les contraintes correctes
-- proprio_id doit référencer users.id (l'utilisateur connecté)
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_proprio_id 
FOREIGN KEY (proprio_id) REFERENCES users(id) ON DELETE CASCADE;

-- pro_id doit référencer pro_profiles.id (le profil professionnel)
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_pro_id 
FOREIGN KEY (pro_id) REFERENCES pro_profiles(id) ON DELETE CASCADE;

-- Vérifier les contraintes créées
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'appointments'
ORDER BY tc.table_name;
