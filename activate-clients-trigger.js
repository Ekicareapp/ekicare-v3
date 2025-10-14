// Script pour activer le trigger de création automatique de clients
// Ce script exécute le SQL dans Supabase

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function activateClientsTrigger() {
  console.log('🔧 Activation du trigger de création automatique de clients');
  console.log('============================================================');

  try {
    // Lire le fichier SQL
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'migrations', 'create_client_relation_trigger.sql');
    
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ Fichier SQL non trouvé:', sqlFile);
      return;
    }

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    console.log('📄 Contenu du script SQL:');
    console.log('------------------------');
    console.log(sqlContent);
    console.log('------------------------');

    // Exécuter le SQL
    console.log('\n🚀 Exécution du script SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ Erreur lors de l\'exécution du SQL:', error);
      return;
    }

    console.log('✅ Trigger activé avec succès !');
    console.log('\n📋 Le trigger va maintenant:');
    console.log('- Se déclencher automatiquement quand un RDV passe en "confirmed"');
    console.log('- Créer une entrée dans la table "mes_clients"');
    console.log('- Éviter les doublons si la relation existe déjà');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter l'activation
activateClientsTrigger();









