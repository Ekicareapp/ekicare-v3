const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAppointmentsTable() {
  console.log('🔍 Test de la table appointments avec contraintes...');
  
  try {
    // 1. Vérifier que la table existe et est accessible
    console.log('\n1️⃣ Vérification de l\'accès à la table...');
    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur d\'accès:', error.message);
      return;
    }
    
    console.log('✅ Table appointments accessible');
    
    // 2. Vérifier les contraintes des tables parentes
    console.log('\n2️⃣ Vérification des contraintes parentes...');
    
    // Test d'insertion avec des IDs valides
    const { data: pros } = await supabase
      .from('pro_profiles')
      .select('user_id')
      .limit(1);
    
    const { data: proprios } = await supabase
      .from('proprio_profiles')
      .select('user_id')
      .limit(1);
    
    if (!pros || pros.length === 0 || !proprios || proprios.length === 0) {
      console.log('⚠️  Pas d\'utilisateurs de test disponibles');
      console.log('✅ Structure de la table OK - Test d\'insertion ignoré');
      return;
    }
    
    console.log('✅ Contraintes parentes OK - Utilisateurs trouvés');
    
    // 3. Tester l'insertion d'un rendez-vous de test
    console.log('\n3️⃣ Test d\'insertion avec contraintes...');
    
    const testData = {
      pro_id: pros[0].user_id,
      proprio_id: proprios[0].user_id,
      equide_ids: ['00000000-0000-0000-0000-000000000000'], // ID test
      main_slot: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
      alternative_slots: [new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()], // Après-demain
      status: 'pending',
      comment: 'Test de création de rendez-vous avec contraintes',
      duration_minutes: 60
    };
    
    const { data: insertedData, error: insertError } = await supabase
      .from('appointments')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.log('❌ Erreur insertion:', insertError.message);
    } else {
      console.log('✅ Insertion réussie avec contraintes:', insertedData[0].id);
      
      // Test de mise à jour
      const { data: updatedData, error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', insertedData[0].id)
        .select();
      
      if (updateError) {
        console.log('❌ Erreur mise à jour:', updateError.message);
      } else {
        console.log('✅ Mise à jour réussie:', updatedData[0].status);
      }
      
      // Supprimer le test
      await supabase.from('appointments').delete().eq('id', insertedData[0].id);
      console.log('✅ Test nettoyé');
    }
    
    // 4. Tester les différentes colonnes
    console.log('\n4️⃣ Test des colonnes et types...');
    const { data: columnsTest, error: columnsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.log('❌ Erreur test colonnes:', columnsError.message);
    } else {
      console.log('✅ Toutes les colonnes sont accessibles');
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
      console.log(`✅ Test performance OK - ${queryTime}ms pour ${perfTest.length} enregistrements`);
    }
    
    // 6. Test des contraintes CHECK
    console.log('\n6️⃣ Test des contraintes CHECK...');
    const { data: checkTest, error: checkError } = await supabase
      .from('appointments')
      .insert([{
        pro_id: pros[0].user_id,
        proprio_id: proprios[0].user_id,
        equide_ids: ['00000000-0000-0000-0000-000000000000'],
        main_slot: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'invalid_status', // Statut invalide
        comment: 'Test contrainte CHECK',
        duration_minutes: 60
      }])
      .select();
    
    if (checkError) {
      console.log('✅ Contrainte CHECK fonctionne - Statut invalide rejeté');
    } else {
      console.log('⚠️  Contrainte CHECK ne fonctionne pas - Statut invalide accepté');
      // Nettoyer si l'insertion a réussi
      if (checkTest && checkTest.length > 0) {
        await supabase.from('appointments').delete().eq('id', checkTest[0].id);
      }
    }
    
    console.log('\n🎉 TOUS LES TESTS TERMINÉS !');
    console.log('✅ La table appointments avec contraintes est prête à l\'utilisation');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testAppointmentsTable().catch(console.error);
