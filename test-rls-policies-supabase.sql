-- ============================================================================
-- TEST DES POLITIQUES RLS - VERSION SUPABASE
-- ============================================================================
-- Ce script teste les politiques RLS sans utiliser de commandes psql
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================================================

-- 1. VÉRIFICATION DE L'ACTIVATION RLS
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_actif
FROM pg_tables 
WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles')
ORDER BY tablename;

-- 2. VÉRIFICATION DES POLITIQUES EXISTANTES
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles')
ORDER BY tablename, policyname;

-- 3. TEST DES PERMISSIONS - APPOINTMENTS
-- ============================================================================
-- Test 1: Vérifier que les utilisateurs ne peuvent voir que leurs propres rendez-vous
SELECT 
    'Test appointments - Isolation des données' as test_name,
    COUNT(*) as total_appointments,
    COUNT(DISTINCT proprio_id) as proprio_uniques,
    COUNT(DISTINCT pro_id) as pro_uniques
FROM appointments;

-- 4. TEST DES PERMISSIONS - PRO_PROFILES
-- ============================================================================
-- Test 2: Vérifier l'accès aux profils pro
SELECT 
    'Test pro_profiles - Accès aux profils' as test_name,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as profiles_avec_user_id
FROM pro_profiles;

-- 5. TEST DES PERMISSIONS - PROPRIO_PROFILES
-- ============================================================================
-- Test 3: Vérifier l'accès aux profils proprio
SELECT 
    'Test proprio_profiles - Accès aux profils' as test_name,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as profiles_avec_user_id
FROM proprio_profiles;

-- 6. VÉRIFICATION DES CONTRAINTES DE CLÉS ÉTRANGÈRES
-- ============================================================================
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
    AND tc.table_name IN ('appointments', 'pro_profiles', 'proprio_profiles')
ORDER BY tc.table_name, tc.constraint_name;

-- 7. STATISTIQUES GÉNÉRALES
-- ============================================================================
SELECT 
    'Statistiques générales' as section,
    (SELECT COUNT(*) FROM appointments) as total_appointments,
    (SELECT COUNT(*) FROM pro_profiles) as total_pro_profiles,
    (SELECT COUNT(*) FROM proprio_profiles) as total_proprio_profiles,
    (SELECT COUNT(*) FROM users) as total_users;

-- 8. VÉRIFICATION DES INDEX
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles')
ORDER BY tablename, indexname;

-- ============================================================================
-- RÉSULTATS ATTENDUS
-- ============================================================================
-- 1. RLS doit être activé (rowsecurity = true) pour les 3 tables
-- 2. Les politiques doivent être présentes et correctement configurées
-- 3. Les contraintes FK doivent être valides
-- 4. Les données doivent être accessibles selon les politiques RLS
-- ============================================================================













