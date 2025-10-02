const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAppointmentDebug() {
  console.log('🔍 Test de debug pour les appointments...');
  
  try {
    // 1. Se connecter comme un propriétaire
    console.log('🔐 Connexion comme propriétaire...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'proprio.test@ekicare.com',
      password: 'password123'
    });
    
    if (authError || !authData.user) {
      console.error('❌ Erreur de connexion:', authError);
      return;
    }
    
    console.log('✅ Connecté comme:', authData.user.email);
    console.log('📋 User ID:', authData.user.id);
    console.log('📋 Access Token:', authData.session?.access_token?.substring(0, 20) + '...');
    
    // 2. Vérifier le cookie de session
    console.log('\n🍪 Test du cookie de session...');
    
    // Simuler la création du cookie comme le fait le frontend
    const sessionData = {
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      expires_in: authData.session?.expires_in,
      expires_at: authData.session?.expires_at,
      token_type: authData.session?.token_type,
      user: authData.user
    };
    
    console.log('📋 Session data:', JSON.stringify(sessionData, null, 2));
    
    // 3. Tester directement la création d'appointment avec le token
    console.log('\n🧪 Test de création d\'appointment avec token...');
    
    // Trouver un pro existant
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
    console.log('✅ Pro trouvé:', proUser.email);
    
    // Trouver un équidé
    const { data: equides, error: equidesError } = await supabase
      .from('equides')
      .select('id, nom')
      .eq('proprio_id', authData.user.id)
      .limit(1);
    
    if (equidesError || !equides || equides.length === 0) {
      console.log('❌ Aucun équidé trouvé');
      return;
    }
    
    const equide = equides[0];
    console.log('✅ Équidé trouvé:', equide.nom);
    
    // 4. Tester l'API avec fetch et les cookies
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    const appointmentData = {
      pro_id: proUser.id,
      equide_ids: [equide.id],
      main_slot: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      alternative_slots: [],
      comment: 'Test appointment via API debug',
      duration_minutes: 60
    };
    
    console.log('📋 Données à envoyer:', JSON.stringify(appointmentData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-krxujhjpzmknxphjqfbx-auth-token=${encodeURIComponent(JSON.stringify(sessionData))}`
      },
      body: JSON.stringify(appointmentData)
    });
    
    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log('📊 Response:', result);
    
    if (response.ok) {
      console.log('✅ Appointment créé avec succès!');
    } else {
      console.log('❌ Erreur lors de la création');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAppointmentDebug();
