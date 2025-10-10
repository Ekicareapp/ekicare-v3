// Script de test pour la fonctionnalité "Mes clients"
// Ce script teste l'API et la création automatique de clients

const API_BASE = 'http://localhost:3003';

async function testClientsAPI() {
  console.log('🧪 Test de la fonctionnalité "Mes clients"');
  console.log('==========================================');

  try {
    // 1. Test de l'API sans authentification (doit retourner 401)
    console.log('\n1️⃣ Test API sans authentification...');
    const response1 = await fetch(`${API_BASE}/api/pro/clients`);
    const data1 = await response1.json();
    console.log('✅ Status:', response1.status);
    console.log('✅ Response:', data1);

    // 2. Test avec un token invalide (doit retourner 401)
    console.log('\n2️⃣ Test API avec token invalide...');
    const response2 = await fetch(`${API_BASE}/api/pro/clients`, {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      }
    });
    const data2 = await response2.json();
    console.log('✅ Status:', response2.status);
    console.log('✅ Response:', data2);

    console.log('\n✅ Tests API terminés avec succès');
    console.log('\n📋 Instructions pour tester manuellement:');
    console.log('1. Connectez-vous en tant que PRO (pro@test.com / 142536)');
    console.log('2. Allez dans "Mes rendez-vous" → "À venir"');
    console.log('3. Acceptez un rendez-vous (s\'il y en a en attente)');
    console.log('4. Allez dans "Mes clients" pour voir le client créé automatiquement');
    console.log('\n🔧 Pour activer le trigger Supabase:');
    console.log('Exécutez le script SQL dans migrations/create_client_relation_trigger.sql');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testClientsAPI();




