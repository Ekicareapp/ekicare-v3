#!/usr/bin/env node

/**
 * Script de test du webhook Stripe avec vraie signature
 * Utilise Stripe CLI pour envoyer un événement test
 */

const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

async function testWebhookWithStripeCLI() {
  console.log('🧪 Test du webhook Stripe avec Stripe CLI\n')

  try {
    // Vérifier que Stripe CLI est installé
    console.log('1️⃣ Vérification de Stripe CLI:')
    try {
      const { stdout } = await execAsync('stripe --version')
      console.log('   ✅ Stripe CLI installé:', stdout.trim())
    } catch (error) {
      console.log('   ❌ Stripe CLI non installé')
      console.log('   📥 Installation: brew install stripe/stripe-cli/stripe')
      return
    }

    // Tester l'événement checkout.session.completed
    console.log('\n2️⃣ Test de l\'événement checkout.session.completed:')
    
    const eventPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_webhook_' + Date.now(),
          customer: 'cus_test_webhook',
          subscription: 'sub_test_webhook',
          client_reference_id: '763a3612-2e30-4ed9-92af-a01a643eaa11',
          metadata: {
            userId: '763a3612-2e30-4ed9-92af-a01a643eaa11',
            source: 'signup_pro'
          }
        }
      }
    }

    const command = `stripe events resend --webhook-endpoint http://localhost:3002/api/stripe/webhook --event-id checkout.session.completed --data '${JSON.stringify(eventPayload)}'`
    
    console.log('   🔄 Envoi de l\'événement test...')
    
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 10000 })
      console.log('   ✅ Événement envoyé:', stdout.trim())
      
      if (stderr) {
        console.log('   ⚠️  Warnings:', stderr.trim())
      }
    } catch (error) {
      console.log('   ❌ Erreur envoi événement:', error.message)
      console.log('   💡 Assurez-vous que Stripe CLI est connecté: stripe login')
    }

    console.log('\n3️⃣ Instructions pour le test manuel:')
    console.log('   1. Démarrez Stripe CLI: stripe listen --forward-to localhost:3002/api/stripe/webhook')
    console.log('   2. Effectuez un vrai paiement sur votre application')
    console.log('   3. Vérifiez les logs du webhook dans le terminal Stripe CLI')
    console.log('   4. Vérifiez la base de données Supabase')

    console.log('\n4️⃣ Commandes utiles:')
    console.log('   📋 Lister les événements: stripe events list')
    console.log('   🔄 Renvoyer un événement: stripe events resend evt_xxxxxxx')
    console.log('   📊 Logs en temps réel: stripe listen --print-json')

  } catch (error) {
    console.log('❌ Erreur générale:', error.message)
  }
}

testWebhookWithStripeCLI().catch(console.error)
