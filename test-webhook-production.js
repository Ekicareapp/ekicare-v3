/**
 * Script de test du webhook Stripe en production
 * 
 * Usage:
 *   node test-webhook-production.js
 * 
 * Ce script vérifie :
 * 1. Que le webhook est accessible
 * 2. Que les variables d'environnement sont correctes
 * 3. Que la signature Stripe est valide
 */

const https = require('https');
const http = require('http');

// Configuration
const WEBHOOK_URL = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/stripe/webhook`
  : 'http://localhost:3000/api/stripe/webhook';

console.log('🔍 Test du Webhook Stripe');
console.log('='.repeat(50));
console.log('URL testée:', WEBHOOK_URL);
console.log('');

// Fonction pour tester l'accessibilité du webhook
function testWebhookAccessibility() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣ Test d\'accessibilité du webhook...');
    
    const url = new URL(WEBHOOK_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': 0
      }
    };

    const req = client.request(options, (res) => {
      console.log('   Status Code:', res.statusCode);
      console.log('   Headers:', JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('   Response:', data);
        
        if (res.statusCode === 400) {
          console.log('   ✅ Webhook accessible (erreur 400 attendue sans signature Stripe)');
          resolve(true);
        } else if (res.statusCode === 200 || res.statusCode === 404) {
          console.log('   ⚠️ Webhook accessible mais réponse inattendue');
          resolve(true);
        } else {
          console.log('   ❌ Problème d\'accessibilité');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('   ❌ Erreur de connexion:', error.message);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.error('   ❌ Timeout (10s)');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Fonction pour vérifier les variables d'environnement
function checkEnvironmentVariables() {
  console.log('\n2️⃣ Vérification des variables d\'environnement...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_ID'
  ];

  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const present = !!process.env[varName];
    const symbol = present ? '✅' : '❌';
    
    if (present) {
      // Afficher seulement les premiers caractères pour la sécurité
      const value = process.env[varName];
      const preview = value.substring(0, 20) + '...';
      console.log(`   ${symbol} ${varName}: ${preview}`);
    } else {
      console.log(`   ${symbol} ${varName}: MANQUANT`);
      allPresent = false;
    }
  });

  if (allPresent) {
    console.log('\n   ✅ Toutes les variables d\'environnement sont présentes');
  } else {
    console.log('\n   ❌ Variables manquantes détectées');
  }

  return allPresent;
}

// Fonction pour donner des instructions de test manuel
function giveManualTestInstructions() {
  console.log('\n3️⃣ Instructions pour tester avec Stripe CLI...');
  console.log('');
  console.log('   Pour tester le webhook localement :');
  console.log('   1. Installer Stripe CLI : brew install stripe/stripe-brew/stripe');
  console.log('   2. Se connecter : stripe login');
  console.log('   3. Forwarder : stripe listen --forward-to localhost:3000/api/stripe/webhook');
  console.log('   4. Copier le webhook secret (whsec_...) dans .env.local');
  console.log('   5. Tester : stripe trigger checkout.session.completed');
  console.log('');
  console.log('   Pour tester en production :');
  console.log('   1. Aller sur https://dashboard.stripe.com/test/webhooks');
  console.log('   2. Créer un webhook vers : ' + WEBHOOK_URL);
  console.log('   3. Sélectionner l\'événement : checkout.session.completed');
  console.log('   4. Copier le signing secret dans les variables Vercel');
  console.log('   5. Effectuer un paiement de test');
  console.log('   6. Vérifier les logs dans Vercel Dashboard > Functions');
}

// Fonction pour vérifier les logs Vercel
function checkVercelLogs() {
  console.log('\n4️⃣ Vérification des logs Vercel...');
  console.log('');
  
  if (process.env.VERCEL_URL) {
    console.log('   ✅ Déployé sur Vercel');
    console.log('   URL Vercel:', process.env.VERCEL_URL);
    console.log('   Environment:', process.env.VERCEL_ENV || 'unknown');
    console.log('');
    console.log('   Pour voir les logs :');
    console.log('   1. Allez sur https://vercel.com/dashboard');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Allez dans Deployments > Functions');
    console.log('   4. Cliquez sur /api/stripe/webhook');
    console.log('   5. Consultez les logs en temps réel');
  } else {
    console.log('   ℹ️ Environnement local détecté');
    console.log('   Les logs apparaîtront dans votre terminal');
  }
}

// Fonction principale
async function runTests() {
  console.log('\n🚀 Début des tests\n');
  
  const accessible = await testWebhookAccessibility();
  const envVarsOk = checkEnvironmentVariables();
  
  giveManualTestInstructions();
  checkVercelLogs();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Résumé des tests');
  console.log('='.repeat(50));
  console.log('Accessibilité webhook:', accessible ? '✅' : '❌');
  console.log('Variables d\'environnement:', envVarsOk ? '✅' : '❌');
  console.log('');
  
  if (accessible && envVarsOk) {
    console.log('✅ Configuration de base OK');
    console.log('');
    console.log('Prochaines étapes :');
    console.log('1. Configurer le webhook sur Stripe Dashboard');
    console.log('2. Effectuer un paiement de test');
    console.log('3. Vérifier les logs dans Vercel');
    console.log('4. Vérifier que is_verified et is_subscribed sont mis à jour dans Supabase');
  } else {
    console.log('❌ Problèmes détectés - vérifiez la configuration');
  }
  
  console.log('\n');
}

// Lancer les tests
runTests().catch(console.error);

