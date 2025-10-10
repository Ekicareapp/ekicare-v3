-- =====================================================
-- DÉSACTIVER TEMPORAIREMENT RLS POUR APPOINTMENTS
-- =====================================================
-- Ce script désactive RLS pour permettre aux PRO de voir leurs rendez-vous
-- ATTENTION: À réactiver après les tests !
-- =====================================================

-- Désactiver RLS temporairement
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- Vérifier que RLS est désactivé
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'appointments';

SELECT '⚠️ RLS DÉSACTIVÉ TEMPORAIREMENT POUR APPOINTMENTS !' as message;
SELECT '⚠️ N\'OUBLIEZ PAS DE LE RÉACTIVER APRÈS LES TESTS !' as warning;
