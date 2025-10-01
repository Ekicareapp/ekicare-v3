#!/usr/bin/env node

/**
 * 🔍 SCRIPT DE DIAGNOSTIC - ÉTAT DES PAIEMENTS
 * Vérifie l'état des profils professionnels après paiement
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugPaymentStatus() {
  console.log('🔍 DIAGNOSTIC DES PAIEMENTS PROFESSIONNELS')
  console.log('==========================================')

  try {
    // 1. Récupérer tous les profils professionnels
    console.log('\n📊 PROFILS PROFESSIONNELS:')
    const { data: proProfiles, error: proError } = await supabase
      .from('pro_profiles')
      .select(`
        user_id,
        prenom,
        nom,
        is_verified,
        is_subscribed,
        subscription_end,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (proError) {
      console.error('❌ Erreur lors de la récupération des profils:', proError)
      return
    }

    if (!proProfiles || proProfiles.length === 0) {
      console.log('⚠️  Aucun profil professionnel trouvé')
      return
    }

    console.log(`📈 Nombre de profils: ${proProfiles.length}`)
    console.log('')

    // 2. Afficher le statut de chaque profil
    proProfiles.forEach((profile, index) => {
      console.log(`👤 PROFIL ${index + 1}:`)
      console.log(`   ID: ${profile.user_id}`)
      console.log(`   Nom: ${profile.prenom} ${profile.nom}`)
      console.log(`   Vérifié: ${profile.is_verified ? '✅ OUI' : '❌ NON'}`)
      console.log(`   Abonné: ${profile.is_subscribed ? '✅ OUI' : '❌ NON'}`)
      console.log(`   Fin d'abonnement: ${profile.subscription_end || 'Non défini'}`)
      console.log(`   Créé: ${profile.created_at}`)
      console.log(`   Modifié: ${profile.updated_at}`)
      console.log('')
    })

    // 3. Statistiques
    const verifiedCount = proProfiles.filter(p => p.is_verified).length
    const subscribedCount = proProfiles.filter(p => p.is_subscribed).length
    const bothVerifiedAndSubscribed = proProfiles.filter(p => p.is_verified && p.is_subscribed).length

    console.log('📊 STATISTIQUES:')
    console.log(`   Vérifiés: ${verifiedCount}/${proProfiles.length}`)
    console.log(`   Abonnés: ${subscribedCount}/${proProfiles.length}`)
    console.log(`   Vérifiés ET abonnés: ${bothVerifiedAndSubscribed}/${proProfiles.length}`)

    // 4. Vérifier les utilisateurs correspondants
    console.log('\n👥 UTILISATEURS CORRESPONDANTS:')
    const userIds = proProfiles.map(p => p.user_id)
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .in('id', userIds)

    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError)
    } else {
      users.forEach(user => {
        const profile = proProfiles.find(p => p.user_id === user.id)
        console.log(`   ${user.email} (${user.role}) - Profil: ${profile ? '✅' : '❌'}`)
      })
    }

    // 5. Vérifier les sessions Stripe récentes (si possible)
    console.log('\n💳 VÉRIFICATION STRIPE:')
    console.log('   Pour vérifier les sessions Stripe, utilisez le dashboard Stripe')
    console.log('   ou vérifiez les logs du webhook dans votre serveur')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Exécuter le diagnostic
debugPaymentStatus()
