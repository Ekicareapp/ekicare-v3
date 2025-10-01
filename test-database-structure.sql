-- Script de test pour vérifier la structure de la base de données Ekicare
-- et les RLS policies

-- ========================================
-- 1. VÉRIFICATION DE LA STRUCTURE DES TABLES
-- ========================================

SELECT 
    'STRUCTURE DES TABLES' as test_section,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'proprio_profiles', 'pro_profiles', 'equides', 'appointments')
ORDER BY table_name, ordinal_position;

-- ========================================
-- 2. VÉRIFICATION DES RLS POLICIES
-- ========================================

SELECT 
    'RLS POLICIES' as test_section,
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    permissive as policy_type,
    roles
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'proprio_profiles', 'pro_profiles', 'equides', 'appointments')
ORDER BY tablename, policyname;

-- ========================================
-- 3. VÉRIFICATION DES CONTRAINTES DE CLÉS ÉTRANGÈRES
-- ========================================

SELECT 
    'FOREIGN KEY CONSTRAINTS' as test_section,
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
ORDER BY tc.table_name;

-- ========================================
-- 4. VÉRIFICATION DES INDEX DE PERFORMANCE
-- ========================================

SELECT 
    'PERFORMANCE INDEXES' as test_section,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ========================================
-- 5. VÉRIFICATION DES CONTRAINTES DE VALIDATION
-- ========================================

SELECT 
    'VALIDATION CONSTRAINTS' as test_section,
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition,
    relname as table_name
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE contype = 'c' AND n.nspname = 'public'
ORDER BY table_name, constraint_name;

-- ========================================
-- 6. VÉRIFICATION DES TRIGGERS
-- ========================================

SELECT 
    'TRIGGERS' as test_section,
    event_object_schema as schemaname,
    event_object_table as tablename,
    trigger_name,
    event_manipulation as event,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY tablename, trigger_name;

-- ========================================
-- 7. VÉRIFICATION DU STATUT RLS
-- ========================================

SELECT 
    'RLS STATUS' as test_section,
    schemaname,
    tablename,
    CASE
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('users', 'proprio_profiles', 'pro_profiles', 'equides', 'appointments')
ORDER BY tablename;

-- ========================================
-- 8. TEST DE CRÉATION D'UTILISATEURS DE TEST
-- ========================================

-- Créer des utilisateurs de test pour vérifier les RLS policies
-- (À exécuter seulement si vous voulez tester avec des données réelles)

/*
-- Test 1: Créer un propriétaire de test
INSERT INTO users (id, email, role) 
VALUES ('test-proprio-123', 'test-proprio@ekicare.com', 'PROPRIETAIRE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO proprio_profiles (user_id, prenom, nom, telephone, adresse)
VALUES ('test-proprio-123', 'Jean', 'Dupont', '0612345678', '123 Rue de la Paix')
ON CONFLICT (user_id) DO NOTHING;

-- Test 2: Créer un professionnel de test
INSERT INTO users (id, email, role) 
VALUES ('test-pro-123', 'test-pro@ekicare.com', 'PRO')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pro_profiles (user_id, prenom, nom, telephone, profession, ville_nom, ville_lat, ville_lng, rayon_km, siret, is_verified, is_subscribed)
VALUES ('test-pro-123', 'Marie', 'Martin', '0698765432', 'Vétérinaire équin', 'Paris', 48.8566, 2.3522, 50, '12345678901234', true, true)
ON CONFLICT (user_id) DO NOTHING;

-- Test 3: Créer des équidés de test
INSERT INTO equides (id, proprio_id, nom, age, sexe, race, robe, description)
VALUES 
    ('equide-1', 'test-proprio-123', 'Bella', 8, 'Jument', 'Pur-sang', 'Bai', 'Jument calme et docile'),
    ('equide-2', 'test-proprio-123', 'Thunder', 12, 'Hongre', 'Quarter Horse', 'Noir', 'Cheval énergique et sportif')
ON CONFLICT (id) DO NOTHING;

-- Test 4: Créer des rendez-vous de test
INSERT INTO appointments (id, proprio_id, pro_id, equide_id, type, date, heure, statut, lieu, message)
VALUES 
    ('rdv-1', 'test-proprio-123', 'test-pro-123', 'equide-1', 'Vaccination', '2024-02-15', '14:00', 'A_VENIR', 'Écurie de la Paix', 'Vaccination annuelle'),
    ('rdv-2', 'test-proprio-123', 'test-pro-123', 'equide-2', 'Dentisterie', '2024-02-20', '10:00', 'A_VENIR', 'Écurie de la Paix', 'Contrôle dentaire')
ON CONFLICT (id) DO NOTHING;
*/

