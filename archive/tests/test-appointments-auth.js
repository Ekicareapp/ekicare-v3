const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAppointmentsAuth() {
  console.log('🔍 Test d\'authentification et création d\'appointments...');
  
  try {
    // 1. Trouver un utilisateur PROPRIETAIRE existant
    const { data: proprioUsers, error: proprioError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'PROPRIETAIRE')
      .limit(1);
    
    if (proprioError || !proprioUsers || proprioUsers.length === 0) {
      console.log('❌ Aucun utilisateur PROPRIETAIRE trouvé');
      return;
    }
    
    const proprioUser = proprioUsers[0];
    console.log('✅ Utilisateur PROPRIETAIRE trouvé:', proprioUser.email);
    
    // 2. Trouver un utilisateur PRO existant
    const { data: proUsers, error: proError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'PRO')
      .limit(1);
    
    if (proError || !proUsers || proUsers.length === 0) {
      console.log('❌ Aucun utilisateur PRO trouvé');
      return;
    }
    
    const proUser = proUsers[0];
    console.log('✅ Utilisateur PRO trouvé:', proUser.email);
    
    // 3. Trouver un équidé du propriétaire
    const { data: equides, error: equidesError } = await supabase
      .from('equides')
      .select('id, nom')
      .eq('proprio_id', proprioUser.id)
      .limit(1);
    
    if (equidesError || !equides || equides.length === 0) {
      console.log('❌ Aucun équidé trouvé pour ce propriétaire');
      return;
    }
    
    const equide = equides[0];
    console.log('✅ Équidé trouvé:', equide.nom);
    
    // 4. Tester la création d'un appointment avec service role
    console.log('🧪 Test de création d\'appointment...');
    
    const testAppointment = {
      pro_id: proUser.id,
      proprio_id: proprioUser.id,
      equide_ids: [equide.id],
      main_slot: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
      alternative_slots: [],
      comment: 'Test appointment via API',
      status: 'pending'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('appointments')
      .insert([testAppointment])
      .select();
    
    if (insertError) {
      console.error('❌ Erreur lors de l\'INSERT:', insertError);
      return;
    }
    
    console.log('✅ Appointment créé avec succès!');
    console.log('📋 ID:', insertData[0].id);
    console.log('📋 Statut:', insertData[0].status);
    
    // 5. Tester la récupération
    const { data: retrievedAppointments, error: retrieveError } = await supabase
      .from('appointments')
      .select('*')
      .eq('proprio_id', proprioUser.id);
    
    if (retrieveError) {
      console.error('❌ Erreur lors de la récupération:', retrieveError);
    } else {
      console.log(`✅ ${retrievedAppointments.length} appointments récupérés pour ce propriétaire`);
    }
    
    // 6. Nettoyer
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', insertData[0].id);
    
    if (deleteError) {
      console.error('❌ Erreur lors du nettoyage:', deleteError);
    } else {
      console.log('🧹 Nettoyage réussi');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAppointmentsAuth();
