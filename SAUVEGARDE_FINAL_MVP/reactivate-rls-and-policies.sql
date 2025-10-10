-- ============================================================================
-- RÉACTIVATION RLS ET POLICIES DE SÉCURITÉ POUR EKICARE
-- ============================================================================
-- Ce script réactive la Row Level Security et configure toutes les policies
-- nécessaires pour sécuriser l'accès aux données.
-- ============================================================================

-- ============================================================================
-- 1. RÉACTIVER RLS SUR LA TABLE APPOINTMENTS
-- ============================================================================

-- Activer RLS sur la table appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Proprios can create appointments" ON appointments;
DROP POLICY IF EXISTS "Proprios can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Pros can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Proprios can update their appointments" ON appointments;
DROP POLICY IF EXISTS "Pros can update their appointments" ON appointments;
DROP POLICY IF EXISTS "Proprios can delete their appointments" ON appointments;
DROP POLICY IF EXISTS "Pros can delete their appointments" ON appointments;

-- ============================================================================
-- 2. POLICIES POUR LA TABLE APPOINTMENTS
-- ============================================================================

-- Policy 1: Les propriétaires peuvent CRÉER des rendez-vous
CREATE POLICY "Proprios can create appointments"
ON appointments
FOR INSERT
TO authenticated
WITH CHECK (
  -- L'utilisateur doit être authentifié
  auth.uid() IS NOT NULL
  AND
  -- Le proprio_id doit correspondre à l'utilisateur connecté
  proprio_id = auth.uid()
  AND
  -- L'utilisateur doit avoir le rôle PROPRIETAIRE
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'PROPRIETAIRE'
  )
);

-- Policy 2: Les propriétaires peuvent VOIR leurs rendez-vous
CREATE POLICY "Proprios can view their appointments"
ON appointments
FOR SELECT
TO authenticated
USING (
  -- L'utilisateur est le propriétaire du rendez-vous
  proprio_id = auth.uid()
  AND
  -- L'utilisateur a le rôle PROPRIETAIRE
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'PROPRIETAIRE'
  )
);

-- Policy 3: Les professionnels peuvent VOIR leurs rendez-vous
CREATE POLICY "Pros can view their appointments"
ON appointments
FOR SELECT
TO authenticated
USING (
  -- L'utilisateur est le pro du rendez-vous (via pro_profiles)
  pro_id IN (
    SELECT id FROM pro_profiles
    WHERE user_id = auth.uid()
  )
  AND
  -- L'utilisateur a le rôle PRO
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'PRO'
  )
);

-- Policy 4: Les propriétaires peuvent MODIFIER leurs rendez-vous
CREATE POLICY "Proprios can update their appointments"
ON appointments
FOR UPDATE
TO authenticated
USING (
  proprio_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'PROPRIETAIRE'
  )
)
WITH CHECK (
  proprio_id = auth.uid()
);

-- Policy 5: Les professionnels peuvent MODIFIER leurs rendez-vous
CREATE POLICY "Pros can update their appointments"
ON appointments
FOR UPDATE
TO authenticated
USING (
  pro_id IN (
    SELECT id FROM pro_profiles
    WHERE user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'PRO'
  )
)
WITH CHECK (
  pro_id IN (
    SELECT id FROM pro_profiles
    WHERE user_id = auth.uid()
  )
);

-- Policy 6: Les propriétaires peuvent SUPPRIMER leurs rendez-vous
CREATE POLICY "Proprios can delete their appointments"
ON appointments
FOR DELETE
TO authenticated
USING (
  proprio_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'PROPRIETAIRE'
  )
);

-- Policy 7: Les professionnels peuvent SUPPRIMER leurs rendez-vous (facultatif)
CREATE POLICY "Pros can delete their appointments"
ON appointments
FOR DELETE
TO authenticated
USING (
  pro_id IN (
    SELECT id FROM pro_profiles
    WHERE user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'PRO'
  )
);

-- ============================================================================
-- 3. RLS ET POLICIES POUR LA TABLE PRO_PROFILES
-- ============================================================================

-- Activer RLS sur pro_profiles
ALTER TABLE pro_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Pros can view their own profile" ON pro_profiles;
DROP POLICY IF EXISTS "Pros can update their own profile" ON pro_profiles;
DROP POLICY IF EXISTS "Public can view verified and subscribed pros" ON pro_profiles;
DROP POLICY IF EXISTS "Proprios can view verified and subscribed pros" ON pro_profiles;

-- Policy 1: Les pros peuvent VOIR leur propre profil
CREATE POLICY "Pros can view their own profile"
ON pro_profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'PRO'
  )
);

-- Policy 2: Les pros peuvent MODIFIER leur propre profil
CREATE POLICY "Pros can update their own profile"
ON pro_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 3: Les propriétaires peuvent VOIR les profils pros vérifiés et abonnés
CREATE POLICY "Proprios can view verified and subscribed pros"
ON pro_profiles
FOR SELECT
TO authenticated
USING (
  is_verified = true
  AND
  is_subscribed = true
  AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'PROPRIETAIRE'
  )
);

-- Policy 4: Le public (non authentifié) peut VOIR les profils pros vérifiés et abonnés
-- NOTE: Décommenter cette policy si vous voulez permettre l'accès public
-- CREATE POLICY "Public can view verified and subscribed pros"
-- ON pro_profiles
-- FOR SELECT
-- TO anon
-- USING (
--   is_verified = true
--   AND
--   is_subscribed = true
-- );

-- ============================================================================
-- 4. RLS ET POLICIES POUR LA TABLE PROPRIO_PROFILES
-- ============================================================================

-- Activer RLS sur proprio_profiles
ALTER TABLE proprio_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Proprios can view their own profile" ON proprio_profiles;
DROP POLICY IF EXISTS "Proprios can update their own profile" ON proprio_profiles;
DROP POLICY IF EXISTS "Pros can view proprio profiles for their appointments" ON proprio_profiles;

-- Policy 1: Les propriétaires peuvent VOIR leur propre profil
CREATE POLICY "Proprios can view their own profile"
ON proprio_profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'PROPRIETAIRE'
  )
);

-- Policy 2: Les propriétaires peuvent MODIFIER leur propre profil
CREATE POLICY "Proprios can update their own profile"
ON proprio_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 3: Les pros peuvent VOIR les profils des propriétaires avec qui ils ont des rendez-vous
CREATE POLICY "Pros can view proprio profiles for their appointments"
ON proprio_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'PRO'
  )
  AND
  user_id IN (
    SELECT proprio_id FROM appointments
    WHERE pro_id IN (
      SELECT id FROM pro_profiles
      WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 5. VÉRIFICATION DES POLICIES
-- ============================================================================

-- Afficher toutes les policies de la table appointments
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

-- ============================================================================
-- 6. VÉRIFICATION DE L'ÉTAT RLS
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('appointments', 'pro_profiles', 'proprio_profiles');

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- 1. RLS est maintenant activé sur les 3 tables principales
-- 2. Chaque utilisateur ne peut voir/modifier que ses propres données
-- 3. Les propriétaires peuvent créer des rendez-vous uniquement pour eux-mêmes
-- 4. Les pros peuvent voir les profils des proprios avec qui ils ont des RDV
-- 5. Les proprios peuvent voir les pros vérifiés et abonnés pour la recherche
-- 6. Aucune donnée n'est accessible publiquement (sauf si décommenté)
--
-- ============================================================================






