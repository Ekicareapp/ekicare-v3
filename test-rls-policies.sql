-- ============================================================================
-- SCRIPT DE TEST DES POLICIES RLS
-- ============================================================================
-- Ce script permet de tester les policies RLS configurées sur Ekicare
-- ⚠️ À exécuter APRÈS avoir activé RLS et créé les policies
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION DE L'ÉTAT RLS
-- ============================================================================

\echo '============================================================================'
\echo '1. VÉRIFICATION DE L''ÉTAT RLS'
\echo '============================================================================'

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ACTIVÉ'
    ELSE '❌ RLS DÉSACTIVÉ'
  END as statut_rls
FROM pg_tables
WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles')
ORDER BY tablename;

-- ============================================================================
-- 2. LISTE DES POLICIES PRÉSENTES
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo '2. LISTE DES POLICIES PRÉSENTES'
\echo '============================================================================'

SELECT 
  tablename as "Table",
  policyname as "Policy",
  cmd as "Commande",
  CASE 
    WHEN roles = '{authenticated}' THEN 'Authenticated'
    WHEN roles = '{anon}' THEN 'Anonymous'
    ELSE array_to_string(roles, ', ')
  END as "Rôles"
FROM pg_policies
WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- 3. COMPTAGE DES POLICIES PAR TABLE
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo '3. COMPTAGE DES POLICIES PAR TABLE'
\echo '============================================================================'

SELECT 
  tablename as "Table",
  COUNT(*) as "Nombre de policies",
  CASE 
    WHEN tablename = 'appointments' AND COUNT(*) = 7 THEN '✅ OK'
    WHEN tablename = 'pro_profiles' AND COUNT(*) >= 3 THEN '✅ OK'
    WHEN tablename = 'proprio_profiles' AND COUNT(*) = 3 THEN '✅ OK'
    ELSE '⚠️ À vérifier'
  END as "Statut"
FROM pg_policies
WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 4. DÉTAILS DES POLICIES POUR APPOINTMENTS
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo '4. DÉTAILS DES POLICIES POUR APPOINTMENTS'
\echo '============================================================================'

SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  CASE 
    WHEN qual IS NOT NULL THEN '✅ USING clause'
    ELSE '❌ No USING'
  END as "Using",
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ WITH CHECK clause'
    ELSE '—'
  END as "With Check"
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY cmd, policyname;

-- ============================================================================
-- 5. DÉTAILS DES POLICIES POUR PRO_PROFILES
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo '5. DÉTAILS DES POLICIES POUR PRO_PROFILES'
\echo '============================================================================'

SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  CASE 
    WHEN qual IS NOT NULL THEN '✅ USING clause'
    ELSE '❌ No USING'
  END as "Using",
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ WITH CHECK clause'
    ELSE '—'
  END as "With Check"
FROM pg_policies
WHERE tablename = 'pro_profiles'
ORDER BY cmd, policyname;

-- ============================================================================
-- 6. DÉTAILS DES POLICIES POUR PROPRIO_PROFILES
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo '6. DÉTAILS DES POLICIES POUR PROPRIO_PROFILES'
\echo '============================================================================'

SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  CASE 
    WHEN qual IS NOT NULL THEN '✅ USING clause'
    ELSE '❌ No USING'
  END as "Using",
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ WITH CHECK clause'
    ELSE '—'
  END as "With Check"
FROM pg_policies
WHERE tablename = 'proprio_profiles'
ORDER BY cmd, policyname;

-- ============================================================================
-- 7. VÉRIFICATION DES POLICIES MANQUANTES
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo '7. VÉRIFICATION DES POLICIES ESSENTIELLES'
\echo '============================================================================'

WITH required_policies AS (
  SELECT 'appointments' as tablename, 'Proprios can create appointments' as policyname, 'INSERT' as cmd
  UNION ALL SELECT 'appointments', 'Proprios can view their appointments', 'SELECT'
  UNION ALL SELECT 'appointments', 'Pros can view their appointments', 'SELECT'
  UNION ALL SELECT 'appointments', 'Proprios can update their appointments', 'UPDATE'
  UNION ALL SELECT 'appointments', 'Pros can update their appointments', 'UPDATE'
  UNION ALL SELECT 'pro_profiles', 'Pros can view their own profile', 'SELECT'
  UNION ALL SELECT 'pro_profiles', 'Pros can update their own profile', 'UPDATE'
  UNION ALL SELECT 'pro_profiles', 'Proprios can view verified and subscribed pros', 'SELECT'
  UNION ALL SELECT 'proprio_profiles', 'Proprios can view their own profile', 'SELECT'
  UNION ALL SELECT 'proprio_profiles', 'Proprios can update their own profile', 'UPDATE'
  UNION ALL SELECT 'proprio_profiles', 'Pros can view proprio profiles for their appointments', 'SELECT'
)
SELECT 
  rp.tablename as "Table",
  rp.policyname as "Policy",
  rp.cmd as "Command",
  CASE 
    WHEN pp.policyname IS NOT NULL THEN '✅ Présente'
    ELSE '❌ MANQUANTE'
  END as "Statut"
FROM required_policies rp
LEFT JOIN pg_policies pp 
  ON rp.tablename = pp.tablename 
  AND rp.policyname = pp.policyname
ORDER BY rp.tablename, rp.cmd, rp.policyname;

-- ============================================================================
-- 8. RÉSUMÉ FINAL
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo '8. RÉSUMÉ FINAL'
\echo '============================================================================'

SELECT 
  '✅ RLS activé sur toutes les tables' as "Résultat"
WHERE (
  SELECT COUNT(*) 
  FROM pg_tables 
  WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles')
  AND rowsecurity = true
) = 3

UNION ALL

SELECT 
  '✅ Toutes les policies essentielles sont présentes'
WHERE (
  SELECT COUNT(*) 
  FROM pg_policies 
  WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles')
) >= 13

UNION ALL

SELECT 
  '⚠️ Des policies essentielles sont manquantes'
WHERE (
  SELECT COUNT(*) 
  FROM pg_policies 
  WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles')
) < 13

UNION ALL

SELECT 
  '❌ RLS n''est pas activé sur toutes les tables'
WHERE (
  SELECT COUNT(*) 
  FROM pg_tables 
  WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles')
  AND rowsecurity = true
) < 3;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Si vous voyez des ❌ dans les résultats :
-- 1. Réexécutez le script reactivate-rls-and-policies.sql
-- 2. Vérifiez qu'il n'y a pas d'erreurs SQL
-- 3. Contactez le support si le problème persiste
--
-- ============================================================================







