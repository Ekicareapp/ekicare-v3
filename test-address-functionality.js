// Script de test pour vérifier la fonctionnalité d'adresse
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAddressFunctionality() {
  console.log('🧪 Test de la fonctionnalité d\'adresse');
  console.log('=====================================\n');

  // 1. Vérifier si la colonne address existe
  console.log('1️⃣ Vérification de la colonne address...');
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, address')
      .limit(1);

    if (error) {
      console.log('❌ Colonne address manquante:', error.message);
      console.log('💡 Exécutez le script SQL: migrations/add_address_column.sql');
      return;
    }
    console.log('✅ Colonne address présente');
  } catch (error) {
    console.log('❌ Erreur lors de la vérification:', error.message);
    return;
  }

  // 2. Vérifier les RDV existants
  console.log('\n2️⃣ Vérification des RDV existants...');
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('id, address, comment, main_slot')
    .order('created_at', { ascending: false })
    .limit(5);

  if (appointmentsError) {
    console.error('❌ Erreur lors de la récupération des RDV:', appointmentsError);
    return;
  }

  console.log(`✅ ${appointments.length} RDV trouvés`);
  appointments.forEach((apt, index) => {
    console.log(`  ${index + 1}. ID: ${apt.id}`);
    console.log(`     Adresse: ${apt.address || 'Non renseignée'}`);
    console.log(`     Commentaire: ${apt.comment?.substring(0, 50)}...`);
    console.log(`     Date: ${apt.main_slot}`);
    console.log(`     ---`);
  });

  // 3. Tester la création d'un RDV avec adresse
  console.log('\n3️⃣ Test de création d\'un RDV avec adresse...');
  
  // Récupérer un PRO et un PROPRIO existants
  const { data: proProfile } = await supabase
    .from('pro_profiles')
    .select('id, user_id')
    .limit(1)
    .single();

  const { data: proprioProfile } = await supabase
    .from('proprio_profiles')
    .select('user_id')
    .limit(1)
    .single();

  if (!proProfile || !proprioProfile) {
    console.log('❌ Pas de PRO ou PROPRIO trouvé pour le test');
    return;
  }

  const testAppointment = {
    proprio_id: proprioProfile.user_id,
    pro_id: proProfile.id,
    equide_ids: ['test-equide-1'],
    main_slot: new Date().toISOString(),
    alternative_slots: [],
    comment: 'Test de consultation avec adresse',
    address: '123 Rue de la Test, 75001 Paris, France',
    duration_minutes: 60,
    status: 'pending'
  };

  try {
    const { data: newAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert([testAppointment])
      .select()
      .single();

    if (insertError) {
      console.log('❌ Erreur lors de la création du RDV test:', insertError.message);
      return;
    }

    console.log('✅ RDV test créé avec succès');
    console.log(`   ID: ${newAppointment.id}`);
    console.log(`   Adresse: ${newAppointment.address}`);

    // Nettoyer le RDV test
    await supabase
      .from('appointments')
      .delete()
      .eq('id', newAppointment.id);

    console.log('🧹 RDV test supprimé');

  } catch (error) {
    console.log('❌ Erreur lors du test:', error.message);
  }

  console.log('\n✅ Test terminé avec succès !');
  console.log('\n📋 Instructions pour tester dans le navigateur :');
  console.log('1. Connectez-vous en tant que PROPRIO');
  console.log('2. Allez dans "Rechercher un pro"');
  console.log('3. Sélectionnez un professionnel');
  console.log('4. Cliquez sur "Demander un rendez-vous"');
  console.log('5. Remplissez le formulaire avec une adresse');
  console.log('6. Vérifiez que l\'adresse apparaît dans les détails du RDV');
}

testAddressFunctionality();




