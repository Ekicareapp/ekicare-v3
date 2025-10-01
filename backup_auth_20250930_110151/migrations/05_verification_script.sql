-- Script de vérification complète de la base de données Ekicare
-- Date: 2024-01-15
-- Description: Vérifier que toutes les sécurités et contraintes sont en place

-- ==============================================
-- 1. VÉRIFICATION DES RLS POLICIES
-- ==============================================

-- Vérifier que RLS est activé sur toutes les tables
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'proprio_profiles', 'pro_profiles', 'equides', 'appointments')
ORDER BY tablename;

-- Vérifier que toutes les policies sont créées
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    permissive as policy_type
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==============================================
-- 2. VÉRIFICATION DES CONTRAINTES DE CLÉS ÉTRANGÈRES
-- ==============================================

-- Vérifier toutes les contraintes de clés étrangères
SELECT 
    'Foreign Keys' as check_type,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN tc.constraint_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
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

-- ==============================================
-- 3. VÉRIFICATION DES INDEX DE PERFORMANCE
-- ==============================================

-- Vérifier que tous les index sont créés
SELECT 
    'Performance Indexes' as check_type,
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ==============================================
-- 4. VÉRIFICATION DES CONTRAINTES DE VALIDATION
-- ==============================================

-- Vérifier les contraintes de validation
SELECT 
    'Validation Constraints' as check_type,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ==============================================
-- 5. VÉRIFICATION DE LA STRUCTURE DES TABLES
-- ==============================================

-- Vérifier la structure de la table users
SELECT 
    'Table Structure - users' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de la table appointments
SELECT 
    'Table Structure - appointments' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de la table equides
SELECT 
    'Table Structure - equides' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'equides' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==============================================
-- 6. VÉRIFICATION DES TRIGGERS
-- ==============================================

-- Vérifier que les triggers sont créés
SELECT 
    'Triggers' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ==============================================
-- 7. TEST DE SÉCURITÉ - ISOLATION DES DONNÉES
-- ==============================================

-- Test d'isolation : Vérifier qu'un utilisateur ne peut pas voir les données d'un autre
-- (Ce test doit être exécuté avec un utilisateur authentifié)

-- Exemple de requête pour tester l'isolation des appointments
-- SELECT 
--     'Security Test - Appointments Isolation' as test_type,
--     COUNT(*) as total_appointments_visible,
--     'Should only show appointments for current user' as expected_behavior
-- FROM appointments;

-- ==============================================
-- 8. STATISTIQUES DE PERFORMANCE
-- ==============================================

-- Statistiques sur les tables
SELECT 
    'Table Statistics' as check_type,
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- ==============================================
-- 9. RÉSUMÉ DE VÉRIFICATION
-- ==============================================

-- Résumé des vérifications
WITH verification_summary AS (
    SELECT 
        'RLS Enabled Tables' as check_name,
        COUNT(*) as count,
        CASE WHEN COUNT(*) = 6 THEN '✅ ALL TABLES' ELSE '❌ INCOMPLETE' END as status
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'proprio_profiles', 'pro_profiles', 'horses', 'appointments', 'logs')
    AND rowsecurity = true
    
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
    check_name,
    count,
    status
FROM verification_summary
ORDER BY check_name;

-- ==============================================
-- 10. RECOMMANDATIONS FINALES
-- ==============================================

-- Afficher les recommandations finales
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
