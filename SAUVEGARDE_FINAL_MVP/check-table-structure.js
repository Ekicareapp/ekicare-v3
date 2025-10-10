// Script pour vérifier la structure de la table mes_clients
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

async function checkTableStructure() {
  console.log('🔍 Vérification de la structure de la table mes_clients');
  console.log('======================================================');

  try {
    // 1. Vérifier les contraintes de la table
    console.log('\n1️⃣ Test d\'insertion avec différents IDs...');

    // Récupérer un PRO et son user_id
    const { data: pros, error: prosError } = await supabase
      .from('pro_profiles')
      .select('id, user_id')
      .limit(1);

    if (prosError || !pros || pros.length === 0) {
      console.error('❌ Aucun PRO trouvé:', prosError);
      return;
    }

    const pro = pros[0];
    console.log(`✅ PRO trouvé: ${pro.id} (user: ${pro.user_id})`);

    // Récupérer un PROPRIO et son user_id
    const { data: proprios, error: propriosError } = await supabase
      .from('proprio_profiles')
      .select('id, user_id')
      .limit(1);

    if (propriosError || !proprios || proprios.length === 0) {
      console.error('❌ Aucun PROPRIO trouvé:', propriosError);
      return;
    }

    const proprio = proprios[0];
    console.log(`✅ PROPRIO trouvé: ${proprio.id} (user: ${proprio.user_id})`);

    // 2. Tester avec les user_ids
    console.log('\n2️⃣ Test avec les user_ids...');
    const { data: testRelation, error: testError } = await supabase
      .from('mes_clients')
      .insert({
        pro_id: pro.user_id,  // Utiliser user_id au lieu de profile id
        proprio_id: proprio.user_id,  // Utiliser user_id au lieu de profile id
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (testError) {
      console.error('❌ Erreur avec user_ids:', testError);
      
      // 3. Tester avec les profile IDs
      console.log('\n3️⃣ Test avec les profile IDs...');
      const { data: testRelation2, error: testError2 } = await supabase
        .from('mes_clients')
        .insert({
          pro_id: pro.id,  // Utiliser profile id
          proprio_id: proprio.id,  // Utiliser profile id
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (testError2) {
        console.error('❌ Erreur avec profile IDs:', testError2);
        console.log('\n💡 La table mes_clients semble avoir des contraintes inattendues');
        console.log('   Vérifiez la structure dans Supabase Dashboard');
      } else {
        console.log('✅ Succès avec profile IDs !');
        console.log('📋 Relation créée:', testRelation2[0]);
      }
    } else {
      console.log('✅ Succès avec user_ids !');
      console.log('📋 Relation créée:', testRelation[0]);
    }

    // 4. Vérifier les données existantes
    console.log('\n4️⃣ Vérification des données existantes...');
    const { data: allClients, error: allClientsError } = await supabase
      .from('mes_clients')
      .select('*');

    if (allClientsError) {
      console.error('❌ Erreur lors de la récupération:', allClientsError);
    } else {
      console.log(`✅ Nombre total de clients: ${allClients.length}`);
      if (allClients.length > 0) {
        console.log('📋 Clients existants:');
        allClients.forEach((client, index) => {
          console.log(`  ${index + 1}. PRO: ${client.pro_id} → PROPRIO: ${client.proprio_id}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkTableStructure();




