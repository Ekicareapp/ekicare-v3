#!/usr/bin/env node

/**
 * 🔍 VÉRIFICATION DE L'EXISTENCE DE L'UTILISATEUR
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

async function checkUserExists() {
  console.log('🔍 VÉRIFICATION DE L\'EXISTENCE DE L\'UTILISATEUR')
  console.log('===============================================')

  try {
    const email = 'pro.ekicare@ekicare.com'
    console.log(`📧 Recherche de l'utilisateur: ${email}`)

    // 1. Vérifier dans la table users
    console.log('\n📊 TABLE users:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)

    if (usersError) {
      console.error('❌ Erreur lors de la recherche dans users:', usersError)
    } else {
      console.log(`   Résultats: ${users.length}`)
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Rôle: ${user.role}`)
      })
    }

    // 2. Vérifier dans auth.users
    console.log('\n🔐 TABLE auth.users:')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Erreur lors de la recherche dans auth.users:', authError)
    } else {
      const matchingAuthUser = authUsers.users.find(u => u.email === email)
      if (matchingAuthUser) {
        console.log(`   ✅ Trouvé: ${matchingAuthUser.email} (ID: ${matchingAuthUser.id})`)
        console.log(`   Créé: ${matchingAuthUser.created_at}`)
        console.log(`   Confirmé: ${matchingAuthUser.email_confirmed_at ? 'OUI' : 'NON'}`)
      } else {
        console.log('   ❌ Non trouvé dans auth.users')
      }
    }

    // 3. Vérifier dans pro_profiles
    console.log('\n👨‍⚕️ TABLE pro_profiles:')
    const { data: proProfiles, error: proError } = await supabase
      .from('pro_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (proError) {
      console.error('❌ Erreur lors de la recherche dans pro_profiles:', proError)
    } else {
      console.log(`   Résultats: ${proProfiles.length}`)
      proProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ID: ${profile.user_id}, Nom: ${profile.prenom} ${profile.nom}`)
      })
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkUserExists()
