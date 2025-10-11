// Script pour tester la récupération directe des clients depuis proprio_profiles
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

async function testDirectClients() {
  console.log('🧪 Test de récupération directe des clients depuis proprio_profiles');
  console.log('================================================================');

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

    // 2. Récupérer les RDV confirmés de ce PRO
    console.log('\n2️⃣ Récupération des RDV confirmés...');
    const { data: confirmedAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('proprio_id, main_slot, status')
      .eq('pro_id', pro.id)
      .eq('status', 'confirmed');

    if (appointmentsError) {
      console.error('❌ Erreur lors de la récupération des RDV:', appointmentsError);
      return;
    }

    console.log(`✅ Nombre de RDV confirmés trouvés: ${confirmedAppointments.length}`);
    if (confirmedAppointments.length > 0) {
      confirmedAppointments.forEach((apt, index) => {
        console.log(`  ${index + 1}. PROPRIO: ${apt.proprio_id} - Date: ${apt.main_slot}`);
      });
    } else {
      console.log('ℹ️  Aucun RDV confirmé trouvé');
      console.log('💡 Créez un RDV confirmé pour tester la fonctionnalité');
      return;
    }

    // 3. Extraire les IDs uniques des propriétaires
    const uniqueProprioIds = [...new Set(confirmedAppointments.map(apt => apt.proprio_id))];
    console.log(`\n3️⃣ IDs uniques des propriétaires: ${uniqueProprioIds.length}`);
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

    // 5. Calculer les statistiques pour chaque client
    console.log('\n5️⃣ Calcul des statistiques...');
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        // Récupérer tous les RDV avec ce client
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, main_slot, status, created_at')
          .eq('pro_id', pro.id)
          .eq('proprio_id', client.id)
          .order('main_slot', { ascending: false });

        if (appointmentsError) {
          console.error(`❌ Erreur pour ${client.prenom} ${client.nom}:`, appointmentsError);
          return {
            id: client.id,
            nom: client.nom,
            prenom: client.prenom,
            photo: client.photo_url,
            telephone: client.telephone,
            adresse: client.adresse,
            totalRendezVous: 0,
            derniereVisite: null,
            dateAjout: client.created_at
          };
        }

        // Calculer les statistiques
        const totalRendezVous = appointments.length;
        const rendezVousTermines = appointments.filter(rdv => rdv.status === 'completed');
        const derniereVisite = rendezVousTermines.length > 0 
          ? rendezVousTermines[0].main_slot 
          : null;

        console.log(`  📊 ${client.prenom} ${client.nom}: ${totalRendezVous} RDV, dernière visite: ${derniereVisite || 'N/A'}`);

        return {
          id: client.id,
          nom: client.nom,
          prenom: client.prenom,
          photo: client.photo_url,
          telephone: client.telephone,
          adresse: client.adresse,
          totalRendezVous,
          derniereVisite,
          dateAjout: client.created_at
        };
      })
    );

    console.log('\n✅ Test terminé avec succès !');
    console.log('\n📋 Résumé:');
    console.log(`- PRO: ${pro.prenom} ${pro.nom}`);
    console.log(`- Clients trouvés: ${clientsWithStats.length}`);
    console.log(`- RDV confirmés: ${confirmedAppointments.length}`);

    console.log('\n💡 Maintenant, testez dans le navigateur :');
    console.log('1. Connectez-vous en tant que PRO (pro@test.com / 142536)');
    console.log('2. Allez dans "Mes clients"');
    console.log('3. Les clients devraient apparaître avec leurs informations');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testDirectClients();






