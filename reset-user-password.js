#!/usr/bin/env node

/**
 * 🔑 RÉINITIALISATION DU MOT DE PASSE UTILISATEUR
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

async function resetUserPassword() {
  console.log('🔑 RÉINITIALISATION DU MOT DE PASSE UTILISATEUR')
  console.log('==============================================')

  try {
    const email = 'pro.ekicare@ekicare.com'
    const newPassword = 'TestPassword123!'

    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Nouveau mot de passe: ${newPassword}`)

    // 1. Trouver l'utilisateur
    console.log('\n🔍 Recherche de l\'utilisateur...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Erreur lors de la recherche des utilisateurs:', authError)
      return
    }

    const user = authUsers.users.find(u => u.email === email)
    if (!user) {
      console.error('❌ Utilisateur non trouvé dans auth.users')
      return
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`)

    // 2. Mettre à jour le mot de passe
    console.log('\n🔄 Mise à jour du mot de passe...')
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword
      }
    )

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour du mot de passe:', updateError)
      return
    }

    console.log('✅ Mot de passe mis à jour avec succès')

    // 3. Tester la connexion
    console.log('\n🧪 Test de la connexion...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: newPassword
    })

    if (loginError) {
      console.error('❌ Erreur lors du test de connexion:', loginError)
      return
    }

    console.log('✅ Connexion réussie !')
    console.log(`   Utilisateur: ${loginData.user.email}`)
    console.log(`   ID: ${loginData.user.id}`)

    // 4. Vérifier le profil professionnel
    console.log('\n👨‍⚕️ Vérification du profil professionnel...')
    const { data: proProfile, error: proError } = await supabase
      .from('pro_profiles')
      .select('is_verified, is_subscribed')
      .eq('user_id', user.id)
      .single()

    if (proError) {
      console.error('❌ Erreur lors de la récupération du profil:', proError)
      return
    }

    console.log(`   Vérifié: ${proProfile.is_verified ? '✅ OUI' : '❌ NON'}`)
    console.log(`   Abonné: ${proProfile.is_subscribed ? '✅ OUI' : '❌ NON'}`)

    if (proProfile.is_verified && proProfile.is_subscribed) {
      console.log('✅ → Redirection vers /dashboard/pro')
    } else {
      console.log('❌ → Redirection vers /paiement-requis')
    }

    console.log('\n🎉 RÉINITIALISATION TERMINÉE AVEC SUCCÈS !')
    console.log('L\'utilisateur peut maintenant se connecter avec le nouveau mot de passe.')

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error)
  }
}

// Exécuter la réinitialisation
resetUserPassword()
