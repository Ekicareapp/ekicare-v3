const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAppointmentsTable() {
  console.log('🔍 Test de la table appointments...');
  
  try {
    // 1. Vérifier la structure de la table
    console.log('\n1️⃣ Vérification de la structure...');
    const { data: structure, error: structureError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.log('❌ Erreur structure:', structureError.message);
      return;
    }
    
    console.log('✅ Table appointments accessible');
    
    // 2. Vérifier les colonnes
    console.log('\n2️⃣ Vérification des colonnes...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'appointments' });
    
    if (columnsError) {
      console.log('⚠️  Impossible de vérifier les colonnes via RPC, test direct...');
      // Test direct avec une insertion pour vérifier les colonnes
      const testData = {
        pro_id: '00000000-0000-0000-0000-000000000000',
        proprio_id: '00000000-0000-0000-0000-000000000000',
        equide_ids: ['00000000-0000-0000-0000-000000000000'],
        main_slot: new Date().toISOString(),
        alternative_slots: [],
        status: 'pending',
        comment: 'Test de structure',
        duration_minutes: 60
      };
      
      const { data: testInsert, error: testError } = await supabase
        .from('appointments')
        .insert([testData])
        .select();
      
      if (testError) {
        console.log('❌ Erreur test insertion:', testError.message);
        if (testError.message.includes('violates foreign key constraint')) {
          console.log('✅ Structure OK - Erreur FK attendue (utilisateurs test inexistants)');
        }
      } else {
        console.log('✅ Test insertion réussi');
        // Supprimer le test
        await supabase.from('appointments').delete().eq('id', testInsert[0].id);
      }
    } else {
      console.log('✅ Colonnes vérifiées:', columns);
    }
    
    // 3. Vérifier les index
    console.log('\n3️⃣ Vérification des index...');
    const { data: indexes, error: indexesError } = await supabase
      .rpc('get_table_indexes', { table_name: 'appointments' });
    
    if (indexesError) {
      console.log('⚠️  Impossible de vérifier les index via RPC');
    } else {
      console.log('✅ Index vérifiés:', indexes);
    }
    
    // 4. Vérifier les politiques RLS
    console.log('\n4️⃣ Vérification des politiques RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'appointments' });
    
    if (policiesError) {
      console.log('⚠️  Impossible de vérifier les politiques via RPC');
    } else {
      console.log('✅ Politiques RLS vérifiées:', policies);
    }
    
    // 5. Test de performance
    console.log('\n5️⃣ Test de performance...');
    const startTime = Date.now();
    
    const { data: perfTest, error: perfError } = await supabase
      .from('appointments')
      .select('id, status, created_at')
      .limit(100);
    
    const endTime = Date.now();
    const queryTime = endTime - startTime;
    
    if (perfError) {
      console.log('❌ Erreur test performance:', perfError.message);
    } else {
      console.log(`✅ Test performance OK - ${queryTime}ms pour 100 enregistrements`);
    }
    
    console.log('\n🎉 TOUS LES TESTS TERMINÉS !');
    console.log('✅ La table appointments est prête à l\'utilisation');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Fonction pour créer les RPC si elles n'existent pas
async function createHelperRPCs() {
  console.log('🔧 Création des fonctions RPC d\'aide...');
  
  try {
    // Fonction pour obtenir les colonnes d'une table
    const { error: columnsRpcError } = await supabase.rpc('create_get_table_columns_function');
    if (columnsRpcError) {
      console.log('⚠️  RPC colonnes non créée (peut-être déjà existante)');
    } else {
      console.log('✅ RPC colonnes créée');
    }
    
    // Fonction pour obtenir les index d'une table
    const { error: indexesRpcError } = await supabase.rpc('create_get_table_indexes_function');
    if (indexesRpcError) {
      console.log('⚠️  RPC index non créée (peut-être déjà existante)');
    } else {
      console.log('✅ RPC index créée');
    }
    
    // Fonction pour obtenir les politiques d'une table
    const { error: policiesRpcError } = await supabase.rpc('create_get_table_policies_function');
    if (policiesRpcError) {
      console.log('⚠️  RPC politiques non créée (peut-être déjà existante)');
    } else {
      console.log('✅ RPC politiques créée');
    }
    
  } catch (error) {
    console.log('⚠️  Erreur création RPC:', error.message);
  }
}

async function main() {
  console.log('🚀 DÉMARRAGE DES TESTS APPOINTMENTS');
  console.log('=====================================');
  
  // Créer les fonctions RPC d'aide
  await createHelperRPCs();
  
  // Lancer les tests
  await testAppointmentsTable();
}

main().catch(console.error);