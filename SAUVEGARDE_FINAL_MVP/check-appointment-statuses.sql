-- Vérifier les statuts autorisés pour la table appointments

-- 1. Voir la contrainte de statut
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass 
AND conname LIKE '%status%';

-- 2. Voir les statuts actuellement utilisés
SELECT 
    status,
    COUNT(*) as count
FROM appointments 
GROUP BY status
ORDER BY status;

-- 3. Voir les rendez-vous passés avec leurs statuts actuels
SELECT 
    id,
    main_slot,
    status,
    LEFT(comment, 40) as comment_court
FROM appointments 
WHERE main_slot < NOW()
ORDER BY main_slot DESC
LIMIT 10;
