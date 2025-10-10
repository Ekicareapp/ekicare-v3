// Script pour vérifier les vraies données après création d'un RDV
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

async function verifyRealData() {
  console.log('🔍 Vérification des vraies données après création du RDV');
  console.log('======================================================');

  try {
    // 1. Vérifier tous les RDV
    console.log('\n1️⃣ Vérification de tous les RDV...');
    const { data: allAppointments, error: allAppointmentsError } = await supabase
      .from('appointments')
      .select('id, pro_id, proprio_id, status, main_slot, created_at')
      .order('created_at', { ascending: false });

    if (allAppointmentsError) {
      console.error('❌ Erreur lors de la récupération des RDV:', allAppointmentsError);
      return;
    }

    console.log(`✅ Nombre total de RDV trouvés: ${allAppointments.length}`);
    allAppointments.forEach((apt, index) => {
      console.log(`  ${index + 1}. ID: ${apt.id}`);
      console.log(`     PRO: ${apt.pro_id}`);
      console.log(`     PROPRIO: ${apt.proprio_id}`);
      console.log(`     Status: ${apt.status}`);
      console.log(`     Date: ${apt.main_slot}`);
      console.log(`     Créé: ${apt.created_at}`);
      console.log('     ---');
    });

    // 2. Filtrer les RDV confirmés
    const confirmedAppointments = allAppointments.filter(apt => apt.status === 'confirmed');
    console.log(`\n✅ Nombre de RDV confirmés: ${confirmedAppointments.length}`);

    if (confirmedAppointments.length === 0) {
      console.log('❌ Aucun RDV confirmé trouvé !');
      console.log('💡 Assurez-vous d\'avoir accepté le RDV en tant que PRO');
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
        user_id,
        prenom,
        nom,
        telephone,
        adresse,
        created_at
      `)
      .in('user_id', uniqueProprioIds)
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('❌ Erreur lors de la récupération des clients:', clientsError);
      return;
    }

    console.log(`✅ Nombre de clients trouvés: ${clients.length}`);
    clients.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.prenom} ${client.nom}`);
      console.log(`     ID: ${client.id}`);
      console.log(`     Téléphone: ${client.telephone}`);
      console.log(`     Adresse: ${client.adresse}`);
      console.log(`     Photo: Aucune`);
      console.log(`     Créé: ${client.created_at}`);
    });

    // 5. Calculer les statistiques pour chaque client
    console.log('\n5️⃣ Calcul des statistiques...');
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        // Récupérer tous les RDV avec ce client (utiliser user_id)
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, main_slot, status, created_at')
          .eq('proprio_id', client.user_id)
          .order('main_slot', { ascending: false });

        if (appointmentsError) {
          console.error(`❌ Erreur pour ${client.prenom} ${client.nom}:`, appointmentsError);
          return {
            id: client.id,
            nom: client.nom,
            prenom: client.prenom,
            photo: null,
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

        console.log(`  📊 ${client.prenom} ${client.nom}:`);
        console.log(`     Total RDV: ${totalRendezVous}`);
        console.log(`     RDV terminés: ${rendezVousTermines.length}`);
        console.log(`     Dernière visite: ${derniereVisite || 'N/A'}`);

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

    console.log('\n✅ Vérification terminée avec succès !');
    console.log('\n📋 Résumé:');
    console.log(`- RDV total: ${allAppointments.length}`);
    console.log(`- RDV confirmés: ${confirmedAppointments.length}`);
    console.log(`- Clients trouvés: ${clientsWithStats.length}`);

    console.log('\n💡 Maintenant, testez dans le navigateur :');
    console.log('1. Connectez-vous en tant que PRO (pro@test.com / 142536)');
    console.log('2. Allez dans "Mes clients"');
    console.log('3. Vous devriez voir vos vrais clients avec leurs vraies données !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

verifyRealData();
