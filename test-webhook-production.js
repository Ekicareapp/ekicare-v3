#!/usr/bin/env node

/**
 * Script de test pour le webhook Stripe en production
 * 
 * Usage:
 * 1. node test-webhook-production.js
 * 2. stripe trigger checkout.session.completed
 * 3. Vérifier les logs Vercel
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

async function testWebhookProduction() {
  console.log('🧪 [TEST] === TEST WEBHOOK PRODUCTION ===')
  console.log('🧪 [TEST] Timestamp:', new Date().toISOString())
  
  try {
    // 1. Créer une session de test
    console.log('📋 [TEST] Création session de test...')
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://ekicare-v3.vercel.app/success-pro',
      cancel_url: 'https://ekicare-v3.vercel.app/signup',
      client_reference_id: 'test-user-' + Date.now(),
      metadata: {
        test: 'true',
        source: 'webhook_test'
      }
    })
    
    console.log('✅ [TEST] Session créée:', session.id)
    console.log('🔗 [TEST] URL checkout:', session.url)
    
    // 2. Simuler un paiement réussi (en mode test)
    console.log('💳 [TEST] Simulation paiement réussi...')
    const completedSession = await stripe.checkout.sessions.retrieve(session.id)
    
    console.log('📊 [TEST] Session status:', completedSession.status)
    console.log('👤 [TEST] Client Reference ID:', completedSession.client_reference_id)
    
    // 3. Instructions pour tester manuellement
    console.log('\n🎯 [TEST] === INSTRUCTIONS DE TEST ===')
    console.log('1. Va sur le Stripe Dashboard')
    console.log('2. Webhooks > Créer un endpoint')
    console.log('3. URL: https://ekicare-v3.vercel.app/api/webhooks/stripe')
    console.log('4. Événements: checkout.session.completed')
    console.log('5. Copie le webhook secret et ajoute-le sur Vercel comme STRIPE_WEBHOOK_SECRET')
    console.log('6. Teste avec: stripe trigger checkout.session.completed')
    
    console.log('\n📋 [TEST] === COMMANDES STRIPE CLI ===')
    console.log('stripe listen --forward-to https://ekicare-v3.vercel.app/api/webhooks/stripe')
    console.log('stripe trigger checkout.session.completed')
    
  } catch (error) {
    console.error('❌ [TEST] Erreur:', error.message)
  }
}

// Vérifier les variables d'environnement
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ [TEST] STRIPE_SECRET_KEY manquante')
  process.exit(1)
}

if (!process.env.STRIPE_PRICE_ID) {
  console.error('❌ [TEST] STRIPE_PRICE_ID manquante')
  process.exit(1)
}

testWebhookProduction()