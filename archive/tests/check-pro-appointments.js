const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProAppointments() {
  console.log('🔍 Vérification des appointments pour le pro\n');

  const proId = '5b2a671d-2d81-40e8-bc9e-eb2305896e28'; // ID du profil pro
  const userId = '7fd41066-b43a-4808-a917-ac25e332c56a'; // User ID du pro

  // Test 1: Vérifier le profil pro
  console.log('Test 1: Profil pro');
  const { data: proProfile, error: proError } = await supabaseAdmin
    .from('pro_profiles')
    .select('*')
    .eq('id', proId)
    .single();

  if (proError) {
    console.log('❌ Erreur profil pro:', proError.message);
  } else {
    console.log('✅ Profil pro trouvé:');
    console.log('  - ID:', proProfile.id);
    console.log('  - User ID:', proProfile.user_id);
    console.log('  - Nom:', proProfile.prenom, proProfile.nom);
    console.log('  - Total appointments:', proProfile.total_appointments);
    console.log('  - Completed appointments:', proProfile.completed_appointments);
  }

  // Test 2: Compter les appointments pour ce pro
  console.log('\nTest 2: Appointments pour ce pro');
  const { data: appointments, error: appointmentsError } = await supabaseAdmin
    .from('appointments')
    .select('*')
    .eq('pro_id', proId);

  if (appointmentsError) {
    console.log('❌ Erreur appointments:', appointmentsError.message);
  } else {
    console.log('✅ Appointments trouvés:', appointments?.length || 0);
    appointments?.forEach((apt, index) => {
      console.log(`  ${index + 1}. ID: ${apt.id}, Status: ${apt.status}, Date: ${apt.main_slot}`);
    });
  }

  // Test 3: Compter par statut
  console.log('\nTest 3: Répartition par statut');
  const statusCounts = {};
  appointments?.forEach(apt => {
    statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
  });
  console.log('Statuts:', statusCounts);

  // Test 4: Mettre à jour le total_appointments
  console.log('\nTest 4: Mise à jour du total_appointments');
  const totalCount = appointments?.length || 0;
  const completedCount = appointments?.filter(apt => apt.status === 'completed').length || 0;

  const { error: updateError } = await supabaseAdmin
    .from('pro_profiles')
    .update({
      total_appointments: totalCount,
      completed_appointments: completedCount
    })
    .eq('id', proId);

  if (updateError) {
    console.log('❌ Erreur mise à jour:', updateError.message);
  } else {
    console.log('✅ Profil mis à jour:');
    console.log('  - Total appointments:', totalCount);
    console.log('  - Completed appointments:', completedCount);
  }

  // Test 5: Vérifier la mise à jour
  console.log('\nTest 5: Vérification après mise à jour');
  const { data: updatedProfile } = await supabaseAdmin
    .from('pro_profiles')
    .select('total_appointments, completed_appointments')
    .eq('id', proId)
    .single();

  console.log('✅ Profil après mise à jour:');
  console.log('  - Total appointments:', updatedProfile?.total_appointments);
  console.log('  - Completed appointments:', updatedProfile?.completed_appointments);
}

checkProAppointments().catch(console.error);
