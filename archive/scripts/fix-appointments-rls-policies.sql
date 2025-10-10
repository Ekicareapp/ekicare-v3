-- =====================================================
-- FIX DES POLITIQUES RLS POUR APPOINTMENTS
-- =====================================================
-- Ce script corrige les politiques RLS pour qu'elles fonctionnent
-- avec la structure actuelle de la base de données
-- =====================================================

-- 1. SUPPRIMER LES ANCIENNES POLITIQUES
-- =====================================================

DROP POLICY IF EXISTS "Pros can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Proprios can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Proprios can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Pros can update their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Proprios can update their appointments" ON public.appointments;

-- 2. CRÉER LES NOUVELLES POLITIQUES RLS
-- =====================================================

-- Politiques de lecture (SELECT)
-- Pour les PROPRIO: proprio_id = auth.uid() (car proprio_id est le user_id)
CREATE POLICY "Proprios can view their appointments" 
ON public.appointments
FOR SELECT 
USING (proprio_id = auth.uid());

-- Pour les PRO: pro_id doit correspondre à l'ID du profil pro de l'utilisateur connecté
CREATE POLICY "Pros can view their appointments" 
ON public.appointments
FOR SELECT 
USING (
  pro_id IN (
    SELECT id FROM public.pro_profiles WHERE user_id = auth.uid()
  )
);

-- Politiques de création (INSERT)
-- Seuls les PROPRIO peuvent créer des rendez-vous
CREATE POLICY "Proprios can create appointments" 
ON public.appointments
FOR INSERT 
WITH CHECK (proprio_id = auth.uid());

-- Politiques de mise à jour (UPDATE)
-- Les PROPRIO peuvent mettre à jour leurs rendez-vous
CREATE POLICY "Proprios can update their appointments" 
ON public.appointments
FOR UPDATE 
USING (proprio_id = auth.uid());

-- Les PRO peuvent mettre à jour leurs rendez-vous
CREATE POLICY "Pros can update their appointments" 
ON public.appointments
FOR UPDATE 
USING (
  pro_id IN (
    SELECT id FROM public.pro_profiles WHERE user_id = auth.uid()
  )
);

-- 3. VÉRIFICATION
-- =====================================================

SELECT '✅ POLITIQUES RLS MISES À JOUR AVEC SUCCÈS !' as message;

-- Afficher les nouvelles politiques
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'appointments';

