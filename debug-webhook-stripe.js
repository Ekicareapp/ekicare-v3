#!/usr/bin/env node

/**
 * Script de diagnostic du webhook Stripe
 * Vérifie si le webhook fonctionne et met à jour correctement les statuts
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugWebhookIssue() {
  console.log('🔍 Diagnostic du problème de webhook Stripe...\n')

  try {
    // 1. Vérifier les derniers profils PRO créés
    console.log('📋 1. Derniers profils PRO créés:')
    const { data: recentPros, error: prosError } = await supabase
      .from('pro_profiles')
      .select('user_id, prenom, nom, is_verified, is_subscribed, created_at, stripe_customer_id, stripe_subscription_id')
      .order('created_at', { ascending: false })
      .limit(5)

    if (prosError) {
      console.error('❌ Erreur lors de la récupération des profils:', prosError)
      return
    }

    console.table(recentPros)

    // 2. Vérifier les utilisateurs correspondants
    console.log('\n👤 2. Utilisateurs correspondants:')
    if (recentPros && recentPros.length > 0) {
      const userIds = recentPros.map(p => p.user_id)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .in('id', userIds)
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError)
      } else {
        console.table(users)
      }
    }

    // 3. Vérifier les profils non vérifiés récents
    console.log('\n❌ 3. Profils PRO non vérifiés (créés dans les dernières 24h):')
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data: unverifiedPros, error: unverifiedError } = await supabase
      .from('pro_profiles')
      .select('user_id, prenom, nom, is_verified, is_subscribed, created_at')
      .eq('is_verified', false)
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })

    if (unverifiedError) {
      console.error('❌ Erreur lors de la récupération des profils non vérifiés:', unverifiedError)
    } else {
      if (unverifiedPros && unverifiedPros.length > 0) {
        console.table(unverifiedPros)
        console.log(`\n⚠️  ${unverifiedPros.length} profils PRO non vérifiés trouvés`)
      } else {
        console.log('✅ Aucun profil PRO non vérifié trouvé')
      }
    }

    // 4. Vérifier la configuration du webhook
    console.log('\n🔧 4. Configuration du webhook:')
    console.log('URL du webhook:', `${supabaseUrl}/api/stripe/webhook`)
    console.log('Service Role Key configurée:', !!supabaseServiceKey)

    // 5. Test de mise à jour manuelle
    if (unverifiedPros && unverifiedPros.length > 0) {
      console.log('\n🧪 5. Test de mise à jour manuelle:')
      const testUserId = unverifiedPros[0].user_id
      console.log(`Test avec l'utilisateur: ${testUserId}`)
      
      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update({
          is_verified: true,
          is_subscribed: true,
          subscription_start: new Date().toISOString(),
          stripe_customer_id: 'test_customer_' + Date.now(),
          stripe_subscription_id: 'test_sub_' + Date.now()
        })
        .eq('user_id', testUserId)

      if (updateError) {
        console.error('❌ Erreur lors du test de mise à jour:', updateError)
      } else {
        console.log('✅ Test de mise à jour réussi')
        
        // Vérifier la mise à jour
        const { data: updatedProfile } = await supabase
          .from('pro_profiles')
          .select('is_verified, is_subscribed')
          .eq('user_id', testUserId)
          .single()
        
        console.log('Statut après mise à jour:', updatedProfile)
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Exécuter le diagnostic
debugWebhookIssue()
  .then(() => {
    console.log('\n✅ Diagnostic terminé')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
