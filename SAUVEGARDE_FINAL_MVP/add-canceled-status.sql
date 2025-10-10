-- Ajouter le nouveau statut 'canceled' à la table appointments

-- 1. Voir la contrainte actuelle
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass 
AND conname LIKE '%status%';

-- 2. Supprimer l'ancienne contrainte (si elle existe)
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- 3. Ajouter la nouvelle contrainte avec le statut 'canceled'
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'rejected', 'rescheduled', 'completed', 'canceled'));

-- 4. Vérifier que la contrainte a été ajoutée
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass 
AND conname LIKE '%status%';

-- 5. Tester en essayant d'insérer un rendez-vous avec le nouveau statut
-- (Cette ligne va échouer mais c'est normal, c'est juste pour tester la contrainte)
-- INSERT INTO appointments (pro_id, proprio_id, equide_ids, main_slot, comment, address, status) 
-- VALUES ('test', 'test', '["test"]', NOW(), 'Test', 'Test', 'canceled');

-- 6. Voir tous les statuts actuellement utilisés
SELECT 
    status,
    COUNT(*) as count
FROM appointments 
GROUP BY status
ORDER BY status;
