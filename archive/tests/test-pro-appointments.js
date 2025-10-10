const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testProAppointments() {
  console.log('🧪 Test des rendez-vous PRO\n');

  // Test 1: Vérifier RLS
  console.log('Test 1: Vérification RLS');
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: rlsStatus } = await supabaseAdmin
    .from('pg_tables')
    .select('rowsecurity')
    .eq('tablename', 'appointments')
    .single();

  console.log('RLS activé:', rlsStatus?.rowsecurity);

  // Test 2: Compter les appointments
  console.log('\nTest 2: Nombre total d\'appointments');
  const { count, error: countError } = await supabaseAdmin
    .from('appointments')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('❌ Erreur:', countError.message);
  } else {
    console.log('✅ Total appointments:', count);
  }

  // Test 3: Récupérer un appointment exemple
  console.log('\nTest 3: Appointment exemple');
  const { data: example, error: exampleError } = await supabaseAdmin
    .from('appointments')
    .select('*')
    .limit(1)
    .single();

  if (exampleError) {
    console.log('❌ Erreur:', exampleError.message);
  } else {
    console.log('✅ Appointment exemple:');
    console.log('  - ID:', example?.id);
    console.log('  - Pro ID:', example?.pro_id);
    console.log('  - Proprio ID:', example?.proprio_id);
    console.log('  - Status:', example?.status);
  }

  // Test 4: Essayer de récupérer avec l'ID du pro
  if (example?.pro_id) {
    console.log('\nTest 4: Récupération par pro_id');
    const { data: proAppointments, error: proError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('pro_id', example.pro_id);

    if (proError) {
      console.log('❌ Erreur:', proError.message);
    } else {
      console.log('✅ Appointments pour ce pro:', proAppointments?.length || 0);
    }
  }

  // Test 5: Vérifier le profil pro
  if (example?.pro_id) {
    console.log('\nTest 5: Vérification profil pro');
    const { data: proProfile, error: proProfileError } = await supabaseAdmin
      .from('pro_profiles')
      .select('id, user_id, prenom, nom')
      .eq('id', example.pro_id)
      .single();

    if (proProfileError) {
      console.log('❌ Erreur profil pro:', proProfileError.message);
    } else {
      console.log('✅ Profil pro trouvé:');
      console.log('  - ID:', proProfile.id);
      console.log('  - User ID:', proProfile.user_id);
      console.log('  - Nom:', proProfile.prenom, proProfile.nom);
    }
  }
}

testProAppointments().catch(console.error);
