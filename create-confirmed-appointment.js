// Script pour créer un RDV confirmé et tester la fonctionnalité clients
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

async function createConfirmedAppointment() {
  console.log('🧪 Création d\'un RDV confirmé pour tester les clients');
  console.log('====================================================');

  try {
    // 1. Récupérer un PRO
    console.log('\n1️⃣ Récupération d\'un PRO...');
    const { data: pros, error: prosError } = await supabase
      .from('pro_profiles')
      .select('id, user_id, prenom, nom')
      .limit(1);

    if (prosError || !pros || pros.length === 0) {
      console.error('❌ Aucun PRO trouvé:', prosError);
      return;
    }

    const pro = pros[0];
    console.log(`✅ PRO: ${pro.prenom} ${pro.nom} (ID: ${pro.id})`);

    // 2. Récupérer un PROPRIO
    console.log('\n2️⃣ Récupération d\'un PROPRIO...');
    const { data: proprios, error: propriosError } = await supabase
      .from('proprio_profiles')
      .select('id, user_id, prenom, nom')
      .limit(1);

    if (propriosError || !proprios || proprios.length === 0) {
      console.error('❌ Aucun PROPRIO trouvé:', propriosError);
      return;
    }

    const proprio = proprios[0];
    console.log(`✅ PROPRIO: ${proprio.prenom} ${proprio.nom} (ID: ${proprio.id})`);

    // 3. Nettoyer les RDV existants
    console.log('\n3️⃣ Nettoyage des RDV existants...');
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('pro_id', pro.id)
      .eq('proprio_id', proprio.id);

    if (deleteError) {
      console.log('ℹ️  Aucun RDV existant à supprimer');
    } else {
      console.log('✅ RDV existants supprimés');
    }

    // 4. Créer un RDV confirmé
    console.log('\n4️⃣ Création d\'un RDV confirmé...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 14h00 demain

    const { data: newAppointment, error: createError } = await supabase
      .from('appointments')
      .insert({
        pro_id: pro.user_id,  // Utiliser user_id au lieu de profile id
        proprio_id: proprio.user_id,  // Utiliser user_id au lieu de profile id
        main_slot: tomorrow.toISOString(),
        status: 'confirmed',
        comment: 'RDV de test pour la fonctionnalité clients',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (createError) {
      console.error('❌ Erreur lors de la création du RDV:', createError);
      return;
    }

    console.log('✅ RDV confirmé créé avec succès !');
    console.log(`   Date: ${tomorrow.toLocaleString('fr-FR')}`);
    console.log(`   PRO: ${pro.prenom} ${pro.nom}`);
    console.log(`   PROPRIO: ${proprio.prenom} ${proprio.nom}`);

    // 5. Tester la récupération des clients
    console.log('\n5️⃣ Test de la récupération des clients...');
    const { data: confirmedAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('proprio_id, main_slot, status')
      .eq('pro_id', pro.id)
      .eq('status', 'confirmed');

    if (appointmentsError) {
      console.error('❌ Erreur lors de la récupération des RDV:', appointmentsError);
      return;
    }

    console.log(`✅ Nombre de RDV confirmés: ${confirmedAppointments.length}`);

    // 6. Récupérer les profils des propriétaires
    const uniqueProprioIds = [...new Set(confirmedAppointments.map(apt => apt.proprio_id))];
    const { data: clients, error: clientsError } = await supabase
      .from('proprio_profiles')
      .select(`
        id,
        prenom,
        nom,
        photo_url,
        telephone,
        adresse,
        created_at
      `)
      .in('id', uniqueProprioIds);

    if (clientsError) {
      console.error('❌ Erreur lors de la récupération des clients:', clientsError);
      return;
    }

    console.log(`✅ Nombre de clients trouvés: ${clients.length}`);
    clients.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.prenom} ${client.nom}`);
      console.log(`     Téléphone: ${client.telephone}`);
      console.log(`     Adresse: ${client.adresse}`);
    });

    console.log('\n✅ Test terminé avec succès !');
    console.log('\n💡 Maintenant, testez dans le navigateur :');
    console.log('1. Connectez-vous en tant que PRO (pro@test.com / 142536)');
    console.log('2. Allez dans "Mes clients"');
    console.log('3. Le client devrait apparaître avec ses informations');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createConfirmedAppointment();
