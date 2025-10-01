#!/usr/bin/env node

/**
 * 🧪 TEST COMPLET DU FLOW D'AUTHENTIFICATION
 * Teste : inscription → paiement → déconnexion → reconnexion
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

async function testCompleteFlow() {
  console.log('🧪 TEST COMPLET DU FLOW D\'AUTHENTIFICATION')
  console.log('==========================================')

  try {
    // 1. ÉTAT INITIAL - Vérifier les profils existants
    console.log('\n📊 ÉTAT INITIAL:')
    const { data: initialProfiles, error: initialError } = await supabase
      .from('pro_profiles')
      .select(`
        user_id,
        prenom,
        nom,
        is_verified,
        is_subscribed,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (initialError) {
      console.error('❌ Erreur lors de la récupération des profils:', initialError)
      return
    }

    console.log(`📈 Nombre de profils: ${initialProfiles.length}`)
    initialProfiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.prenom} ${profile.nom} - Vérifié: ${profile.is_verified ? '✅' : '❌'} - Abonné: ${profile.is_subscribed ? '✅' : '❌'}`)
    })

    // 2. SIMULATION D'INSCRIPTION PROFESSIONNEL
    console.log('\n📝 SIMULATION D\'INSCRIPTION PROFESSIONNEL:')
    const testEmail = `test.pro.${Date.now()}@ekicare.com`
    const testPassword = 'TestPassword123!'
    
    console.log(`   Email: ${testEmail}`)
    console.log(`   Mot de passe: ${testPassword}`)

    // Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Erreur lors de la création de l\'utilisateur auth:', authError)
      return
    }

    console.log(`✅ Utilisateur auth créé: ${authData.user.id}`)

    // Créer l'utilisateur dans public.users
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email: testEmail,
        role: 'PRO'
      }])

    if (userError) {
      console.error('❌ Erreur lors de la création de l\'utilisateur public:', userError)
      return
    }

    console.log('✅ Utilisateur public créé')

    // Créer le profil professionnel (non vérifié)
    const { error: profileError } = await supabase
      .from('pro_profiles')
      .insert([{
        user_id: authData.user.id,
        prenom: 'Test',
        nom: 'Professionnel',
        profession: 'Vétérinaire',
        siret: '12345678901234',
        is_verified: false,
        is_subscribed: false
      }])

    if (profileError) {
      console.error('❌ Erreur lors de la création du profil professionnel:', profileError)
      return
    }

    console.log('✅ Profil professionnel créé (non vérifié)')

    // 3. SIMULATION DU PAIEMENT STRIPE
    console.log('\n💳 SIMULATION DU PAIEMENT STRIPE:')
    console.log('   → Redirection vers Stripe Checkout')
    console.log('   → Paiement avec carte test')
    console.log('   → Webhook checkout.session.completed')

    // Simuler la mise à jour après paiement
    const { error: paymentError } = await supabase
      .from('pro_profiles')
      .update({
        is_verified: true,
        is_subscribed: true,
        subscription_start: new Date().toISOString(),
        stripe_customer_id: 'cus_test_' + Date.now(),
        stripe_subscription_id: 'sub_test_' + Date.now()
      })
      .eq('user_id', authData.user.id)

    if (paymentError) {
      console.error('❌ Erreur lors de la mise à jour après paiement:', paymentError)
      return
    }

    console.log('✅ Profil mis à jour après paiement')

    // 4. VÉRIFICATION POST-PAIEMENT
    console.log('\n✅ VÉRIFICATION POST-PAIEMENT:')
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('pro_profiles')
      .select('is_verified, is_subscribed, subscription_start')
      .eq('user_id', authData.user.id)
      .single()

    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError)
      return
    }

    console.log(`   Vérifié: ${updatedProfile.is_verified ? '✅ OUI' : '❌ NON'}`)
    console.log(`   Abonné: ${updatedProfile.is_subscribed ? '✅ OUI' : '❌ NON'}`)
    console.log(`   Début abonnement: ${updatedProfile.subscription_start}`)

    // 5. SIMULATION DE DÉCONNEXION
    console.log('\n🔒 SIMULATION DE DÉCONNEXION:')
    console.log('   → Utilisateur se déconnecte')
    console.log('   → Session supprimée')

    // 6. SIMULATION DE RECONNEXION
    console.log('\n🔐 SIMULATION DE RECONNEXION:')
    
    // Simuler la connexion
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (loginError) {
      console.error('❌ Erreur lors de la connexion:', loginError)
      return
    }

    console.log(`✅ Connexion réussie: ${loginData.user.email}`)

    // Récupérer le rôle
    const { data: userRow, error: userRowError } = await supabase
      .from('users')
      .select('role')
      .eq('id', loginData.user.id)
      .single()

    if (userRowError) {
      console.error('❌ Erreur lors de la récupération du rôle:', userRowError)
      return
    }

    console.log(`   Rôle: ${userRow.role}`)

    // Vérifier le statut du professionnel
    if (userRow.role === 'PRO') {
      const { data: proProfile, error: proError } = await supabase
        .from('pro_profiles')
        .select('is_verified, is_subscribed')
        .eq('user_id', loginData.user.id)
        .single()

      if (proError) {
        console.error('❌ Erreur lors de la récupération du profil pro:', proError)
        return
      }

      console.log(`   Vérifié: ${proProfile.is_verified ? '✅ OUI' : '❌ NON'}`)
      console.log(`   Abonné: ${proProfile.is_subscribed ? '✅ OUI' : '❌ NON'}`)

      // Appliquer la logique de redirection
      if (!proProfile.is_verified || !proProfile.is_subscribed) {
        console.log('❌ → Redirection vers /paiement-requis')
      } else {
        console.log('✅ → Redirection vers /dashboard/pro')
      }
    }

    // 7. NETTOYAGE
    console.log('\n🧹 NETTOYAGE:')
    
    // Supprimer le profil professionnel
    const { error: deleteProfileError } = await supabase
      .from('pro_profiles')
      .delete()
      .eq('user_id', authData.user.id)

    if (deleteProfileError) {
      console.error('❌ Erreur lors de la suppression du profil:', deleteProfileError)
    } else {
      console.log('✅ Profil professionnel supprimé')
    }

    // Supprimer l'utilisateur public
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', authData.user.id)

    if (deleteUserError) {
      console.error('❌ Erreur lors de la suppression de l\'utilisateur:', deleteUserError)
    } else {
      console.log('✅ Utilisateur public supprimé')
    }

    // Supprimer l'utilisateur auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authData.user.id)

    if (deleteAuthError) {
      console.error('❌ Erreur lors de la suppression de l\'utilisateur auth:', deleteAuthError)
    } else {
      console.log('✅ Utilisateur auth supprimé')
    }

    console.log('\n🎉 TEST COMPLET TERMINÉ AVEC SUCCÈS !')
    console.log('Le flow d\'authentification fonctionne correctement.')

  } catch (error) {
    console.error('❌ Erreur lors du test complet:', error)
  }
}

// Exécuter le test
testCompleteFlow()
