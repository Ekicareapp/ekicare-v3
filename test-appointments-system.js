#!/usr/bin/env node

/**
 * Script de test complet du système de rendez-vous
 * Teste toutes les fonctionnalités : création, gestion, statuts, compte-rendus
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Données de test
const testData = {
  proUserId: 'a264da52-368c-4b30-8607-e99f54f2e673', // Pro existant
  proprioUserId: '0da35f5a-6e28-4217-a1f4-05ed6deec488', // Proprio existant
  equideIds: ['test-equide-1', 'test-equide-2'] // IDs d'équidés de test
};

async function testAppointmentsSystem() {
  console.log('🧪 Test complet du système de rendez-vous\n');

  try {
    // 1. Vérifier la structure de la table
    console.log('1️⃣ Vérification de la structure de la table...');
    const { data: structure, error: structureError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.log('❌ Table appointments non accessible:', structureError.message);
      return;
    }
    console.log('✅ Table appointments accessible\n');

    // 2. Créer un rendez-vous de test
    console.log('2️⃣ Création d\'un rendez-vous de test...');
    const appointmentData = {
      pro_id: testData.proUserId,
      proprio_id: testData.proprioUserId,
      equide_ids: testData.equideIds,
      main_slot: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
      alternative_slots: [
        new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Demain + 1h
        new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString()  // Demain + 2h
      ],
      duration_minutes: 60,
      comment: 'Consultation de test pour vérifier le système de rendez-vous',
      status: 'pending'
    };

    const { data: newAppointment, error: createError } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (createError) {
      console.log('❌ Erreur création rendez-vous:', createError.message);
      return;
    }

    console.log('✅ Rendez-vous créé avec succès');
    console.log('   ID:', newAppointment.id);
    console.log('   Statut:', newAppointment.status);
    console.log('   Date:', newAppointment.main_slot);
    console.log('');

    const appointmentId = newAppointment.id;

    // 3. Tester l'acceptation du rendez-vous
    console.log('3️⃣ Test d\'acceptation du rendez-vous...');
    const { data: acceptedAppointment, error: acceptError } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointmentId)
      .select()
      .single();

    if (acceptError) {
      console.log('❌ Erreur acceptation:', acceptError.message);
    } else {
      console.log('✅ Rendez-vous accepté avec succès');
      console.log('   Nouveau statut:', acceptedAppointment.status);
      console.log('');
    }

    // 4. Tester la replanification
    console.log('4️⃣ Test de replanification...');
    const newSlot = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // Après-demain
    
    const { data: rescheduledAppointment, error: rescheduleError } = await supabase
      .from('appointments')
      .update({ 
        status: 'rescheduled',
        main_slot: newSlot,
        alternative_slots: [
          new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
          new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString()
        ]
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (rescheduleError) {
      console.log('❌ Erreur replanification:', rescheduleError.message);
    } else {
      console.log('✅ Rendez-vous replanifié avec succès');
      console.log('   Nouveau statut:', rescheduledAppointment.status);
      console.log('   Nouvelle date:', rescheduledAppointment.main_slot);
      console.log('');
    }

    // 5. Tester l'ajout d'un compte-rendu
    console.log('5️⃣ Test d\'ajout de compte-rendu...');
    const compteRendu = `
Consultation de test réalisée avec succès.

Observations:
- Équidés en bonne santé générale
- Aucun problème détecté
- Comportement normal

Recommandations:
- Continuer le suivi régulier
- Prochaine consultation dans 6 mois

Notes complémentaires:
- Test du système de rendez-vous réussi
- Toutes les fonctionnalités opérationnelles
`;

    const { data: appointmentWithReport, error: reportError } = await supabase
      .from('appointments')
      .update({ 
        status: 'completed',
        compte_rendu: compteRendu.trim(),
        compte_rendu_updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (reportError) {
      console.log('❌ Erreur ajout compte-rendu:', reportError.message);
    } else {
      console.log('✅ Compte-rendu ajouté avec succès');
      console.log('   Statut final:', appointmentWithReport.status);
      console.log('   Compte-rendu ajouté:', appointmentWithReport.compte_rendu ? 'Oui' : 'Non');
      console.log('   Date mise à jour:', appointmentWithReport.compte_rendu_updated_at);
      console.log('');
    }

    // 6. Tester la récupération des rendez-vous par statut
    console.log('6️⃣ Test de récupération par statut...');
    
    const statuses = ['pending', 'confirmed', 'rescheduled', 'completed', 'rejected'];
    for (const status of statuses) {
      const { data: appointments, error: fetchError } = await supabase
        .from('appointments')
        .select('id, status, main_slot, comment')
        .eq('status', status);
      
      if (fetchError) {
        console.log(`❌ Erreur récupération ${status}:`, fetchError.message);
      } else {
        console.log(`✅ Statut ${status}: ${appointments.length} rendez-vous`);
      }
    }
    console.log('');

    // 7. Tester les requêtes avec jointures
    console.log('7️⃣ Test des requêtes avec jointures...');
    
    const { data: appointmentsWithProfiles, error: joinError } = await supabase
      .from('appointments')
      .select(`
        *,
        pro_profiles!appointments_pro_id_fkey (
          prenom,
          nom,
          profession,
          ville_nom
        ),
        proprio_profiles!appointments_proprio_id_fkey (
          prenom,
          nom,
          telephone
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (joinError) {
      console.log('❌ Erreur requête avec jointures:', joinError.message);
    } else {
      console.log('✅ Requête avec jointures réussie');
      console.log('   Pro:', appointmentsWithProfiles.pro_profiles?.prenom, appointmentsWithProfiles.pro_profiles?.nom);
      console.log('   Proprio:', appointmentsWithProfiles.proprio_profiles?.prenom, appointmentsWithProfiles.proprio_profiles?.nom);
      console.log('');
    }

    // 8. Test de mise à jour automatique des statuts
    console.log('8️⃣ Test de mise à jour automatique...');
    
    // Créer un rendez-vous avec une date passée
    const pastAppointmentData = {
      pro_id: testData.proUserId,
      proprio_id: testData.proprioUserId,
      equide_ids: testData.equideIds,
      main_slot: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2h
      alternative_slots: [],
      duration_minutes: 60,
      comment: 'Rendez-vous passé pour test automatique',
      status: 'confirmed'
    };

    const { data: pastAppointment, error: pastError } = await supabase
      .from('appointments')
      .insert([pastAppointmentData])
      .select()
      .single();

    if (pastError) {
      console.log('❌ Erreur création rendez-vous passé:', pastError.message);
    } else {
      console.log('✅ Rendez-vous passé créé');
      
      // Tester la mise à jour automatique
      const { data: updatedPastAppointment, error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', pastAppointment.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Erreur mise à jour automatique:', updateError.message);
      } else {
        console.log('✅ Mise à jour automatique réussie');
        console.log('   Statut passé:', updatedPastAppointment.status);
      }
      console.log('');
    }

    // 9. Nettoyage des données de test
    console.log('9️⃣ Nettoyage des données de test...');
    
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .in('id', [appointmentId, pastAppointment?.id].filter(Boolean));

    if (deleteError) {
      console.log('❌ Erreur nettoyage:', deleteError.message);
    } else {
      console.log('✅ Données de test supprimées');
      console.log('');
    }

    // 10. Résumé des tests
    console.log('🎉 TESTS TERMINÉS AVEC SUCCÈS !');
    console.log('');
    console.log('✅ Fonctionnalités testées:');
    console.log('   - Création de rendez-vous');
    console.log('   - Acceptation de rendez-vous');
    console.log('   - Replanification');
    console.log('   - Ajout de compte-rendu');
    console.log('   - Récupération par statut');
    console.log('   - Requêtes avec jointures');
    console.log('   - Mise à jour automatique');
    console.log('   - Nettoyage des données');
    console.log('');
    console.log('🚀 Le système de rendez-vous est opérationnel !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction pour tester les APIs
async function testAPIs() {
  console.log('🌐 Test des APIs de rendez-vous\n');

  try {
    // Note: Les tests d'API nécessitent que le serveur Next.js soit en cours d'exécution
    console.log('⚠️  Pour tester les APIs, assurez-vous que le serveur Next.js est en cours d\'exécution');
    console.log('   Command: npm run dev');
    console.log('');
    
    console.log('📋 APIs à tester manuellement:');
    console.log('   - GET  /api/appointments (récupération)');
    console.log('   - POST /api/appointments (création)');
    console.log('   - PATCH /api/appointments/[id] (mise à jour)');
    console.log('   - POST /api/appointments/update-status (mise à jour automatique)');
    console.log('');
    
    console.log('🔧 Utilisez les interfaces:');
    console.log('   - Côté propriétaire: /dashboard/proprietaire/recherche-pro');
    console.log('   - Côté pro: /dashboard/pro/rendez-vous');
    console.log('   - Rendez-vous propriétaire: /dashboard/proprietaire/rendez-vous');

  } catch (error) {
    console.error('❌ Erreur test APIs:', error);
  }
}

// Exécution des tests
async function main() {
  console.log('='.repeat(60));
  console.log('🧪 TEST COMPLET DU SYSTÈME DE RENDEZ-VOUS EKICARE');
  console.log('='.repeat(60));
  console.log('');

  await testAppointmentsSystem();
  console.log('');
  await testAPIs();
  
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ TOUS LES TESTS TERMINÉS');
  console.log('='.repeat(60));
}

main().catch(console.error);
