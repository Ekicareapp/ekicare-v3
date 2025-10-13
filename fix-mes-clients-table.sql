-- Script pour corriger la structure de la table mes_clients
-- Problème : contraintes de clé étrangère incohérentes

-- 1. Supprimer les contraintes existantes
ALTER TABLE mes_clients DROP CONSTRAINT IF EXISTS mes_clients_pro_id_fkey;
ALTER TABLE mes_clients DROP CONSTRAINT IF EXISTS mes_clients_proprio_id_fkey;

-- 2. Ajouter les bonnes contraintes
-- pro_id doit référencer pro_profiles.id
ALTER TABLE mes_clients 
ADD CONSTRAINT mes_clients_pro_id_fkey 
FOREIGN KEY (pro_id) REFERENCES pro_profiles(id) ON DELETE CASCADE;

-- proprio_id doit référencer proprio_profiles.id (pas users.id)
ALTER TABLE mes_clients 
ADD CONSTRAINT mes_clients_proprio_id_fkey 
FOREIGN KEY (proprio_id) REFERENCES proprio_profiles(id) ON DELETE CASCADE;

-- 3. Vérifier que les colonnes existent
-- Si les colonnes n'existent pas, les créer
DO $$
BEGIN
    -- Vérifier si la colonne pro_id existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mes_clients' AND column_name = 'pro_id') THEN
        ALTER TABLE mes_clients ADD COLUMN pro_id UUID;
    END IF;
    
    -- Vérifier si la colonne proprio_id existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mes_clients' AND column_name = 'proprio_id') THEN
        ALTER TABLE mes_clients ADD COLUMN proprio_id UUID;
    END IF;
    
    -- Vérifier si la colonne created_at existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mes_clients' AND column_name = 'created_at') THEN
        ALTER TABLE mes_clients ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Vérifier si la colonne updated_at existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mes_clients' AND column_name = 'updated_at') THEN
        ALTER TABLE mes_clients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_mes_clients_pro_id ON mes_clients(pro_id);
CREATE INDEX IF NOT EXISTS idx_mes_clients_proprio_id ON mes_clients(proprio_id);

-- 5. Commentaires sur la table
COMMENT ON TABLE mes_clients IS 'Relations entre PROs et leurs clients (PROPRIOs)';
COMMENT ON COLUMN mes_clients.pro_id IS 'ID du profil PRO';
COMMENT ON COLUMN mes_clients.proprio_id IS 'ID du profil PROPRIO';
COMMENT ON COLUMN mes_clients.created_at IS 'Date de création de la relation';
COMMENT ON COLUMN mes_clients.updated_at IS 'Date de dernière mise à jour';








