#!/usr/bin/env node

/**
 * 🧪 TEST MANUEL - MISE À JOUR DU PROFIL PROFESSIONNEL
 * Simule la mise à jour après paiement Stripe
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Charger les variables d'environnement depuis .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Fichier .env.local non trouvé')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPath, 'utf8')
  const envVars = {}
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      envVars[key.trim()] = value
    }
  })
  
  return envVars
}

// Charger les variables d'environnement
const env = loadEnvFile()

// Configuration Supabase
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testManualPaymentUpdate() {
  console.log('🧪 TEST MANUEL - MISE À JOUR DU PROFIL PROFESSIONNEL')
  console.log('===================================================')

  try {
    // 1. Récupérer le profil professionnel existant
    console.log('\n📊 PROFIL PROFESSIONNEL ACTUEL:')
    const { data: proProfiles, error: proError } = await supabase
      .from('pro_profiles')
      .select(`
        user_id,
        prenom,
        nom,
        is_verified,
        is_subscribed,
        created_at,
        subscription_start,
        stripe_customer_id,
        stripe_subscription_id
      `)
      .order('created_at', { ascending: false })
      .limit(1)

    if (proError) {
      console.error('❌ Erreur lors de la récupération du profil:', proError)
      return
    }

    if (!proProfiles || proProfiles.length === 0) {
      console.log('⚠️  Aucun profil professionnel trouvé')
      return
    }

    const profile = proProfiles[0]
    console.log(`👤 Profil trouvé: ${profile.prenom} ${profile.nom}`)
    console.log(`   ID: ${profile.user_id}`)
    console.log(`   Vérifié: ${profile.is_verified ? '✅ OUI' : '❌ NON'}`)
    console.log(`   Abonné: ${profile.is_subscribed ? '✅ OUI' : '❌ NON'}`)
    console.log(`   Début abonnement: ${profile.subscription_start || 'Non défini'}`)
    console.log(`   Customer ID: ${profile.stripe_customer_id || 'Non défini'}`)
    console.log(`   Subscription ID: ${profile.stripe_subscription_id || 'Non défini'}`)

    // 2. Simuler la mise à jour après paiement Stripe
    console.log('\n🔄 SIMULATION DE LA MISE À JOUR APRÈS PAIEMENT:')
    
    const updateData = {
      is_verified: true,
      is_subscribed: true,
      subscription_start: new Date().toISOString(),
      stripe_customer_id: 'cus_test_' + Date.now(),
      stripe_subscription_id: 'sub_test_' + Date.now()
    }

    console.log('📝 Données à mettre à jour:', updateData)

    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update(updateData)
      .eq('user_id', profile.user_id)

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError)
      return
    }

    console.log('✅ Mise à jour réussie !')

    // 3. Vérifier la mise à jour
    console.log('\n✅ VÉRIFICATION DE LA MISE À JOUR:')
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('pro_profiles')
      .select(`
        user_id,
        prenom,
        nom,
        is_verified,
        is_subscribed,
        subscription_start,
        stripe_customer_id,
        stripe_subscription_id
      `)
      .eq('user_id', profile.user_id)
      .single()

    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError)
      return
    }

    console.log(`👤 Profil mis à jour: ${updatedProfile.prenom} ${updatedProfile.nom}`)
    console.log(`   Vérifié: ${updatedProfile.is_verified ? '✅ OUI' : '❌ NON'}`)
    console.log(`   Abonné: ${updatedProfile.is_subscribed ? '✅ OUI' : '❌ NON'}`)
    console.log(`   Début abonnement: ${updatedProfile.subscription_start}`)
    console.log(`   Customer ID: ${updatedProfile.stripe_customer_id}`)
    console.log(`   Subscription ID: ${updatedProfile.stripe_subscription_id}`)

    console.log('\n🎉 TEST TERMINÉ AVEC SUCCÈS !')
    console.log('Le profil professionnel est maintenant vérifié et abonné.')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testManualPaymentUpdate()
