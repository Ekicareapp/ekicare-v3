#!/usr/bin/env node

/**
 * Script de test pour vérifier la redirection après connexion
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testRedirect() {
  console.log('🧪 Test de redirection après connexion...\n');

  try {
    // 1. Test de connexion
    console.log('1. Test de connexion...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testproprio@ekicare.com',
        password: 'TestPassword123!'
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.error) {
      console.error('❌ Erreur de connexion:', loginData.error);
      return;
    }

    console.log('✅ Connexion réussie');
    console.log('   User ID:', loginData.user.id);
    console.log('   Email:', loginData.user.email);
    console.log('   Rôle:', loginData.user.role);
    console.log('   Session:', loginData.session ? '✅ Présente' : '❌ Manquante');

    // 2. Test d'accès au dashboard
    console.log('\n2. Test d\'accès au dashboard...');
    const dashboardResponse = await fetch(`${BASE_URL}/dashboard/proprietaire`, {
      headers: {
        'Cookie': `sb-krxujhjpzmknxpjhqfbx-auth-token=${loginData.session.access_token}`
      }
    });

    console.log('   Status:', dashboardResponse.status);
    console.log('   Headers:', Object.fromEntries(dashboardResponse.headers.entries()));

    if (dashboardResponse.status === 200) {
      console.log('✅ Dashboard accessible');
    } else if (dashboardResponse.status === 302) {
      const location = dashboardResponse.headers.get('location');
      console.log('🔄 Redirection vers:', location);
    } else {
      console.log('❌ Dashboard non accessible');
    }

    // 3. Test de l'API de test
    console.log('\n3. Test de l\'API de test...');
    const testResponse = await fetch(`${BASE_URL}/api/test`);
    const testData = await testResponse.json();
    console.log('   Utilisateurs dans la DB:', testData.data.length);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

if (require.main === module) {
  testRedirect().catch(console.error);
}

module.exports = { testRedirect };
