// Script de test pour la mise à jour automatique des statuts
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://krxujhjpzmknxphjqfbx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testAutoStatusUpdate() {
  console.log('🧪 Test de la mise à jour automatique des statuts\n');
  
  // 1. Vérifier les rendez-vous en attente de mise à jour
  console.log('1️⃣ Vérification des rendez-vous en attente...');
  
  const { data: pendingAppointments, error: pendingError } = await supabase
    .from('appointments')
    .select('id, main_slot, status, comment')
    .in('status', ['confirmed', 'pending', 'rescheduled'])
    .lt('main_slot', new Date().toISOString());
  
  if (pendingError) {
    console.error('❌ Erreur:', pendingError);
    return;
  }
  
  console.log(`📊 ${pendingAppointments?.length || 0} rendez-vous en attente de mise à jour:`);
  pendingAppointments?.forEach((apt, index) => {
    const date = new Date(apt.main_slot);
    console.log(`   ${index + 1}. ${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR')} - ${apt.status} - ${apt.comment}`);
  });
  
  // 2. Tester la fonction de mise à jour
  console.log('\n2️⃣ Test de la fonction de mise à jour...');
  
  const { data: updateResult, error: updateError } = await supabase.rpc('manual_update_appointment_statuses');
  
  if (updateError) {
    console.error('❌ Erreur lors de la mise à jour:', updateError);
    return;
  }
  
  console.log('✅ Résultat de la mise à jour:', updateResult);
  
  // 3. Vérifier que les statuts ont été mis à jour
  console.log('\n3️⃣ Vérification des statuts mis à jour...');
  
  const { data: updatedAppointments, error: updatedError } = await supabase
    .from('appointments')
    .select('id, main_slot, status, comment, updated_at')
    .eq('status', 'terminé')
    .gte('updated_at', new Date(Date.now() - 60000).toISOString()); // Mis à jour dans la dernière minute
  
  if (updatedError) {
    console.error('❌ Erreur:', updatedError);
    return;
  }
  
  console.log(`📋 ${updatedAppointments?.length || 0} rendez-vous récemment mis à jour:`);
  updatedAppointments?.forEach((apt, index) => {
    const date = new Date(apt.main_slot);
    const updated = new Date(apt.updated_at);
    console.log(`   ${index + 1}. ${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR')} - ${apt.status} - Mis à jour: ${updated.toLocaleString('fr-FR')}`);
  });
  
  // 4. Tester l'API
  console.log('\n4️⃣ Test de l\'API de mise à jour...');
  
  try {
    const response = await fetch('http://localhost:3000/api/appointments/update-statuses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const apiResult = await response.json();
      console.log('✅ API de mise à jour:', apiResult);
    } else {
      console.error('❌ Erreur API:', response.status, await response.text());
    }
  } catch (apiError) {
    console.error('❌ Erreur lors du test API:', apiError.message);
  }
  
  console.log('\n🎯 Test terminé!');
}

testAutoStatusUpdate();
