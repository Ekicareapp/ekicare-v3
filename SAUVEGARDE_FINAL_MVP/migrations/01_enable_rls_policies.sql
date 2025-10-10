-- Migration pour activer RLS et créer les policies de sécurité
-- Date: 2024-01-15
-- Description: Sécurisation complète de la base de données Ekicare

-- ==============================================
-- 1. ACTIVATION DE ROW LEVEL SECURITY
-- ==============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equides ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. POLICIES POUR LA TABLE USERS
-- ==============================================

-- Les utilisateurs peuvent voir et modifier leur propre profil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ==============================================
-- 3. POLICIES POUR LA TABLE PROPRIO_PROFILES
-- ==============================================

-- Les propriétaires peuvent gérer leur propre profil
CREATE POLICY "Proprietaires can manage own profile" ON proprio_profiles
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- 4. POLICIES POUR LA TABLE PRO_PROFILES
-- ==============================================

-- Les professionnels peuvent gérer leur propre profil
CREATE POLICY "Pros can manage own profile" ON pro_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Les propriétaires peuvent voir les profils des pros (pour la recherche)
CREATE POLICY "Proprietaires can view pro profiles" ON pro_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'PROPRIETAIRE'
    )
  );

-- ==============================================
-- 5. POLICIES POUR LA TABLE EQUIDES
-- ==============================================

-- Les propriétaires peuvent gérer leurs propres équidés
CREATE POLICY "Proprietaires can manage own equides" ON equides
  FOR ALL USING (auth.uid() = proprio_id);

-- Les pros peuvent voir les équidés des rendez-vous qui les concernent
CREATE POLICY "Pros can view equides from their appointments" ON equides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.equide_id = equides.id 
      AND appointments.pro_id = auth.uid()
    )
  );

-- ==============================================
-- 6. POLICIES POUR LA TABLE APPOINTMENTS
-- ==============================================

-- Les propriétaires peuvent voir et gérer leurs rendez-vous
CREATE POLICY "Proprietaires can manage own appointments" ON appointments
  FOR ALL USING (auth.uid() = proprio_id);

-- Les pros peuvent voir et modifier les rendez-vous qui les concernent
CREATE POLICY "Pros can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = pro_id);

CREATE POLICY "Pros can update appointments assigned to them" ON appointments
  FOR UPDATE USING (auth.uid() = pro_id);

-- Les pros peuvent créer des rendez-vous (quand ils sont assignés)
CREATE POLICY "Pros can create appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = pro_id);

-- ==============================================
-- 7. POLICIES POUR LA TABLE LOGS (OPTIONNEL)
-- ==============================================

-- Note: La table logs n'existe pas encore, ces policies seront ajoutées si nécessaire

-- ==============================================
-- 8. VÉRIFICATION DES POLICIES
-- ==============================================

-- Vérifier que toutes les policies ont été créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Vérifier que RLS est activé sur toutes les tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'proprio_profiles', 'pro_profiles', 'equides', 'appointments')
ORDER BY tablename;
