// Script pour mettre à jour immédiatement tous les anciens rendez-vous passés
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://krxujhjpzmknxphjqfbx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updatePastAppointments() {
  console.log('🔄 Mise à jour de tous les anciens rendez-vous passés...\n');
  
  try {
    // 1. Identifier tous les rendez-vous passés qui ne sont pas encore "terminé"
    console.log('1️⃣ Recherche des rendez-vous passés à mettre à jour...');
    
    const { data: pastAppointments, error: fetchError } = await supabase
      .from('appointments')
      .select('id, main_slot, status, comment, pro_id')
      .in('status', ['confirmed', 'pending', 'rescheduled'])
      .lt('main_slot', new Date().toISOString())
      .order('main_slot', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Erreur lors de la récupération:', fetchError);
      return;
    }
    
    if (!pastAppointments || pastAppointments.length === 0) {
      console.log('✅ Aucun ancien rendez-vous à mettre à jour !');
      return;
    }
    
    console.log(`📊 ${pastAppointments.length} rendez-vous passés trouvés :`);
    pastAppointments.forEach((apt, index) => {
      const date = new Date(apt.main_slot);
      console.log(`   ${index + 1}. ${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR')} - ${apt.status} - ${apt.comment || 'Sans commentaire'}`);
    });
    
    // 2. Mettre à jour tous ces rendez-vous en statut "terminé"
    console.log('\n2️⃣ Mise à jour des statuts...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status: 'terminé',
        updated_at: new Date().toISOString()
      })
      .in('id', pastAppointments.map(apt => apt.id))
      .select('id, main_slot, status, updated_at');
    
    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError);
      return;
    }
    
    console.log(`✅ ${updateResult?.length || 0} rendez-vous mis à jour avec succès !`);
    
    // 3. Vérifier les résultats
    console.log('\n3️⃣ Vérification des résultats...');
    
    const { data: updatedAppointments, error: verifyError } = await supabase
      .from('appointments')
      .select('id, main_slot, status, updated_at, comment')
      .in('id', pastAppointments.map(apt => apt.id))
      .eq('status', 'terminé');
    
    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError);
      return;
    }
    
    console.log('📋 Rendez-vous mis à jour :');
    updatedAppointments?.forEach((apt, index) => {
      const date = new Date(apt.main_slot);
      const updated = new Date(apt.updated_at);
      console.log(`   ${index + 1}. ${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR')} - ${apt.status} - Mis à jour: ${updated.toLocaleString('fr-FR')}`);
    });
    
    // 4. Statistiques finales
    console.log('\n📊 Statistiques finales :');
    console.log(`   • Rendez-vous passés trouvés: ${pastAppointments.length}`);
    console.log(`   • Rendez-vous mis à jour: ${updateResult?.length || 0}`);
    console.log(`   • Statut final: terminé`);
    console.log(`   • Heure de mise à jour: ${new Date().toLocaleString('fr-FR')}`);
    
    console.log('\n🎉 Mise à jour terminée avec succès !');
    console.log('💡 Les rendez-vous sont maintenant visibles dans l\'onglet "Terminés" côté pro et propriétaire.');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction alternative utilisant l'API
async function updateViaAPI() {
  console.log('🔄 Tentative de mise à jour via l\'API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/appointments/update-statuses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Mise à jour via API réussie:', result);
    } else {
      console.error('❌ Erreur API:', response.status, await response.text());
    }
  } catch (apiError) {
    console.error('❌ Erreur lors de l\'appel API:', apiError.message);
    console.log('💡 Essayez d\'exécuter le serveur Next.js d\'abord (npm run dev)');
  }
}

// Exécuter la mise à jour
updatePastAppointments().catch(() => {
  console.log('\n🔄 Tentative alternative via l\'API...');
  updateViaAPI();
});
