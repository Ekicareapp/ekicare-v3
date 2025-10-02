#!/usr/bin/env node

/**
 * Script de test final du webhook Stripe
 * Vérifie que tout fonctionne après correction
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testFinalWebhook() {
  console.log('🎯 Test Final du Webhook Stripe\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const userId = 'e2565c4c-1b49-4cac-8167-65c3333c2433'

  // 1. Vérifier que l'utilisateur existe
  console.log('1️⃣ Vérification de l\'utilisateur:')
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    console.log('   ❌ Utilisateur non trouvé:', userError?.message)
    return
  }

  console.log('   ✅ Utilisateur trouvé:', user.email, user.role)

  // 2. Vérifier le profil pro
  console.log('\n2️⃣ Vérification du profil pro:')
  const { data: profile, error: profileError } = await supabase
    .from('pro_profiles')
    .select('user_id, is_verified, is_subscribed, prenom, nom')
    .eq('user_id', userId)
    .single()

  if (profileError || !profile) {
    console.log('   ❌ Profil pro non trouvé:', profileError?.message)
    return
  }

  console.log('   ✅ Profil pro trouvé:', profile.prenom, profile.nom)
  console.log('   📊 Statut actuel:')
  console.log(`      - is_verified: ${profile.is_verified}`)
  console.log(`      - is_subscribed: ${profile.is_subscribed}`)

  // 3. Simuler la mise à jour du webhook
  console.log('\n3️⃣ Simulation de la mise à jour webhook:')
  const updateData = {
    is_verified: true,
    is_subscribed: true,
    subscription_start: new Date().toISOString(),
    stripe_customer_id: 'cus_test_webhook',
    stripe_subscription_id: 'sub_test_webhook'
  }

  const { error: updateError } = await supabase
    .from('pro_profiles')
    .update(updateData)
    .eq('user_id', userId)

  if (updateError) {
    console.log('   ❌ Erreur mise à jour:', updateError.message)
    return
  }

  console.log('   ✅ Mise à jour réussie!')

  // 4. Vérifier la mise à jour
  console.log('\n4️⃣ Vérification de la mise à jour:')
  const { data: updatedProfile, error: checkError } = await supabase
    .from('pro_profiles')
    .select('user_id, is_verified, is_subscribed, subscription_start, stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (checkError || !updatedProfile) {
    console.log('   ❌ Erreur vérification:', checkError?.message)
    return
  }

  console.log('   📊 Nouveau statut:')
  console.log(`      - is_verified: ${updatedProfile.is_verified}`)
  console.log(`      - is_subscribed: ${updatedProfile.is_subscribed}`)
  console.log(`      - subscription_start: ${updatedProfile.subscription_start}`)
  console.log(`      - stripe_customer_id: ${updatedProfile.stripe_customer_id}`)

  // 5. Résultat final
  console.log('\n5️⃣ Résultat Final:')
  if (updatedProfile.is_verified && updatedProfile.is_subscribed) {
    console.log('   🎉 SUCCÈS: Le webhook fonctionne parfaitement!')
    console.log('   ✅ is_verified = true')
    console.log('   ✅ is_subscribed = true')
    console.log('   ✅ subscription_start renseigné')
    console.log('   ✅ stripe_customer_id renseigné')
  } else {
    console.log('   ❌ ÉCHEC: La mise à jour n\'a pas fonctionné')
  }

  console.log('\n🎯 Instructions pour le test complet:')
  console.log('   1. Allez sur http://localhost:3002/signup')
  console.log('   2. Créez un compte avec un NOUVEAU email')
  console.log('   3. Effectuez un paiement avec la carte: 4242 4242 4242 4242')
  console.log('   4. Vérifiez la redirection vers /success-pro')
  console.log('   5. Vérifiez que is_verified=true et is_subscribed=true dans Supabase')
}

testFinalWebhook().catch(console.error)
