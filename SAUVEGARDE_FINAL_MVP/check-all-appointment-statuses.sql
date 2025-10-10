-- Vérification complète des statuts de rendez-vous dans Supabase

-- 1. Voir la contrainte exacte de la table appointments
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass 
AND conname LIKE '%status%';

-- 2. Voir TOUS les statuts actuellement utilisés dans la table
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as premier_rdv,
    MAX(created_at) as dernier_rdv
FROM appointments 
GROUP BY status
ORDER BY status;

-- 3. Voir la structure de la colonne status
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'status';

-- 4. Voir les rendez-vous avec leur statut actuel et leur date
SELECT 
    id,
    main_slot,
    status,
    comment,
    created_at,
    updated_at
FROM appointments 
ORDER BY main_slot DESC
LIMIT 10;

-- 5. Vérifier s'il y a une colonne updated_at
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('updated_at', 'modified_at', 'last_updated');
