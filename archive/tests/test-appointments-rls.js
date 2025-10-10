const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testRLS() {
  console.log('🧪 Test des politiques RLS pour appointments\n');

  // Test 1: Vérifier si on peut lire les appointments sans auth
  console.log('Test 1: Lecture sans authentification');
  const { data: noAuthData, error: noAuthError } = await supabase
    .from('appointments')
    .select('*')
    .limit(5);

  if (noAuthError) {
    console.log('❌ Erreur (attendu):', noAuthError.message);
  } else {
    console.log('⚠️ Données accessibles sans auth:', noAuthData?.length || 0);
  }

  console.log('\n---\n');

  // Test 2: Se connecter et essayer de lire
  console.log('Test 2: Connexion avec un utilisateur test');
  
  // Vous devrez remplacer ces credentials par un utilisateur test réel
  const testEmail = 'test@example.com'; // À remplacer
  const testPassword = 'password'; // À remplacer

  console.log('⚠️ Pour tester avec un vrai utilisateur, mettez à jour ce script avec vos credentials');
  
  console.log('\n---\n');

  // Test 3: Vérifier les politiques RLS existantes
  console.log('Test 3: Vérification des politiques RLS');
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: policies, error: policiesError } = await supabaseAdmin
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'appointments');

  if (policiesError) {
    console.log('❌ Erreur lors de la récupération des politiques:', policiesError.message);
  } else {
    console.log('✅ Politiques RLS trouvées:', policies?.length || 0);
    policies?.forEach(p => {
      console.log(`  - ${p.policyname}: ${p.cmd} pour ${p.roles?.join(', ')}`);
    });
  }

  console.log('\n---\n');

  // Test 4: Compter les appointments dans la base
  console.log('Test 4: Nombre total d\'appointments (avec service role)');
  const { count, error: countError } = await supabaseAdmin
    .from('appointments')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('❌ Erreur:', countError.message);
  } else {
    console.log('✅ Total appointments dans la base:', count);
  }

  console.log('\n---\n');

  // Test 5: Récupérer un appointment exemple
  console.log('Test 5: Exemple d\'appointment');
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
    console.log('  - Date:', example?.main_slot);
  }
}

testRLS().catch(console.error);

