const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: '.env.local' });

async function testAPIAppointments() {
  console.log('🔍 Test de l\'API /api/appointments...');
  
  try {
    // 1. Tester un GET sans authentification
    console.log('🧪 Test GET sans authentification...');
    const getResponse = await fetch('http://localhost:3002/api/appointments');
    const getResult = await getResponse.json();
    
    console.log(`📊 GET Status: ${getResponse.status}`);
    console.log(`📊 GET Response:`, getResult);
    
    // 2. Tester un POST sans authentification
    console.log('\n🧪 Test POST sans authentification...');
    const postResponse = await fetch('http://localhost:3002/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pro_id: 'test',
        equide_ids: ['test'],
        main_slot: new Date().toISOString(),
        comment: 'Test'
      })
    });
    
    const postResult = await postResponse.json();
    console.log(`📊 POST Status: ${postResponse.status}`);
    console.log(`📊 POST Response:`, postResult);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Attendre que le serveur soit prêt
setTimeout(testAPIAppointments, 3000);
