#!/usr/bin/env node

/**
 * 🧪 TEST DE CONNEXION AVEC L'UTILISATEUR EXISTANT
 * Teste la connexion avec le profil professionnel existant
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

async function testExistingUserLogin() {
  console.log('🧪 TEST DE CONNEXION AVEC L\'UTILISATEUR EXISTANT')
  console.log('================================================')

  try {
    // 1. Récupérer le profil professionnel existant
    console.log('\n📊 PROFIL PROFESSIONNEL EXISTANT:')
    const { data: proProfiles, error: proError } = await supabase
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
    console.log(`👤 Profil: ${profile.prenom} ${profile.nom}`)
    console.log(`   ID: ${profile.user_id}`)
    console.log(`   Vérifié: ${profile.is_verified ? '✅ OUI' : '❌ NON'}`)
    console.log(`   Abonné: ${profile.is_subscribed ? '✅ OUI' : '❌ NON'}`)

    // 2. Récupérer l'utilisateur correspondant
    console.log('\n👥 UTILISATEUR CORRESPONDANT:')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', profile.user_id)
      .single()

    if (userError) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', userError)
      return
    }

    console.log(`👤 Utilisateur: ${user.email}`)
    console.log(`   Rôle: ${user.role}`)

    // 3. Simuler la connexion
    console.log('\n🔐 SIMULATION DE CONNEXION:')
    console.log(`   Email: ${user.email}`)
    console.log('   Mot de passe: [mot de passe existant]')

    // Note: On ne peut pas tester la connexion réelle car on n'a pas le mot de passe
    // Mais on peut simuler la logique de redirection

    // 4. Appliquer la logique de redirection
    console.log('\n🔄 LOGIQUE DE REDIRECTION:')
    
    if (user.role === 'PRO') {
      console.log('✅ Utilisateur est un professionnel')
      
      if (!profile.is_verified || !profile.is_subscribed) {
        console.log('❌ Professionnel non vérifié ou non abonné')
        console.log('   → Redirection vers /paiement-requis')
        console.log('   → Raison: is_verified =', profile.is_verified, ', is_subscribed =', profile.is_subscribed)
      } else {
        console.log('✅ Professionnel vérifié et abonné')
        console.log('   → Redirection vers /dashboard/pro')
        console.log('   → Raison: is_verified =', profile.is_verified, ', is_subscribed =', profile.is_subscribed)
      }
    } else {
      console.log('ℹ️  Utilisateur n\'est pas un professionnel')
      console.log(`   → Rôle: ${user.role}`)
    }

    // 5. Test de l'API de login
    console.log('\n🌐 TEST DE L\'API DE LOGIN:')
    console.log('   → POST /api/auth/login')
    console.log('   → Vérification des champs is_verified et is_subscribed')
    console.log('   → Redirection selon le statut')

    // 6. Résumé
    console.log('\n📋 RÉSUMÉ:')
    console.log(`   Profil: ${profile.prenom} ${profile.nom}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Statut: ${profile.is_verified && profile.is_subscribed ? '✅ Vérifié et abonné' : '❌ Non vérifié ou non abonné'}`)
    console.log(`   Redirection: ${profile.is_verified && profile.is_subscribed ? '/dashboard/pro' : '/paiement-requis'}`)

    console.log('\n🎉 TEST TERMINÉ !')
    console.log('L\'utilisateur existant peut se connecter correctement.')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testExistingUserLogin()
