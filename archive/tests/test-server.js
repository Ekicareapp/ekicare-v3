#!/usr/bin/env node

/**
 * Script simple pour vérifier que le serveur Ekicare fonctionne
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testServer() {
  console.log('🔍 Vérification du serveur Ekicare...\n');
  
  try {
    // Test 1: Vérifier que le serveur répond
    console.log('1. Test de connectivité...');
    const response = await fetch(`${BASE_URL}/api/test`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Serveur accessible');
      console.log(`   Réponse: ${JSON.stringify(data, null, 2)}\n`);
    } else {
      console.log('❌ Serveur non accessible');
      console.log(`   Status: ${response.status}\n`);
      return false;
    }
    
    // Test 2: Vérifier les pages principales
    console.log('2. Test des pages principales...');
    
    const pages = [
      { name: 'Login', url: '/login' },
      { name: 'Signup', url: '/signup' },
      { name: 'Paiement Requis', url: '/paiement-requis' },
      { name: 'Success Pro', url: '/success-pro' }
    ];
    
    for (const page of pages) {
      try {
        const pageResponse = await fetch(`${BASE_URL}${page.url}`);
        if (pageResponse.ok) {
          console.log(`✅ ${page.name} accessible`);
        } else {
          console.log(`❌ ${page.name} non accessible (${pageResponse.status})`);
        }
      } catch (error) {
        console.log(`❌ ${page.name} erreur: ${error.message}`);
      }
    }
    
    console.log('\n3. Test des endpoints API...');
    
    // Test 3: Vérifier les endpoints API
    const endpoints = [
      { name: 'Auth Signup', url: '/api/auth/signup', method: 'POST' },
      { name: 'Auth Login', url: '/api/auth/login', method: 'POST' },
      { name: 'Auth Logout', url: '/api/auth/logout', method: 'POST' },
      { name: 'Checkout Session', url: '/api/checkout-session', method: 'POST' },
      { name: 'Profile', url: '/api/profile', method: 'GET' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const options = {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        };
        
        if (endpoint.method === 'POST') {
          options.body = JSON.stringify({ test: 'data' });
        }
        
        const apiResponse = await fetch(`${BASE_URL}${endpoint.url}`, options);
        
        // On s'attend à des erreurs 400/401 pour les endpoints POST sans données valides
        if (apiResponse.status === 200 || apiResponse.status === 400 || apiResponse.status === 401) {
          console.log(`✅ ${endpoint.name} répond (${apiResponse.status})`);
        } else {
          console.log(`❌ ${endpoint.name} erreur inattendue (${apiResponse.status})`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} erreur: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Tests de base terminés !');
    console.log('\n📋 Prochaines étapes :');
    console.log('1. Exécutez le script complet : node test-auth-flow.js');
    console.log('2. Importez la collection Postman : Ekicare-Auth-Test-Collection.postman_collection.json');
    console.log('3. Exécutez le script SQL : test-database-structure.sql');
    
    return true;
    
  } catch (error) {
    console.log('❌ Erreur lors de la vérification du serveur');
    console.log(`   ${error.message}`);
    console.log('\n🔧 Vérifiez que :');
    console.log('1. Le serveur est démarré : npm run dev');
    console.log('2. Le serveur écoute sur le port 3000');
    console.log('3. Les variables d\'environnement sont configurées');
    return false;
  }
}

// Exécution
if (require.main === module) {
  testServer().catch(console.error);
}

module.exports = { testServer };
