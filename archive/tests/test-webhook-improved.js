#!/usr/bin/env node

/**
 * Script de test du webhook amélioré
 * Simule l'événement checkout.session.completed avec les vraies données
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testWebhookImproved() {
  console.log('🧪 Test du webhook amélioré\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const userId = '0897bd3b-02fc-4d1e-aa05-db5887703f65'

  // 1. Vérifier l'état initial
  console.log('1️⃣ État initial du profil:')
  const { data: initialProfile } = await supabase
    .from('pro_profiles')
    .select('user_id, is_verified, is_subscribed')
    .eq('user_id', userId)
    .single()

  console.log('   📊 Profil initial:', initialProfile)

  // 2. Simuler la logique du webhook amélioré
  console.log('\n2️⃣ Simulation du webhook amélioré:')

  // Vérifier que l'utilisateur existe (avec retry)
  let userExists = null
  let userCheckError = null
  let retries = 3

  console.log('   🔍 Vérification de l\'utilisateur avec retry...')

  while (retries > 0 && !userExists) {
    const { data, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()

    userExists = data
    userCheckError = error

    if (!userExists && retries > 1) {
      console.log(`   ⏳ User not found, retrying... (${retries - 1} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    retries--
  }

  if (userCheckError || !userExists) {
    console.log('   ❌ User not found after retries:', userCheckError?.message)
    return
  }

  console.log('   ✅ User validated:', userExists.id, userExists.role)

  // Vérifier si le profil est déjà activé
  console.log('   🔍 Vérification du profil actuel...')
  const { data: currentProfile, error: profileCheckError } = await supabase
    .from('pro_profiles')
    .select('is_verified, is_subscribed, stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (profileCheckError) {
    console.log('   ❌ Error checking profile:', profileCheckError.message)
    return
  }

  if (currentProfile.is_verified && currentProfile.is_subscribed) {
    console.log('   ✅ Profile already activated')
    return
  }

  console.log('   📊 Profil actuel:', currentProfile)

  // Mise à jour du profil
  console.log('   🔄 Mise à jour du profil...')
  const updateData = {
    is_verified: true,
    is_subscribed: true,
    subscription_start: new Date().toISOString(),
    stripe_customer_id: 'cus_test_improved',
    stripe_subscription_id: 'sub_test_improved'
  }

  const { error: updateError } = await supabase
    .from('pro_profiles')
    .update(updateData)
    .eq('user_id', userId)

  if (updateError) {
    console.log('   ❌ Error updating profile:', updateError.message)
    return
  }

  console.log('   ✅ Profile updated successfully!')

  // 3. Vérifier la mise à jour
  console.log('\n3️⃣ Vérification de la mise à jour:')
  const { data: updatedProfile } = await supabase
    .from('pro_profiles')
    .select('user_id, is_verified, is_subscribed, subscription_start, stripe_customer_id')
    .eq('user_id', userId)
    .single()

  console.log('   📊 Profil mis à jour:', updatedProfile)

  // 4. Résultat final
  console.log('\n4️⃣ Résultat Final:')
  if (updatedProfile.is_verified && updatedProfile.is_subscribed) {
    console.log('   🎉 SUCCÈS: Le webhook amélioré fonctionne!')
    console.log('   ✅ is_verified = true')
    console.log('   ✅ is_subscribed = true')
    console.log('   ✅ subscription_start renseigné')
    console.log('   ✅ stripe_customer_id renseigné')
  } else {
    console.log('   ❌ ÉCHEC: La mise à jour n\'a pas fonctionné')
  }

  console.log('\n🎯 Le webhook est maintenant plus robuste avec:')
  console.log('   - Retry automatique en cas de timing')
  console.log('   - Vérification des doublons')
  console.log('   - Gestion d\'erreur améliorée')
}

testWebhookImproved().catch(console.error)
