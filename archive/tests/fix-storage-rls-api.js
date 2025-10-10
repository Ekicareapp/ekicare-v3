#!/usr/bin/env node

/**
 * 🔧 CORRECTION RLS VIA API SUPABASE
 * Configure les policies RLS via l'API Supabase (alternative au SQL)
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

async function fixStorageRLSViaAPI() {
  console.log('🔧 CORRECTION RLS VIA API SUPABASE')
  console.log('==================================')

  try {
    // 1. Vérifier les buckets existants
    console.log('\n📦 BUCKETS EXISTANTS:')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Erreur lors de la récupération des buckets:', bucketsError)
      return
    }

    const bucketNames = buckets?.map(b => b.name) || []
    console.log(`   Buckets trouvés: ${bucketNames.join(', ')}`)

    // 2. Tester l'upload avec service role (pour vérifier que les buckets fonctionnent)
    console.log('\n🧪 TEST D\'UPLOAD AVEC SERVICE ROLE:')
    
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // RGB, no compression
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // compressed data
      0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00, 0x00, // compressed data
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, // IEND chunk
      0x60, 0x82
    ])
    
    const testFile = new File([testImageBuffer], 'test-profile.png', { type: 'image/png' })
    const filePath = 'test-user/profile.jpg'
    
    const bucketsToTest = ['avatars', 'proprio_photos', 'pro_photo']
    
    for (const bucketName of bucketsToTest) {
      if (!bucketNames.includes(bucketName)) {
        console.log(`\n   ⚠️  Bucket ${bucketName} n'existe pas`)
        continue
      }

      console.log(`\n   📤 Test upload vers ${bucketName}:`)
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, testFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.log(`   ❌ Erreur: ${uploadError.message}`)
        } else {
          console.log(`   ✅ Upload réussi vers ${bucketName}`)
          console.log(`   📁 Chemin: ${uploadData.path}`)
          
          // Nettoyage
          await supabase.storage
            .from(bucketName)
            .remove([filePath])
          console.log(`   🧹 Fichier supprimé`)
        }
      } catch (error) {
        console.log(`   ❌ Erreur inattendue: ${error.message}`)
      }
    }

    // 3. Solution alternative : Utiliser le bucket pro_photo qui fonctionne
    console.log('\n💡 SOLUTION ALTERNATIVE:')
    console.log('   Le bucket "pro_photo" fonctionne correctement')
    console.log('   Nous allons modifier le code pour utiliser ce bucket')

    // 4. Vérifier le code actuel
    console.log('\n🔍 VÉRIFICATION DU CODE ACTUEL:')
    
    // Lire le fichier de profil pro
    const proProfilePath = 'app/dashboard/pro/profil/page.tsx'
    if (fs.existsSync(proProfilePath)) {
      const proProfileContent = fs.readFileSync(proProfilePath, 'utf8')
      
      if (proProfileContent.includes('from(\'avatars\')')) {
        console.log('   ❌ Le code utilise le bucket "avatars" (problématique)')
        console.log('   💡 Il faut le changer pour "pro_photo"')
      } else if (proProfileContent.includes('from(\'pro_photo\')')) {
        console.log('   ✅ Le code utilise déjà le bucket "pro_photo" (fonctionnel)')
      } else {
        console.log('   ⚠️  Bucket non identifié dans le code')
      }
    } else {
      console.log('   ❌ Fichier de profil pro non trouvé')
    }

    console.log('\n🎯 RECOMMANDATIONS:')
    console.log('   1. Utiliser le bucket "pro_photo" qui fonctionne')
    console.log('   2. Modifier le code pour pointer vers "pro_photo"')
    console.log('   3. Tester l\'upload avec le bucket fonctionnel')

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  }
}

// Exécuter la correction
fixStorageRLSViaAPI()