-- ========================================
-- 9. VÉRIFICATION DES DONNÉES DE TEST
-- ========================================

-- Compter les utilisateurs par rôle
SELECT 
    'USER COUNT BY ROLE' as test_section,
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- Compter les profils
SELECT 
    'PROFILE COUNT' as test_section,
    'proprio_profiles' as table_name,
    COUNT(*) as count
FROM proprio_profiles
UNION ALL
SELECT 
    'PROFILE COUNT' as test_section,
    'pro_profiles' as table_name,
    COUNT(*) as count
FROM pro_profiles;

-- Compter les équidés et rendez-vous
SELECT 
    'DATA COUNT' as test_section,
    'equides' as table_name,
    COUNT(*) as count
FROM equides
UNION ALL
SELECT 
    'DATA COUNT' as test_section,
    'appointments' as table_name,
    COUNT(*) as count
FROM appointments;

-- ========================================
-- 10. RÉSUMÉ DE VÉRIFICATION
-- ========================================

WITH verification_summary AS (
    SELECT
        'RLS Enabled' as check_name,
        COUNT(*) as count,
        CASE WHEN COUNT(*) = 5 THEN '✅ ALL ENABLED' ELSE '❌ SOME DISABLED' END as status
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('users', 'proprio_profiles', 'pro_profiles', 'equides', 'appointments')
    AND rowsecurity = TRUE

    UNION ALL

    SELECT
        'RLS Policies' as check_name,
        COUNT(*) as count,
        CASE WHEN COUNT(*) >= 10 THEN '✅ SUFFICIENT' ELSE '❌ INSUFFICIENT' END as status
    FROM pg_policies
    WHERE schemaname = 'public'

    UNION ALL

    SELECT
        'Foreign Key Constraints' as check_name,
        COUNT(*) as count,
        CASE WHEN COUNT(*) >= 5 THEN '✅ SUFFICIENT' ELSE '❌ INSUFFICIENT' END as status
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'

    UNION ALL

    SELECT
        'Performance Indexes' as check_name,
        COUNT(*) as count,
        CASE WHEN COUNT(*) >= 15 THEN '✅ SUFFICIENT' ELSE '❌ INSUFFICIENT' END as status
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
)
SELECT 
    'FINAL VERIFICATION SUMMARY' as section,
    check_name,
    count,
    status
FROM verification_summary
ORDER BY check_name;

-- ========================================
-- 11. RECOMMANDATIONS FINALES
-- ========================================

SELECT 
    'FINAL RECOMMENDATIONS' as section,
    '1. Vérifiez que tous les tests de sécurité passent' as recommendation
UNION ALL
SELECT 
    'FINAL RECOMMENDATIONS' as section,
    '2. Testez l''isolation des données avec différents utilisateurs' as recommendation
UNION ALL
SELECT 
    'FINAL RECOMMENDATIONS' as section,
    '3. Vérifiez les performances avec des données de test' as recommendation
UNION ALL
SELECT 
    'FINAL RECOMMENDATIONS' as section,
    '4. Configurez les sauvegardes automatiques' as recommendation
UNION ALL
SELECT 
    'FINAL RECOMMENDATIONS' as section,
    '5. Surveillez les logs d''accès régulièrement' as recommendation;
