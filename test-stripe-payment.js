#!/usr/bin/env node

/**
 * Script de test pour vérifier la configuration Stripe
 * Usage: node test-stripe-payment.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🧪 Test de la configuration Stripe pour Ekicare\n')

// Vérifier les variables d'environnement
console.log('1️⃣ Vérification des variables d\'environnement:')
console.log('   STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Configurée' : '❌ Manquante')
console.log('   STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID ? '✅ Configurée' : '❌ Manquante')
console.log('   STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Configurée' : '❌ Manquante')
console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurée' : '❌ Manquante')
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurée' : '❌ Manquante')

// Vérifier la connexion Supabase
console.log('\n2️⃣ Test de connexion Supabase:')
try {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  supabase.from('users').select('count').limit(1)
    .then(({ error }) => {
      if (error) {
        console.log('   ❌ Erreur de connexion Supabase:', error.message)
      } else {
        console.log('   ✅ Connexion Supabase réussie')
      }
    })
} catch (error) {
  console.log('   ❌ Erreur de configuration Supabase:', error.message)
}

// Vérifier la configuration Stripe
console.log('\n3️⃣ Test de configuration Stripe:')
try {
  const Stripe = require('stripe')
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  })
  
  stripe.prices.retrieve(process.env.STRIPE_PRICE_ID)
    .then(price => {
      console.log('   ✅ Price ID valide:', price.id)
      console.log('   💰 Montant:', price.unit_amount / 100, price.currency.toUpperCase())
    })
    .catch(error => {
      console.log('   ❌ Erreur Price ID:', error.message)
    })
} catch (error) {
  console.log('   ❌ Erreur de configuration Stripe:', error.message)
}

console.log('\n4️⃣ Instructions pour corriger les problèmes:')
if (!process.env.STRIPE_SECRET_KEY) {
  console.log('   🔧 Ajoutez STRIPE_SECRET_KEY dans .env.local')
  console.log('      Obtenez-la depuis: https://dashboard.stripe.com/apikeys')
}
if (!process.env.STRIPE_PRICE_ID) {
  console.log('   🔧 Ajoutez STRIPE_PRICE_ID dans .env.local')
  console.log('      Créez un produit/prix depuis: https://dashboard.stripe.com/products')
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.log('   🔧 Ajoutez STRIPE_WEBHOOK_SECRET dans .env.local')
  console.log('      Utilisez: stripe listen --forward-to localhost:3000/api/stripe/webhook')
}

console.log('\n5️⃣ Test du flux complet:')
console.log('   1. Créez un compte professionnel')
console.log('   2. Cliquez sur "Payer"')
console.log('   3. Utilisez la carte test: 4242 4242 4242 4242')
console.log('   4. Vérifiez la redirection vers /success-pro')
console.log('   5. Vérifiez l\'accès au dashboard pro')

console.log('\n✅ Test terminé')
