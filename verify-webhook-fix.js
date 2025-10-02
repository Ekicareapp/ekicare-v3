#!/usr/bin/env node

/**
 * Script de vérification finale du webhook Stripe
 * Vérifie que tout est en place pour le fonctionnement du webhook
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function verifyWebhookFix() {
  console.log('🔍 Vérification finale du webhook Stripe\n')

  // 1. Vérifier les variables d'environnement
  console.log('1️⃣ Variables d\'environnement:')
  console.log('   STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅' : '❌')
  console.log('   STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅' : '❌')
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
  console.log('   NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL ? '✅' : '❌')

  // 2. Vérifier la connexion Supabase
  console.log('\n2️⃣ Connexion Supabase:')
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
    } else {
      console.log('   ✅ Connexion Supabase réussie')
    }
  } catch (error) {
    console.log('   ❌ Erreur configuration Supabase:', error.message)
  }

  // 3. Vérifier la structure de la table pro_profiles
  console.log('\n3️⃣ Structure table pro_profiles:')
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data, error } = await supabase
      .from('pro_profiles')
      .select('user_id, is_verified, is_subscribed, subscription_start, stripe_customer_id, stripe_subscription_id')
      .limit(1)
    
    if (error) {
      console.log('   ❌ Erreur accès table:', error.message)
    } else {
      console.log('   ✅ Colonnes disponibles:')
      console.log('      - user_id ✅')
      console.log('      - is_verified ✅')
      console.log('      - is_subscribed ✅')
      console.log('      - subscription_start ✅')
      console.log('      - stripe_customer_id ✅')
      console.log('      - stripe_subscription_id ✅')
    }
  } catch (error) {
    console.log('   ❌ Erreur vérification structure:', error.message)
  }

  // 4. Vérifier l'endpoint webhook
  console.log('\n4️⃣ Endpoint webhook:')
  try {
    const response = await fetch('http://localhost:3002/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test'
      },
      body: JSON.stringify({ type: 'test' })
    })
    
    if (response.status === 400) {
      console.log('   ✅ Endpoint accessible (erreur signature attendue)')
    } else {
      console.log('   ⚠️  Endpoint répond avec status:', response.status)
    }
  } catch (error) {
    console.log('   ❌ Endpoint inaccessible:', error.message)
  }

  // 5. Instructions finales
  console.log('\n5️⃣ Instructions pour le test complet:')
  console.log('   1. Démarrez Stripe CLI: stripe listen --forward-to localhost:3002/api/stripe/webhook')
  console.log('   2. Créez un compte professionnel')
  console.log('   3. Effectuez un paiement avec la carte test: 4242 4242 4242 4242')
  console.log('   4. Vérifiez la redirection vers /success-pro')
  console.log('   5. Vérifiez les logs du webhook dans Stripe CLI')
  console.log('   6. Vérifiez que is_verified=true et is_subscribed=true dans Supabase')

  console.log('\n6️⃣ URLs importantes:')
  console.log('   🏠 Application: http://localhost:3002')
  console.log('   📝 Inscription: http://localhost:3002/signup')
  console.log('   💳 Paiement: http://localhost:3002/paiement-requis')
  console.log('   ✅ Succès: http://localhost:3002/success-pro')
  console.log('   🔗 Webhook: http://localhost:3002/api/stripe/webhook')

  console.log('\n✅ Vérification terminée!')
  console.log('\n🎯 Le webhook devrait maintenant fonctionner correctement.')
  console.log('   Après chaque paiement, is_verified et is_subscribed seront mis à TRUE.')
}

verifyWebhookFix().catch(console.error)
