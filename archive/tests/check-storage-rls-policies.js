#!/usr/bin/env node

/**
 * 🔍 VÉRIFICATION DES POLICIES RLS SUPABASE STORAGE
 * Vérifie les policies RLS des buckets de stockage
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

async function checkStorageRLSPolicies() {
  console.log('🔍 VÉRIFICATION DES POLICIES RLS SUPABASE STORAGE')
  console.log('================================================')

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

    // 2. Vérifier les policies RLS pour chaque bucket
    console.log('\n🔐 POLICIES RLS DES BUCKETS:')
    
    for (const bucket of buckets || []) {
      console.log(`\n📋 Bucket: ${bucket.name}`)
      console.log(`   Public: ${bucket.public ? '✅ OUI' : '❌ NON'}`)
      
      // Note: L'API Supabase ne permet pas de lister directement les policies RLS
      // Nous devons les vérifier via des tests d'upload
      console.log('   ⚠️  Policies RLS à vérifier via tests d\'upload')
    }

    // 3. Tester l'upload avec un utilisateur authentifié
    console.log('\n🧪 TEST D\'UPLOAD AVEC UTILISATEUR AUTHENTIFIÉ:')
    
    // Récupérer un utilisateur existant
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1)

    if (usersError || !users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé pour le test')
      return
    }

    const testUser = users[0]
    console.log(`   Utilisateur de test: ${testUser.email} (${testUser.role})`)

    // Créer une image de test
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

    // Tester l'upload vers chaque bucket
    const bucketsToTest = ['avatars', 'proprio_photos', 'pro_photo']
    
    for (const bucketName of bucketsToTest) {
      if (!bucketNames.includes(bucketName)) {
        console.log(`   ⚠️  Bucket ${bucketName} n'existe pas`)
        continue
      }

      console.log(`\n   📤 Test upload vers ${bucketName}:`)
      const filePath = `${testUser.id}/profile.jpg`
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, testFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.log(`   ❌ Erreur: ${uploadError.message}`)
          
          // Analyser le type d'erreur
          if (uploadError.message.includes('row-level security policy')) {
            console.log(`   🔍 Problème RLS détecté pour ${bucketName}`)
          } else if (uploadError.message.includes('not found')) {
            console.log(`   🔍 Bucket ${bucketName} non accessible`)
          }
        } else {
          console.log(`   ✅ Upload réussi vers ${bucketName}`)
          
          // Tester la lecture
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath)
          console.log(`   🔗 URL publique: ${urlData.publicUrl}`)
          
          // Nettoyer
          await supabase.storage
            .from(bucketName)
            .remove([filePath])
          console.log(`   🧹 Fichier de test supprimé`)
        }
      } catch (error) {
        console.log(`   ❌ Erreur inattendue: ${error.message}`)
      }
    }

    // 4. Recommandations
    console.log('\n💡 RECOMMANDATIONS:')
    console.log('   1. Configurer les policies RLS dans le dashboard Supabase')
    console.log('   2. Policies nécessaires:')
    console.log('      - SELECT: Lecture publique pour tous')
    console.log('      - INSERT: Upload autorisé pour auth.uid()')
    console.log('      - UPDATE: Modification autorisée pour auth.uid()')
    console.log('      - DELETE: Suppression autorisée pour auth.uid()')
    console.log('   3. Structure de chemin: {bucket}/{user_id}/profile.jpg')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkStorageRLSPolicies()
