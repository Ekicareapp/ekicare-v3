-- Migration: Créer le trigger pour auto-créer les relations PRO-client
-- Date: 08 octobre 2025
-- Description: Quand un RDV passe en "confirmed", créer automatiquement une entrée dans mes_clients

-- Fonction pour créer la relation PRO-client
CREATE OR REPLACE FUNCTION create_client_relation()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le RDV vient de passer en "confirmed"
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Vérifier si la relation existe déjà
    IF NOT EXISTS (
      SELECT 1 FROM mes_clients 
      WHERE pro_id = NEW.pro_id 
      AND proprio_id = NEW.proprio_id
    ) THEN
      -- Créer la relation PRO-client
      INSERT INTO mes_clients (pro_id, proprio_id, created_at, updated_at)
      VALUES (NEW.pro_id, NEW.proprio_id, NOW(), NOW());
      
      -- Log pour debug
      RAISE NOTICE 'Client relation created: PRO % -> PROPRIO %', NEW.pro_id, NEW.proprio_id;
    ELSE
      -- Log pour debug
      RAISE NOTICE 'Client relation already exists: PRO % -> PROPRIO %', NEW.pro_id, NEW.proprio_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table appointments
DROP TRIGGER IF EXISTS trigger_create_client_relation ON appointments;
CREATE TRIGGER trigger_create_client_relation
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_client_relation();

-- Commentaire sur le trigger
COMMENT ON TRIGGER trigger_create_client_relation ON appointments IS 
'Crée automatiquement une relation dans mes_clients quand un RDV passe en confirmed';

-- Test du trigger (optionnel - à exécuter manuellement si besoin)
-- UPDATE appointments SET status = 'confirmed' WHERE id = 'test-id' AND status = 'pending';





