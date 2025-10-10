#!/usr/bin/env node

/**
 * 🔍 VÉRIFICATION DE LA STRUCTURE DE LA TABLE pro_profiles
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

async function checkProProfilesStructure() {
  console.log('🔍 VÉRIFICATION DE LA STRUCTURE DE pro_profiles')
  console.log('===============================================')

  try {
    // 1. Vérifier la structure de la table
    console.log('\n📋 STRUCTURE DE LA TABLE:')
    const { data: columns, error: columnsError } = await supabase
      .from('pro_profiles')
      .select('*')
      .limit(1)

    if (columnsError) {
      console.error('❌ Erreur lors de la récupération de la structure:', columnsError)
      return
    }

    if (columns && columns.length > 0) {
      console.log('✅ Colonnes disponibles:')
      Object.keys(columns[0]).forEach(column => {
        console.log(`   - ${column}`)
      })
    } else {
      console.log('⚠️  Aucune donnée dans la table')
    }

    // 2. Récupérer tous les profils professionnels (sans subscription_end)
    console.log('\n📊 PROFILS PROFESSIONNELS:')
    const { data: proProfiles, error: proError } = await supabase
      .from('pro_profiles')
      .select(`
        user_id,
        prenom,
        nom,
        is_verified,
        is_subscribed,
        created_at,
        subscription_start
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

    // 3. Afficher le statut de chaque profil
    proProfiles.forEach((profile, index) => {
      console.log(`👤 PROFIL ${index + 1}:`)
      console.log(`   ID: ${profile.user_id}`)
      console.log(`   Nom: ${profile.prenom} ${profile.nom}`)
      console.log(`   Vérifié: ${profile.is_verified ? '✅ OUI' : '❌ NON'}`)
      console.log(`   Abonné: ${profile.is_subscribed ? '✅ OUI' : '❌ NON'}`)
      console.log(`   Créé: ${profile.created_at}`)
      console.log(`   Début abonnement: ${profile.subscription_start || 'Non défini'}`)
      console.log('')
    })

    // 4. Statistiques
    const verifiedCount = proProfiles.filter(p => p.is_verified).length
    const subscribedCount = proProfiles.filter(p => p.is_subscribed).length
    const bothVerifiedAndSubscribed = proProfiles.filter(p => p.is_verified && p.is_subscribed).length

    console.log('📊 STATISTIQUES:')
    console.log(`   Vérifiés: ${verifiedCount}/${proProfiles.length}`)
    console.log(`   Abonnés: ${subscribedCount}/${proProfiles.length}`)
    console.log(`   Vérifiés ET abonnés: ${bothVerifiedAndSubscribed}/${proProfiles.length}`)

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkProProfilesStructure()
