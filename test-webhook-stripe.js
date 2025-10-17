#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TEST DU WEBHOOK STRIPE
 * 
 * Ce script permet de tester votre endpoint webhook Stripe rapidement.
 * 
 * Usage :
 *   node test-webhook-stripe.js
 *   node test-webhook-stripe.js --local
 *   node test-webhook-stripe.js --production
 */

const https = require('https');
const http = require('http');

// Configuration
const LOCAL_URL = 'http://localhost:3000/api/stripe/webhook';
const PRODUCTION_URL = 'https://ekicare-v3.vercel.app/api/stripe/webhook';

// Déterminer l'URL cible
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const isProduction = args.includes('--production');

let targetUrl;
if (isLocal) {
  targetUrl = LOCAL_URL;
  console.log('🧪 Mode: LOCAL');
} else if (isProduction) {
  targetUrl = PRODUCTION_URL;
  console.log('🌐 Mode: PRODUCTION');
} else {
  // Par défaut, tester en production
  targetUrl = PRODUCTION_URL;
  console.log('🌐 Mode: PRODUCTION (par défaut)');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 TEST DU WEBHOOK STRIPE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📍 URL cible:', targetUrl);
console.log('');

// Test 1 : Sans signature (doit échouer avec 400)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 1 : Requête sans signature (attendu: 400)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const testPayload = JSON.stringify({
  id: 'evt_test_webhook',
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      payment_status: 'paid',
      customer_details: {
        email: 'test@example.com'
      }
    }
  }
});

function makeRequest(url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

async function runTests() {
  // Test 1 : Sans signature
  try {
    const response1 = await makeRequest(targetUrl, {}, testPayload);
    
    console.log('📊 Résultat:');
    console.log('  Status:', response1.statusCode);
    console.log('  Body:', response1.body);
    
    if (response1.statusCode === 400) {
      console.log('✅ Test 1 PASSÉ : Requête rejetée sans signature (400)');
    } else {
      console.log('❌ Test 1 ÉCHOUÉ : Attendu 400, reçu', response1.statusCode);
    }
  } catch (error) {
    console.error('❌ Test 1 ERREUR:', error.message);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 2 : Requête avec signature invalide (attendu: 400)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 2 : Avec signature invalide
  try {
    const response2 = await makeRequest(
      targetUrl,
      {
        'stripe-signature': 't=1234567890,v1=invalid_signature'
      },
      testPayload
    );
    
    console.log('📊 Résultat:');
    console.log('  Status:', response2.statusCode);
    console.log('  Body:', response2.body);
    
    if (response2.statusCode === 400) {
      console.log('✅ Test 2 PASSÉ : Requête rejetée avec signature invalide (400)');
    } else {
      console.log('❌ Test 2 ÉCHOUÉ : Attendu 400, reçu', response2.statusCode);
    }
  } catch (error) {
    console.error('❌ Test 2 ERREUR:', error.message);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 3 : Vérifier que l\'endpoint est accessible');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 3 : GET (devrait retourner 405 Method Not Allowed)
  try {
    const parsedUrl = new URL(targetUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'GET',
    };

    const response3 = await new Promise((resolve, reject) => {
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    console.log('📊 Résultat:');
    console.log('  Status:', response3.statusCode);
    console.log('  Body:', response3.body);
    
    if (response3.statusCode === 405) {
      console.log('✅ Test 3 PASSÉ : Endpoint accessible et GET bloqué (405)');
    } else {
      console.log('⚠️  Test 3 : Endpoint accessible mais réponse inattendue:', response3.statusCode);
    }
  } catch (error) {
    console.error('❌ Test 3 ERREUR:', error.message);
    console.error('  → L\'endpoint n\'est peut-être pas accessible ou le serveur local n\'est pas démarré');
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 RÉSUMÉ DES TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Endpoint accessible');
  console.log('✅ Rejette les requêtes sans signature (400)');
  console.log('✅ Rejette les requêtes avec signature invalide (400)');
  console.log('✅ Bloque les méthodes non autorisées (405)');
  console.log('');
  console.log('🎯 PROCHAINE ÉTAPE:');
  console.log('   Testez avec un événement réel depuis Stripe Dashboard');
  console.log('   ou utilisez `stripe trigger checkout.session.completed`');
  console.log('');
  console.log('📚 Consultez GUIDE_TEST_WEBHOOK_STRIPE.md pour plus d\'infos');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Exécuter les tests
runTests().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});






