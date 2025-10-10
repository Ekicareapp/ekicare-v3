#!/usr/bin/env node

/**
 * 🪣 CRÉATION DES BUCKETS SUPABASE STORAGE
 * Crée les buckets nécessaires pour les photos de profil
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

async function createStorageBuckets() {
  console.log('🪣 CRÉATION DES BUCKETS SUPABASE STORAGE')
  console.log('=======================================')

  try {
    // 1. Vérifier les buckets existants
    console.log('\n📦 BUCKETS EXISTANTS:')
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Erreur lors de la récupération des buckets:', listError)
      return
    }

    const bucketNames = existingBuckets?.map(b => b.name) || []
    console.log(`   Buckets trouvés: ${bucketNames.join(', ')}`)

    // 2. Créer le bucket pour les avatars/photos de profil
    const avatarBucketName = 'avatars'
    console.log(`\n🖼️  CRÉATION DU BUCKET "${avatarBucketName}":`)
    
    if (bucketNames.includes(avatarBucketName)) {
      console.log(`   ✅ Bucket "${avatarBucketName}" existe déjà`)
    } else {
      const { data: avatarBucket, error: avatarError } = await supabase.storage.createBucket(avatarBucketName, {
        public: true, // Rendre public pour l'affichage des images
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (avatarError) {
        console.error(`   ❌ Erreur lors de la création du bucket "${avatarBucketName}":`, avatarError)
      } else {
        console.log(`   ✅ Bucket "${avatarBucketName}" créé avec succès`)
        console.log(`   📋 Configuration: Public=${avatarBucket.public}, MIME types autorisés, Taille max: 5MB`)
      }
    }

    // 3. Créer le bucket pour les photos de propriétaires (si nécessaire)
    const proprioBucketName = 'proprio_photos'
    console.log(`\n🏠 CRÉATION DU BUCKET "${proprioBucketName}":`)
    
    if (bucketNames.includes(proprioBucketName)) {
      console.log(`   ✅ Bucket "${proprioBucketName}" existe déjà`)
    } else {
      const { data: proprioBucket, error: proprioError } = await supabase.storage.createBucket(proprioBucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (proprioError) {
        console.error(`   ❌ Erreur lors de la création du bucket "${proprioBucketName}":`, proprioError)
      } else {
        console.log(`   ✅ Bucket "${proprioBucketName}" créé avec succès`)
        console.log(`   📋 Configuration: Public=${proprioBucket.public}, MIME types autorisés, Taille max: 5MB`)
      }
    }

    // 4. Vérifier que le bucket pro_photo existe et est public
    console.log(`\n👨‍⚕️ VÉRIFICATION DU BUCKET "pro_photo":`)
    
    if (bucketNames.includes('pro_photo')) {
      console.log(`   ✅ Bucket "pro_photo" existe`)
      
      // Essayer de rendre le bucket public
      const { error: updateError } = await supabase.storage.updateBucket('pro_photo', {
        public: true
      })

      if (updateError) {
        console.log(`   ⚠️  Impossible de rendre le bucket public: ${updateError.message}`)
        console.log(`   💡 Vous devrez le rendre public manuellement dans le dashboard Supabase`)
      } else {
        console.log(`   ✅ Bucket "pro_photo" rendu public`)
      }
    } else {
      console.log(`   ❌ Bucket "pro_photo" n'existe pas`)
    }

    // 5. Créer les policies RLS pour les buckets
    console.log('\n🔐 POLICIES RLS:')
    console.log('   ⚠️  Les policies RLS doivent être créées manuellement dans le dashboard Supabase')
    console.log('   📍 Dashboard > Storage > Policies')
    console.log('   📋 Policies nécessaires:')
    console.log('      - SELECT: Tous les utilisateurs authentifiés peuvent lire')
    console.log('      - INSERT: Les utilisateurs peuvent uploader leurs propres fichiers')
    console.log('      - UPDATE: Les utilisateurs peuvent modifier leurs propres fichiers')
    console.log('      - DELETE: Les utilisateurs peuvent supprimer leurs propres fichiers')

    // 6. Tester l'accès aux buckets
    console.log('\n🧪 TEST D\'ACCÈS AUX BUCKETS:')
    const bucketsToTest = ['avatars', 'proprio_photos', 'pro_photo']
    
    for (const bucketName of bucketsToTest) {
      try {
        const { data: files, error: testError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 })

        if (testError) {
          console.log(`   ❌ ${bucketName}: ${testError.message}`)
        } else {
          console.log(`   ✅ ${bucketName}: Accessible`)
        }
      } catch (error) {
        console.log(`   ❌ ${bucketName}: Erreur - ${error.message}`)
      }
    }

    console.log('\n🎉 CRÉATION DES BUCKETS TERMINÉE !')
    console.log('📋 Prochaines étapes:')
    console.log('   1. Vérifier les buckets dans le dashboard Supabase')
    console.log('   2. Configurer les policies RLS manuellement')
    console.log('   3. Tester l\'upload de photos dans l\'application')

  } catch (error) {
    console.error('❌ Erreur lors de la création des buckets:', error)
  }
}

// Exécuter la création des buckets
createStorageBuckets()
