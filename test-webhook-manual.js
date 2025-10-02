#!/usr/bin/env node

/**
 * Script de test manuel du webhook Stripe
 * Simule la mise à jour d'un profil pro après paiement
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testWebhookUpdate() {
  console.log('🧪 Test manuel du webhook Stripe\n')

  // Initialiser Supabase avec service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('1️⃣ Vérification de la connexion Supabase:')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('   ❌ Erreur Supabase:', error.message)
      return
    } else {
      console.log('   ✅ Connexion Supabase réussie')
    }
  } catch (error) {
    console.log('   ❌ Erreur configuration Supabase:', error.message)
    return
  }

  // Récupérer l'utilisateur test
  const testUserId = '763a3612-2e30-4ed9-92af-a01a643eaa11'
  console.log(`\n2️⃣ Vérification de l'utilisateur test: ${testUserId}`)
  
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', testUserId)
      .single()

    if (userError || !user) {
      console.log('   ❌ Utilisateur non trouvé:', userError?.message)
      
      // Lister tous les utilisateurs PRO
      const { data: allUsers, error: listError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('role', 'PRO')
        .limit(5)
      
      if (listError) {
        console.log('   ❌ Erreur liste utilisateurs:', listError.message)
      } else {
        console.log('   📋 Utilisateurs PRO disponibles:')
        allUsers?.forEach(u => console.log(`      - ${u.id} (${u.email})`))
      }
      return
    }

    console.log('   ✅ Utilisateur trouvé:', user.email, user.role)

    // Vérifier le profil pro
    console.log(`\n3️⃣ Vérification du profil pro:`)
    const { data: proProfile, error: proError } = await supabase
      .from('pro_profiles')
      .select('user_id, is_verified, is_subscribed, prenom, nom')
      .eq('user_id', testUserId)
      .single()

    if (proError || !proProfile) {
      console.log('   ❌ Profil pro non trouvé:', proError?.message)
      return
    }

    console.log('   ✅ Profil pro trouvé:', proProfile.prenom, proProfile.nom)
    console.log('   📊 Statut actuel:')
    console.log(`      - is_verified: ${proProfile.is_verified}`)
    console.log(`      - is_subscribed: ${proProfile.is_subscribed}`)

    // Simuler la mise à jour du webhook
    console.log(`\n4️⃣ Simulation de la mise à jour webhook:`)
    const updateData = {
      is_verified: true,
      is_subscribed: true,
      subscription_start: new Date().toISOString(),
      stripe_customer_id: 'cus_test_123',
      stripe_subscription_id: 'sub_test_123'
    }

    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update(updateData)
      .eq('user_id', testUserId)

    if (updateError) {
      console.log('   ❌ Erreur mise à jour:', updateError.message)
      return
    }

    console.log('   ✅ Mise à jour réussie!')

    // Vérifier la mise à jour
    console.log(`\n5️⃣ Vérification de la mise à jour:`)
    const { data: updatedProfile, error: checkError } = await supabase
      .from('pro_profiles')
      .select('user_id, is_verified, is_subscribed, subscription_start')
      .eq('user_id', testUserId)
      .single()

    if (checkError || !updatedProfile) {
      console.log('   ❌ Erreur vérification:', checkError?.message)
      return
    }

    console.log('   📊 Nouveau statut:')
    console.log(`      - is_verified: ${updatedProfile.is_verified}`)
    console.log(`      - is_subscribed: ${updatedProfile.is_subscribed}`)
    console.log(`      - subscription_start: ${updatedProfile.subscription_start}`)

    if (updatedProfile.is_verified && updatedProfile.is_subscribed) {
      console.log('\n🎉 SUCCÈS: Le profil a été correctement mis à jour!')
    } else {
      console.log('\n❌ ÉCHEC: La mise à jour n\'a pas fonctionné')
    }

  } catch (error) {
    console.log('   ❌ Erreur générale:', error.message)
  }
}

testWebhookUpdate().catch(console.error)
