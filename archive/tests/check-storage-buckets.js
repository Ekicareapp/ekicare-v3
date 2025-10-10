#!/usr/bin/env node

/**
 * 🔍 VÉRIFICATION DES BUCKETS SUPABASE STORAGE
 * Vérifie l'existence et la configuration des buckets pour les photos de profil
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

async function checkStorageBuckets() {
  console.log('🔍 VÉRIFICATION DES BUCKETS SUPABASE STORAGE')
  console.log('============================================')

  try {
    // 1. Lister tous les buckets existants
    console.log('\n📦 BUCKETS EXISTANTS:')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Erreur lors de la récupération des buckets:', bucketsError)
      return
    }

    if (!buckets || buckets.length === 0) {
      console.log('⚠️  Aucun bucket trouvé')
    } else {
      console.log(`📈 Nombre de buckets: ${buckets.length}`)
      buckets.forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.name}`)
        console.log(`      ID: ${bucket.id}`)
        console.log(`      Public: ${bucket.public ? '✅ OUI' : '❌ NON'}`)
        console.log(`      Créé: ${bucket.created_at}`)
        console.log('')
      })
    }

    // 2. Vérifier spécifiquement les buckets pour les photos de profil
    console.log('🖼️  RECHERCHE DE BUCKETS POUR PHOTOS DE PROFIL:')
    const profileBuckets = buckets?.filter(bucket => 
      bucket.name.includes('profile') || 
      bucket.name.includes('avatar') || 
      bucket.name.includes('photo') ||
      bucket.name.includes('picture')
    ) || []

    if (profileBuckets.length === 0) {
      console.log('❌ Aucun bucket dédié aux photos de profil trouvé')
      console.log('   Buckets recherchés: profile_pictures, avatars, photos, pictures')
    } else {
      console.log(`✅ ${profileBuckets.length} bucket(s) pour photos de profil trouvé(s):`)
      profileBuckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (Public: ${bucket.public ? 'OUI' : 'NON'})`)
      })
    }

    // 3. Vérifier les policies des buckets de photos
    if (profileBuckets.length > 0) {
      console.log('\n🔐 POLICIES DES BUCKETS DE PHOTOS:')
      for (const bucket of profileBuckets) {
        console.log(`\n📋 Bucket: ${bucket.name}`)
        
        // Note: L'API Supabase ne permet pas de lister les policies directement
        // Il faudrait les vérifier manuellement dans le dashboard Supabase
        console.log('   ⚠️  Policies à vérifier manuellement dans le dashboard Supabase')
        console.log('   📍 Dashboard > Storage > Policies')
      }
    }

    // 4. Tester l'accès aux buckets
    console.log('\n🧪 TEST D\'ACCÈS AUX BUCKETS:')
    for (const bucket of buckets || []) {
      try {
        const { data: files, error: listError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1 })

        if (listError) {
          console.log(`   ❌ ${bucket.name}: ${listError.message}`)
        } else {
          console.log(`   ✅ ${bucket.name}: Accessible (${files?.length || 0} fichiers)`)
        }
      } catch (error) {
        console.log(`   ❌ ${bucket.name}: Erreur - ${error.message}`)
      }
    }

    // 5. Recommandations
    console.log('\n💡 RECOMMANDATIONS:')
    if (profileBuckets.length === 0) {
      console.log('   1. Créer un bucket "profile_pictures" ou "avatars"')
      console.log('   2. Configurer les policies RLS appropriées')
      console.log('   3. Rendre le bucket public pour l\'affichage des images')
    } else {
      console.log('   1. Vérifier que les policies RLS sont correctement configurées')
      console.log('   2. S\'assurer que le bucket est public pour l\'affichage')
      console.log('   3. Vérifier que le code frontend utilise le bon nom de bucket')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des buckets:', error)
  }
}

// Exécuter la vérification
checkStorageBuckets()
