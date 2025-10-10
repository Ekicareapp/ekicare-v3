const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAppointmentsTable() {
  console.log('🔍 Vérification de la table appointments...');
  
  try {
    // 1. Tester un SELECT simple pour voir si la table existe
    const { data: appointments, error: selectError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Erreur lors du SELECT test:', selectError);
      if (selectError.message.includes('relation "appointments" does not exist')) {
        console.log('💡 La table appointments n\'existe pas. Création nécessaire.');
      }
      return;
    }
    
    console.log('✅ Table appointments existe');
    console.log(`📊 Nombre d\'appointments trouvés: ${appointments.length}`);
    
    // 2. Tester un INSERT avec service role (bypass RLS)
    console.log('🧪 Test d\'INSERT avec service role...');
    
    const testAppointment = {
      pro_id: '00000000-0000-0000-0000-000000000000', // UUID factice
      proprio_id: '00000000-0000-0000-0000-000000000000', // UUID factice
      equide_ids: ['00000000-0000-0000-0000-000000000000'],
      main_slot: new Date().toISOString(),
      alternative_slots: [],
      comment: 'Test appointment',
      status: 'pending'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('appointments')
      .insert([testAppointment])
      .select();
    
    if (insertError) {
      console.error('❌ Erreur lors de l\'INSERT test:', insertError);
      return;
    }
    
    console.log('✅ INSERT test réussi');
    console.log('📋 Appointment créé:', insertData[0].id);
    
    // 3. Nettoyer le test
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

testAppointmentsTable();
