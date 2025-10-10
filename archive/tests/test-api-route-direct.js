const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAPIRouteDirect() {
  console.log('🔍 Test direct de la logique API route...');
  
  try {
    // 1. Trouver un propriétaire et un pro
    const { data: proprioUsers, error: proprioError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'PROPRIETAIRE')
      .limit(1);
    
    if (proprioError || !proprioUsers || proprioUsers.length === 0) {
      console.log('❌ Aucun propriétaire trouvé');
      return;
    }
    
    const { data: proUsers, error: proError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'PRO')
      .limit(1);
    
    if (proError || !proUsers || proUsers.length === 0) {
      console.log('❌ Aucun pro trouvé');
      return;
    }
    
    const proprioUser = proprioUsers[0];
    const proUser = proUsers[0];
    
    console.log('✅ Propriétaire:', proprioUser.email, '(ID:', proprioUser.id + ')');
    console.log('✅ Pro:', proUser.email, '(ID:', proUser.id + ')');
    
    // 2. Trouver un équidé
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
    console.log('✅ Équidé:', equide.nom, '(ID:', equide.id + ')');
    
    // 3. Tester la création d'appointment avec service role (bypass RLS)
    console.log('\n🧪 Test de création d\'appointment avec service role...');
    
    const appointmentData = {
      pro_id: proUser.id,
      proprio_id: proprioUser.id,
      equide_ids: [equide.id],
      main_slot: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      alternative_slots: [],
      comment: 'Test appointment via service role',
      status: 'pending',
      duration_minutes: 60
    };
    
    console.log('📋 Données à insérer:', JSON.stringify(appointmentData, null, 2));
    
    const { data: insertData, error: insertError } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select();
    
    if (insertError) {
      console.error('❌ Erreur lors de l\'INSERT:', insertError);
      return;
    }
    
    console.log('✅ Appointment créé avec succès!');
    console.log('📋 ID:', insertData[0].id);
    
    // 4. Tester la récupération
    console.log('\n📖 Test de récupération...');
    
    const { data: retrievedAppointments, error: retrieveError } = await supabase
      .from('appointments')
      .select(`
        *,
        proprio_profiles!inner (
          prenom, nom, telephone
        ),
        pro_profiles!inner (
          prenom, nom, telephone, profession, ville_nom, photo_url, average_consultation_duration
        )
      `)
      .eq('proprio_id', proprioUser.id);
    
    if (retrieveError) {
      console.error('❌ Erreur lors de la récupération:', retrieveError);
    } else {
      console.log(`✅ ${retrievedAppointments.length} appointments récupérés`);
      if (retrievedAppointments.length > 0) {
        console.log('📋 Premier appointment:', {
          id: retrievedAppointments[0].id,
          status: retrievedAppointments[0].status,
          comment: retrievedAppointments[0].comment,
          pro: `${retrievedAppointments[0].pro_profiles.prenom} ${retrievedAppointments[0].pro_profiles.nom}`,
          proprio: `${retrievedAppointments[0].proprio_profiles.prenom} ${retrievedAppointments[0].proprio_profiles.nom}`
        });
      }
    }
    
    // 5. Nettoyer
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

testAPIRouteDirect();
