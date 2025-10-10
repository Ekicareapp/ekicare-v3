// Script simple pour créer le trigger de clients
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTrigger() {
  console.log('🔧 Création du trigger pour les clients automatiques');
  console.log('==================================================');

  try {
    // SQL pour créer le trigger
    const sql = `
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

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS trigger_create_client_relation ON appointments;

-- Créer le trigger sur la table appointments
CREATE TRIGGER trigger_create_client_relation
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_client_relation();
`;

    console.log('📄 Exécution du script SQL...');
    
    // Exécuter le SQL via une requête directe
    const { data, error } = await supabase.rpc('exec', { sql: sql });

    if (error) {
      console.error('❌ Erreur lors de l\'exécution du SQL:', error);
      console.log('\n💡 Instructions manuelles:');
      console.log('1. Ouvrez Supabase Dashboard → SQL Editor');
      console.log('2. Copiez le contenu du fichier migrations/create_client_relation_trigger.sql');
      console.log('3. Exécutez le script dans l\'éditeur SQL');
      return;
    }

    console.log('✅ Trigger créé avec succès !');
    console.log('\n🧪 Test du trigger...');

    // Vérifier que le trigger existe
    const { data: triggerCheck, error: triggerError } = await supabase
      .from('mes_clients')
      .select('count')
      .limit(1);

    if (triggerError) {
      console.log('⚠️  Impossible de vérifier le trigger automatiquement');
    } else {
      console.log('✅ Table mes_clients accessible');
    }

    console.log('\n📋 Le trigger va maintenant:');
    console.log('- Se déclencher quand un RDV passe en "confirmed"');
    console.log('- Créer automatiquement une entrée dans mes_clients');
    console.log('- Éviter les doublons');

  } catch (error) {
    console.error('❌ Erreur:', error);
    console.log('\n💡 Instructions manuelles:');
    console.log('1. Ouvrez Supabase Dashboard → SQL Editor');
    console.log('2. Copiez le contenu du fichier migrations/create_client_relation_trigger.sql');
    console.log('3. Exécutez le script dans l\'éditeur SQL');
  }
}

createTrigger();




