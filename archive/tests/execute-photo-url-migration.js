#!/usr/bin/env node

/**
 * 🔧 EXÉCUTION DE LA MIGRATION photo_url
 * Exécute le script SQL pour ajouter la colonne photo_url
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

async function executePhotoUrlMigration() {
  console.log('🔧 EXÉCUTION DE LA MIGRATION photo_url')
  console.log('=====================================')

  try {
    // 1. Lire le script SQL
    const sqlPath = path.join(__dirname, 'add-photo-url-to-proprio-profiles.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Script SQL chargé')

    // 2. Exécuter le script SQL
    console.log('\n🔄 Exécution du script SQL...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })

    if (error) {
      console.error('❌ Erreur lors de l\'exécution du script:', error)
      return
    }

    console.log('✅ Script SQL exécuté avec succès')

    // 3. Vérifier que les colonnes ont été ajoutées
    console.log('\n📊 VÉRIFICATION DES COLONNES:')
    
    // Vérifier proprio_profiles
    const { data: proprioColumns, error: proprioError } = await supabase
      .from('proprio_profiles')
      .select('photo_url')
      .limit(1)

    if (proprioError) {
      console.log(`❌ Erreur proprio_profiles: ${proprioError.message}`)
    } else {
      console.log('✅ Colonne photo_url ajoutée à proprio_profiles')
    }

    // Vérifier pro_profiles
    const { data: proColumns, error: proError } = await supabase
      .from('pro_profiles')
      .select('photo_url')
      .limit(1)

    if (proError) {
      console.log(`❌ Erreur pro_profiles: ${proError.message}`)
    } else {
      console.log('✅ Colonne photo_url existe dans pro_profiles')
    }

    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !')
    console.log('Les colonnes photo_url sont maintenant disponibles dans les deux tables.')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  }
}

// Exécuter la migration
executePhotoUrlMigration()
