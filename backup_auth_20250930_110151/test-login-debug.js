#!/usr/bin/env node

/**
 * Script de debug pour tester la connexion
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testLoginDebug() {
  console.log('🔍 DEBUG: Test de connexion avec logs détaillés\n');

  // Test 1: Vérifier l'API de test
  console.log('1. Test de l\'API /api/test...');
  try {
    const testResponse = await fetch(`${BASE_URL}/api/test`);
    const testData = await testResponse.json();
    console.log('   Réponse:', testData);
  } catch (error) {
    console.error('   Erreur:', error.message);
  }

  // Test 2: Créer un utilisateur via l'API d'inscription
  console.log('\n2. Création d\'un utilisateur via /api/auth/signup...');
  try {
    const formData = new FormData();
    formData.append('email', 'debug@ekicare.com');
    formData.append('password', 'DebugPassword123!');
    formData.append('role', 'PROPRIETAIRE');
    formData.append('prenom', 'Debug');
    formData.append('nom', 'User');
    formData.append('telephone', '0612345678');
    formData.append('adresse', '123 Rue Debug');

    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      body: formData
    });

    const signupData = await signupResponse.json();
    console.log('   Réponse signup:', JSON.stringify(signupData, null, 2));
  } catch (error) {
    console.error('   Erreur signup:', error.message);
  }

  // Test 3: Vérifier à nouveau l'API de test
  console.log('\n3. Vérification après inscription...');
  try {
    const testResponse2 = await fetch(`${BASE_URL}/api/test`);
    const testData2 = await testResponse2.json();
    console.log('   Réponse:', testData2);
  } catch (error) {
    console.error('   Erreur:', error.message);
  }

  // Test 4: Test de connexion
  console.log('\n4. Test de connexion...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'debug@ekicare.com',
        password: 'DebugPassword123!'
      })
    });

    const loginData = await loginResponse.json();
    console.log('   Réponse login:', JSON.stringify(loginData, null, 2));
  } catch (error) {
    console.error('   Erreur login:', error.message);
  }
}

// Exécution
if (require.main === module) {
  testLoginDebug().catch(console.error);
}

module.exports = { testLoginDebug };
