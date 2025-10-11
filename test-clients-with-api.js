// Script pour tester les clients en utilisant l'API existante
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

async function testClientsWithAPI() {
  console.log('🧪 Test des clients avec l\'API existante');
  console.log('========================================');

  try {
    // 1. Vérifier les RDV existants
    console.log('\n1️⃣ Vérification des RDV existants...');
    const { data: allAppointments, error: allAppointmentsError } = await supabase
      .from('appointments')
      .select('id, pro_id, proprio_id, status, main_slot')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allAppointmentsError) {
      console.error('❌ Erreur lors de la récupération des RDV:', allAppointmentsError);
      return;
    }

    console.log(`✅ Nombre total de RDV trouvés: ${allAppointments.length}`);
    allAppointments.forEach((apt, index) => {
      console.log(`  ${index + 1}. PRO: ${apt.pro_id} → PROPRIO: ${apt.proprio_id} - Status: ${apt.status} - Date: ${apt.main_slot}`);
    });

    // 2. Filtrer les RDV confirmés
    const confirmedAppointments = allAppointments.filter(apt => apt.status === 'confirmed');
    console.log(`\n✅ Nombre de RDV confirmés: ${confirmedAppointments.length}`);

    if (confirmedAppointments.length === 0) {
      console.log('ℹ️  Aucun RDV confirmé trouvé');
      console.log('💡 Créez un RDV confirmé via l\'interface utilisateur pour tester');
      return;
    }

    // 3. Récupérer les IDs uniques des propriétaires
    const uniqueProprioIds = [...new Set(confirmedAppointments.map(apt => apt.proprio_id))];
    console.log(`\n✅ IDs uniques des propriétaires: ${uniqueProprioIds.length}`);
    uniqueProprioIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });

    // 4. Récupérer les profils des propriétaires
    console.log('\n4️⃣ Récupération des profils propriétaires...');
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
      .in('id', uniqueProprioIds)
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('❌ Erreur lors de la récupération des clients:', clientsError);
      return;
    }

    console.log(`✅ Nombre de clients trouvés: ${clients.length}`);
    clients.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.prenom} ${client.nom}`);
      console.log(`     Téléphone: ${client.telephone}`);
      console.log(`     Adresse: ${client.adresse}`);
      console.log(`     Photo: ${client.photo_url || 'Aucune'}`);
    });

    // 5. Simuler l'API response
    console.log('\n5️⃣ Simulation de la réponse API...');
    const apiResponse = {
      data: clients.map(client => ({
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        photo: client.photo_url,
        telephone: client.telephone,
        adresse: client.adresse,
        totalRendezVous: confirmedAppointments.filter(apt => apt.proprio_id === client.id).length,
        derniereVisite: confirmedAppointments
          .filter(apt => apt.proprio_id === client.id)
          .sort((a, b) => new Date(b.main_slot) - new Date(a.main_slot))[0]?.main_slot || null,
        dateAjout: client.created_at
      }))
    };

    console.log('✅ Réponse API simulée:');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n✅ Test terminé avec succès !');
    console.log('\n💡 Maintenant, testez dans le navigateur :');
    console.log('1. Connectez-vous en tant que PRO (pro@test.com / 142536)');
    console.log('2. Allez dans "Mes clients"');
    console.log('3. Les clients devraient apparaître avec leurs informations');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testClientsWithAPI();






