-- Script de correction des relations équidés ↔ propriétaires
-- Date: 2025-01-01
-- Description: Corriger toute relation incorrecte entre équidés et professionnels

-- ==============================================
-- 1. SUPPRESSION DES RELATIONS INCORRECTES
-- ==============================================

-- Supprimer toute colonne pro_id de la table equides si elle existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equides' 
        AND column_name = 'pro_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE equides DROP COLUMN pro_id;
        RAISE NOTICE 'Colonne pro_id supprimée de la table equides';
    ELSE
        RAISE NOTICE 'Aucune colonne pro_id trouvée dans equides - OK';
    END IF;
END $$;

-- Supprimer toute contrainte de clé étrangère equides → pro_profiles
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'equides'
        AND ccu.table_name = 'pro_profiles'
        AND tc.table_schema = 'public';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE equides DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Contrainte % supprimée de equides', constraint_name;
    ELSE
        RAISE NOTICE 'Aucune contrainte equides → pro_profiles trouvée - OK';
    END IF;
END $$;

-- ==============================================
-- 2. RENFORCEMENT DES CONTRAINTES CORRECTES
-- ==============================================

-- S'assurer que equides.proprio_id est bien lié à users (pas directement à proprio_profiles)
-- car proprio_profiles.user_id est déjà lié à users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_equides_proprio_id'
        AND table_name = 'equides'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE equides 
        ADD CONSTRAINT fk_equides_proprio_id 
        FOREIGN KEY (proprio_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Contrainte fk_equides_proprio_id ajoutée';
    ELSE
        RAISE NOTICE 'Contrainte fk_equides_proprio_id existe déjà - OK';
    END IF;
END $$;

-- S'assurer que appointments.equide_id est bien lié à equides
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_appointments_equide_id'
        AND table_name = 'appointments'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE appointments 
        ADD CONSTRAINT fk_appointments_equide_id 
        FOREIGN KEY (equide_id) REFERENCES equides(id) ON DELETE CASCADE;
        RAISE NOTICE 'Contrainte fk_appointments_equide_id ajoutée';
    ELSE
        RAISE NOTICE 'Contrainte fk_appointments_equide_id existe déjà - OK';
    END IF;
END $$;

-- ==============================================
-- 3. NETTOYAGE DES DONNÉES INCORRECTES
-- ==============================================

-- Supprimer les équidés qui n'ont pas de propriétaire valide
DELETE FROM equides 
WHERE proprio_id IS NULL 
   OR proprio_id NOT IN (SELECT id FROM users WHERE role = 'PROPRIETAIRE');

-- Supprimer les appointments qui n'ont pas d'équidé valide
DELETE FROM appointments 
WHERE equide_id IS NULL 
   OR equide_id NOT IN (SELECT id FROM equides);

-- ==============================================
-- 4. RENFORCEMENT DES POLICIES RLS
-- ==============================================

-- Supprimer et recréer la policy pour s'assurer qu'elle est correcte
DROP POLICY IF EXISTS "Pros can view equides from their appointments" ON equides;

CREATE POLICY "Pros can view equides from their appointments" ON equides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.equide_id = equides.id 
      AND appointments.pro_id = auth.uid()
    )
  );

-- S'assurer que les propriétaires peuvent gérer leurs équidés
DROP POLICY IF EXISTS "Proprietaires can manage own equides" ON equides;

CREATE POLICY "Proprietaires can manage own equides" ON equides
  FOR ALL USING (auth.uid() = proprio_id);

-- ==============================================
-- 5. VÉRIFICATION POST-CORRECTION
-- ==============================================

-- Vérifier qu'il n'y a plus de relations directes equides ↔ pro_profiles
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCÈS: Aucune relation directe equides ↔ pro_profiles'
        ELSE '❌ ÉCHEC: Relations directes encore présentes'
    END as verification_result
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'equides'
    AND ccu.table_name = 'pro_profiles'
    AND tc.table_schema = 'public';

-- Vérifier que tous les équidés ont un propriétaire valide
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCÈS: Tous les équidés ont un propriétaire valide'
        ELSE '❌ ÉCHEC: ' || COUNT(*) || ' équidés sans propriétaire valide'
    END as verification_result
FROM equides 
WHERE proprio_id IS NULL 
   OR proprio_id NOT IN (SELECT id FROM users WHERE role = 'PROPRIETAIRE');

-- Vérifier que tous les appointments ont un équidé valide
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCÈS: Tous les appointments ont un équidé valide'
        ELSE '❌ ÉCHEC: ' || COUNT(*) || ' appointments sans équidé valide'
    END as verification_result
FROM appointments 
WHERE equide_id IS NULL 
   OR equide_id NOT IN (SELECT id FROM equides);

-- ==============================================
-- 6. RÉSUMÉ DE CORRECTION
-- ==============================================

SELECT 
    'CORRECTION COMPLÉTÉE' as summary_type,
    '✅ Relations equides ↔ propriétaires vérifiées et corrigées' as equides_owner_fix,
    '✅ Relations directes equides ↔ professionnels supprimées' as direct_pro_relations_removed,
    '✅ Contraintes de base de données renforcées' as database_constraints_fixed,
    '✅ Policies RLS mises à jour' as rls_policies_updated,
    '✅ Données nettoyées et validées' as data_cleaned_and_validated;

