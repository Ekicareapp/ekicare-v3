-- Migration pour ajouter les contraintes de clés étrangères
-- Date: 2024-01-15
-- Description: Établir les relations entre les tables

-- ==============================================
-- 1. CONTRAINTES POUR PROPRIO_PROFILES
-- ==============================================

-- Ajouter la contrainte de clé étrangère vers users
ALTER TABLE proprio_profiles 
ADD CONSTRAINT fk_proprio_profiles_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ==============================================
-- 2. CONTRAINTES POUR PRO_PROFILES
-- ==============================================

-- Ajouter la contrainte de clé étrangère vers users
ALTER TABLE pro_profiles 
ADD CONSTRAINT fk_pro_profiles_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ==============================================
-- 3. CONTRAINTES POUR EQUIDES
-- ==============================================

-- Ajouter la contrainte de clé étrangère vers users (proprio_id)
ALTER TABLE equides 
ADD CONSTRAINT fk_equides_proprio_id 
FOREIGN KEY (proprio_id) REFERENCES users(id) ON DELETE CASCADE;

-- ==============================================
-- 4. CONTRAINTES POUR APPOINTMENTS
-- ==============================================

-- Ajouter la contrainte de clé étrangère vers users (proprio_id)
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_proprio_id 
FOREIGN KEY (proprio_id) REFERENCES users(id) ON DELETE CASCADE;

-- Ajouter la contrainte de clé étrangère vers users (pro_id)
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_pro_id 
FOREIGN KEY (pro_id) REFERENCES users(id) ON DELETE CASCADE;

-- Ajouter la contrainte de clé étrangère vers equides (equide_id)
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_equide_id 
FOREIGN KEY (equide_id) REFERENCES equides(id) ON DELETE CASCADE;

-- ==============================================
-- 5. CONTRAINTES POUR LOGS (OPTIONNEL)
-- ==============================================

-- Note: La table logs n'existe pas encore, ces contraintes seront ajoutées si nécessaire

-- ==============================================
-- 6. CONTRAINTES DE VALIDATION
-- ==============================================

-- Contraintes pour les rôles dans users
ALTER TABLE users 
ADD CONSTRAINT chk_users_role 
CHECK (role IN ('PROPRIETAIRE', 'PRO'));

-- Contraintes pour les statuts dans appointments
ALTER TABLE appointments 
ADD CONSTRAINT chk_appointments_statut 
CHECK (statut IN ('EN_ATTENTE', 'A_VENIR', 'REPLANIFIE', 'TERMINE', 'REFUSE'));

-- Contraintes pour les sexes dans equides (sera ajouté avec les colonnes)
-- ALTER TABLE equides 
-- ADD CONSTRAINT chk_equides_sexe 
-- CHECK (sexe IN ('Jument', 'Étalon', 'Hongre'));

-- Contraintes pour les fourchettes de prix dans pro_profiles (sera ajouté avec les colonnes)
-- ALTER TABLE pro_profiles 
-- ADD CONSTRAINT chk_pro_profiles_price_range 
-- CHECK (price_range IN ('€', '€€', '€€€'));

-- Contraintes pour les années d'expérience dans pro_profiles (sera ajouté avec les colonnes)
-- ALTER TABLE pro_profiles 
-- ADD CONSTRAINT chk_pro_profiles_experience_years 
-- CHECK (experience_years >= 0 AND experience_years <= 60);

-- ==============================================
-- 7. VÉRIFICATION DES CONTRAINTES
-- ==============================================

-- Vérifier que toutes les contraintes de clés étrangères ont été créées
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
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;
