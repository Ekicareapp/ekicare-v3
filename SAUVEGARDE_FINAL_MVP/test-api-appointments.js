// Test simple de l'API appointments
const fetch = require('node-fetch');

async function testAPI() {
  console.log('🔍 Test de l\'API /api/appointments...\n');

  try {
    // Test sans authentification (doit échouer)
    console.log('1️⃣ Test sans authentification:');
    const response1 = await fetch('http://localhost:3000/api/appointments');
    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', result1);

    console.log('\n2️⃣ Test avec un token factice:');
    const response2 = await fetch('http://localhost:3000/api/appointments', {
      headers: {
        'Authorization': 'Bearer fake-token'
      }
    });
    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', result2);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAPI();





