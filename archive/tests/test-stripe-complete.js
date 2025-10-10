#!/usr/bin/env node

/**
 * Script de test complet pour le flux de paiement Stripe
 * Usage: node test-stripe-complete.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🧪 Test complet du flux de paiement Stripe\n')

// Vérifier les variables d'environnement
console.log('1️⃣ Vérification des variables d\'environnement:')
console.log('   STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Configurée' : '❌ Manquante')
console.log('   STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID ? '✅ Configurée' : '❌ Manquante')
console.log('   STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Configurée' : '❌ Manquante')
console.log('   NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL ? '✅ Configurée' : '❌ Manquante')

// Tester la création d'une session Stripe
console.log('\n2️⃣ Test de création de session Stripe:')
async function testStripeSession() {
  try {
    const Stripe = require('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success-pro?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/paiement-requis`,
      client_reference_id: 'test-user-123',
      metadata: {
        source: 'signup_pro',
        user_type: 'professional',
        userId: 'test-user-123'
      }
    })
    
    console.log('   ✅ Session créée:', session.id)
    console.log('   🔗 Success URL:', session.success_url)
    console.log('   🔗 Cancel URL:', session.cancel_url)
    console.log('   👤 Client Reference ID:', session.client_reference_id)
    
    return session
  } catch (error) {
    console.log('   ❌ Erreur création session:', error.message)
    return null
  }
}

// Tester la connexion Supabase
console.log('\n3️⃣ Test de connexion Supabase:')
async function testSupabase() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('   ❌ Erreur Supabase:', error.message)
      return false
    } else {
      console.log('   ✅ Connexion Supabase réussie')
      return true
    }
  } catch (error) {
    console.log('   ❌ Erreur configuration Supabase:', error.message)
    return false
  }
}

// Instructions pour le test complet
console.log('\n4️⃣ Instructions pour le test complet:')
console.log('   1. Démarrez le serveur: npm run dev')
console.log('   2. Démarrez Stripe CLI: stripe listen --forward-to localhost:3002/api/stripe/webhook')
console.log('   3. Créez un compte professionnel sur http://localhost:3002/signup')
console.log('   4. Cliquez sur "Payer" sur la page de paiement requis')
console.log('   5. Utilisez la carte test: 4242 4242 4242 4242')
console.log('   6. Vérifiez la redirection vers /success-pro')
console.log('   7. Vérifiez les logs du webhook dans le terminal Stripe CLI')

console.log('\n5️⃣ URLs importantes:')
console.log('   🏠 Application: http://localhost:3002')
console.log('   📝 Inscription: http://localhost:3002/signup')
console.log('   💳 Paiement: http://localhost:3002/paiement-requis')
console.log('   ✅ Succès: http://localhost:3002/success-pro')
console.log('   🔗 Webhook: http://localhost:3002/api/stripe/webhook')

// Exécuter les tests
async function runTests() {
  await testSupabase()
  await testStripeSession()
  
  console.log('\n✅ Tests terminés')
  console.log('\n🚀 Le flux de paiement devrait maintenant fonctionner correctement!')
}

runTests().catch(console.error)
