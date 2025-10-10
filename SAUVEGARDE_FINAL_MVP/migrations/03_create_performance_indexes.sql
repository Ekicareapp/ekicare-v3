-- Migration pour créer les index de performance
-- Date: 2024-01-15
-- Description: Optimiser les performances des requêtes fréquentes

-- ==============================================
-- 1. INDEX POUR LA TABLE USERS
-- ==============================================

-- Index sur le rôle pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index sur l'email pour les recherches
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==============================================
-- 2. INDEX POUR LA TABLE PROPRIO_PROFILES
-- ==============================================

-- Index sur user_id (déjà couvert par la clé étrangère, mais utile pour les jointures)
CREATE INDEX IF NOT EXISTS idx_proprio_profiles_user_id ON proprio_profiles(user_id);

-- Index sur le nom pour les recherches
CREATE INDEX IF NOT EXISTS idx_proprio_profiles_nom ON proprio_profiles(nom);

-- ==============================================
-- 3. INDEX POUR LA TABLE PRO_PROFILES
-- ==============================================

-- Index sur user_id
CREATE INDEX IF NOT EXISTS idx_pro_profiles_user_id ON pro_profiles(user_id);

-- Index sur la profession pour les recherches
CREATE INDEX IF NOT EXISTS idx_pro_profiles_profession ON pro_profiles(profession);

-- Index sur la ville pour les recherches géographiques
CREATE INDEX IF NOT EXISTS idx_pro_profiles_ville_nom ON pro_profiles(ville_nom);

-- Index sur les coordonnées géographiques (pour les recherches de proximité)
CREATE INDEX IF NOT EXISTS idx_pro_profiles_ville_coords ON pro_profiles(ville_lat, ville_lng);

-- Index sur le rayon d'intervention
CREATE INDEX IF NOT EXISTS idx_pro_profiles_rayon_km ON pro_profiles(rayon_km);

-- Index sur le statut de vérification
CREATE INDEX IF NOT EXISTS idx_pro_profiles_is_verified ON pro_profiles(is_verified);

-- Index sur le statut d'abonnement
CREATE INDEX IF NOT EXISTS idx_pro_profiles_is_subscribed ON pro_profiles(is_subscribed);

-- Index sur la fourchette de prix (sera ajouté avec les colonnes)
-- CREATE INDEX IF NOT EXISTS idx_pro_profiles_price_range ON pro_profiles(price_range);

-- Index sur les années d'expérience (sera ajouté avec les colonnes)
-- CREATE INDEX IF NOT EXISTS idx_pro_profiles_experience_years ON pro_profiles(experience_years);

-- ==============================================
-- 4. INDEX POUR LA TABLE EQUIDES
-- ==============================================

-- Index sur proprio_id (déjà couvert par la clé étrangère)
CREATE INDEX IF NOT EXISTS idx_equides_proprio_id ON equides(proprio_id);

-- Index sur le nom pour les recherches (sera ajouté avec les colonnes)
-- CREATE INDEX IF NOT EXISTS idx_equides_nom ON equides(nom);

-- Index sur la race pour les filtres (sera ajouté avec les colonnes)
-- CREATE INDEX IF NOT EXISTS idx_equides_race ON equides(race);

-- Index sur le sexe pour les filtres (sera ajouté avec les colonnes)
-- CREATE INDEX IF NOT EXISTS idx_equides_sexe ON equides(sexe);

-- Index composite pour les recherches fréquentes (sera ajouté avec les colonnes)
-- CREATE INDEX IF NOT EXISTS idx_equides_proprio_nom ON equides(proprio_id, nom);

-- ==============================================
-- 5. INDEX POUR LA TABLE APPOINTMENTS
-- ==============================================

-- Index sur proprio_id (déjà couvert par la clé étrangère)
CREATE INDEX IF NOT EXISTS idx_appointments_proprio_id ON appointments(proprio_id);

-- Index sur pro_id (déjà couvert par la clé étrangère)
CREATE INDEX IF NOT EXISTS idx_appointments_pro_id ON appointments(pro_id);

-- Index sur equide_id (déjà couvert par la clé étrangère)
CREATE INDEX IF NOT EXISTS idx_appointments_equide_id ON appointments(equide_id);

-- Index sur la date pour les requêtes temporelles
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- Index sur le statut pour les filtres
CREATE INDEX IF NOT EXISTS idx_appointments_statut ON appointments(statut);

-- Index composite pour les requêtes fréquentes (proprio + statut)
CREATE INDEX IF NOT EXISTS idx_appointments_proprio_statut ON appointments(proprio_id, statut);

-- Index composite pour les requêtes fréquentes (pro + statut)
CREATE INDEX IF NOT EXISTS idx_appointments_pro_statut ON appointments(pro_id, statut);

-- Index composite pour les requêtes par date et statut
CREATE INDEX IF NOT EXISTS idx_appointments_date_statut ON appointments(date, statut);

-- Index sur created_at pour les requêtes chronologiques
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- ==============================================
-- 6. INDEX POUR LA TABLE LOGS (OPTIONNEL)
-- ==============================================

-- Note: La table logs n'existe pas encore, ces index seront ajoutés si nécessaire

-- ==============================================
-- 7. INDEX POUR LES RECHERCHES TEXTUELLES
-- ==============================================

-- Index GIN pour les recherches textuelles dans les messages d'appointments
CREATE INDEX IF NOT EXISTS idx_appointments_message_gin ON appointments USING gin(to_tsvector('french', message));

-- Index GIN pour les recherches textuelles dans les descriptions d'équidés (sera ajouté avec les colonnes)
-- CREATE INDEX IF NOT EXISTS idx_equides_description_gin ON equides USING gin(to_tsvector('french', description));

-- Index GIN pour les recherches textuelles dans les bios de pros (sera ajouté avec les colonnes)
-- CREATE INDEX IF NOT EXISTS idx_pro_profiles_bio_gin ON pro_profiles USING gin(to_tsvector('french', bio));

-- ==============================================
-- 8. VÉRIFICATION DES INDEX
-- ==============================================

-- Vérifier que tous les index ont été créés
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Statistiques sur les index
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    'Index exists' as status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND indexrelname LIKE 'idx_%'
ORDER BY relname, indexrelname;
