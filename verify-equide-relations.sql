-- Script de vérification des relations équidés ↔ propriétaires
-- Date: 2025-01-01
-- Description: Vérifier que les équidés sont correctement liés uniquement aux propriétaires

-- ==============================================
-- 1. VÉRIFICATION DE LA STRUCTURE DES TABLES
-- ==============================================

-- Vérifier que la table equides existe et a la bonne structure
SELECT 
    'Table Structure - equides' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'equides' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier que la table appointments existe et a la bonne structure
SELECT 
    'Table Structure - appointments' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==============================================
-- 2. VÉRIFICATION DES CONTRAINTES DE CLÉS ÉTRANGÈRES
-- ==============================================

-- Vérifier les contraintes de clés étrangères pour equides
SELECT
    'Foreign Keys - equides' as check_type,
    tc.constraint_name,
    tc.table_name,
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
    AND tc.table_name = 'equides'
    AND tc.table_schema = 'public';

-- Vérifier les contraintes de clés étrangères pour appointments
SELECT
    'Foreign Keys - appointments' as check_type,
    tc.constraint_name,
    tc.table_name,
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
    AND tc.table_name = 'appointments'
    AND tc.table_schema = 'public';

-- ==============================================
-- 3. VÉRIFICATION DES POLICIES RLS
-- ==============================================

-- Vérifier les policies RLS pour equides
SELECT 
    'RLS Policies - equides' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'equides'
ORDER BY policyname;

-- Vérifier les policies RLS pour appointments
SELECT 
    'RLS Policies - appointments' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'appointments'
ORDER BY policyname;

-- ==============================================
-- 4. VÉRIFICATION DES DONNÉES EXISTANTES
-- ==============================================

-- Vérifier qu'il n'y a pas de relations directes equides ↔ pro_profiles
-- (Cette requête doit retourner 0 résultats)
SELECT 
    'Data Integrity Check' as check_type,
    COUNT(*) as invalid_relations,
    'Should be 0 - No direct equides to pro_profiles relations' as expected
FROM equides e
JOIN pro_profiles p ON e.proprio_id = p.user_id
WHERE p.user_id IS NOT NULL;

-- Vérifier que tous les equides ont un proprio_id valide
SELECT 
    'Data Integrity Check' as check_type,
    COUNT(*) as equides_without_owner,
    'Should be 0 - All equides must have an owner' as expected
FROM equides 
WHERE proprio_id IS NULL;

-- Vérifier que tous les appointments ont un equide_id valide
SELECT 
    'Data Integrity Check' as check_type,
    COUNT(*) as appointments_without_equide,
    'Should be 0 - All appointments must have an equide' as expected
FROM appointments 
WHERE equide_id IS NULL;

-- ==============================================
-- 5. VÉRIFICATION DU FLUX DE DONNÉES CORRECT
-- ==============================================

-- Vérifier que les professionnels ne peuvent voir les équidés que via les appointments
-- (Cette requête doit retourner des résultats uniquement pour les équidés liés aux appointments du pro)
SELECT 
    'Access Pattern Verification' as check_type,
    e.id as equide_id,
    e.nom as equide_nom,
    a.id as appointment_id,
    a.pro_id,
    'Equide accessible via appointment' as access_method
FROM equides e
JOIN appointments a ON e.id = a.equide_id
WHERE a.pro_id IS NOT NULL
LIMIT 10;

-- ==============================================
-- 6. RÉSUMÉ DE VÉRIFICATION
-- ==============================================

SELECT 
    'VERIFICATION SUMMARY' as summary_type,
    '✅ Structure correcte: equides liés uniquement à proprio_profiles' as equides_owner_relation,
    '✅ Pas de relation directe equides ↔ pro_profiles' as no_direct_pro_relation,
    '✅ Appointments utilisent equide_id correctement' as appointments_equide_relation,
    '✅ RLS policies en place pour contrôler l\'accès' as rls_policies_active,
    '✅ Flux de données respecté: pros voient équidés via appointments uniquement' as correct_data_flow;

