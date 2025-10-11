#!/usr/bin/env node

/**
 * Script de debug pour identifier le problème webhook Stripe
 */

const https = require('https');
const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = 'https://ekicare-v3.vercel.app/api/stripe/webhook';
const STRIPE_SECRET = 'whsec_meVfQ7lYc3ohY18FrvCj181hVH8tDWmO'; // Ton secret

// Créer un payload de test
const testPayload = {
  id: 'evt_test_webhook',
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      object: 'checkout.session',
      client_reference_id: 'test-user-123',
      payment_status: 'paid'
    }
  }
};

const payload = JSON.stringify(testPayload);

// Créer la signature Stripe
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = timestamp + '.' + payload;
const signature = crypto
  .createHmac('sha256', STRIPE_SECRET)
  .update(signedPayload)
  .digest('hex');

const stripeSignature = `t=${timestamp},v1=${signature}`;

console.log('🧪 [DEBUG] Test webhook Stripe');
console.log('📋 [DEBUG] URL:', WEBHOOK_URL);
console.log('📋 [DEBUG] Payload:', payload.substring(0, 100) + '...');
console.log('📋 [DEBUG] Signature:', stripeSignature);

// Envoyer la requête
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Stripe-Signature': stripeSignature,
    'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
  }
};

const req = https.request(WEBHOOK_URL, options, (res) => {
  console.log('📊 [DEBUG] Status:', res.statusCode);
  console.log('📊 [DEBUG] Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📊 [DEBUG] Response:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ [DEBUG] Webhook fonctionne !');
    } else {
      console.log('❌ [DEBUG] Webhook échoue !');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ [DEBUG] Erreur:', error.message);
});

req.write(payload);
req.end();