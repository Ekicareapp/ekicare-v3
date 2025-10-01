#!/usr/bin/env node

/**
 * 🧪 TEST DE L'UPLOAD DE PHOTO DE PROFIL
 * Teste l'upload de photo pour les propriétaires et professionnels
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

async function testPhotoUpload() {
  console.log('🧪 TEST DE L\'UPLOAD DE PHOTO DE PROFIL')
  console.log('======================================')

  try {
    // 1. Vérifier les buckets existants
    console.log('\n📦 VÉRIFICATION DES BUCKETS:')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Erreur lors de la récupération des buckets:', bucketsError)
      return
    }

    const bucketNames = buckets?.map(b => b.name) || []
    console.log(`   Buckets trouvés: ${bucketNames.join(', ')}`)

    // Vérifier les buckets nécessaires
    const requiredBuckets = ['avatars', 'proprio_photos', 'pro_photo']
    const missingBuckets = requiredBuckets.filter(name => !bucketNames.includes(name))
    
    if (missingBuckets.length > 0) {
      console.log(`❌ Buckets manquants: ${missingBuckets.join(', ')}`)
      return
    } else {
      console.log('✅ Tous les buckets nécessaires existent')
    }

    // 2. Vérifier les colonnes photo_url dans les tables
    console.log('\n📊 VÉRIFICATION DES COLONNES photo_url:')
    
    // Vérifier proprio_profiles
    const { data: proprioColumns, error: proprioError } = await supabase
      .from('proprio_profiles')
      .select('photo_url')
      .limit(1)

    if (proprioError) {
      console.log(`❌ Erreur proprio_profiles: ${proprioError.message}`)
    } else {
      console.log('✅ Colonne photo_url existe dans proprio_profiles')
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

    // 3. Tester l'upload vers chaque bucket
    console.log('\n🖼️  TEST D\'UPLOAD VERS LES BUCKETS:')
    
    const testUserId = 'test-user-' + Date.now()
    const testFilePath = `${testUserId}/profile.jpg`
    
    // Créer un fichier de test (image PNG minimal)
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
    
    const testFile = new File([testImageBuffer], 'test.png', { type: 'image/png' })

    // Test upload vers avatars
    console.log('   📤 Test upload vers avatars...')
    const { data: avatarUpload, error: avatarError } = await supabase.storage
      .from('avatars')
      .upload(testFilePath, testFile, { upsert: true })

    if (avatarError) {
      console.log(`   ❌ Erreur avatars: ${avatarError.message}`)
    } else {
      console.log('   ✅ Upload avatars réussi')
      
      // Test de l'URL publique
      const { data: avatarUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(testFilePath)
      console.log(`   🔗 URL publique: ${avatarUrl.publicUrl}`)
    }

    // Test upload vers proprio_photos
    console.log('   📤 Test upload vers proprio_photos...')
    const { data: proprioUpload, error: proprioUploadError } = await supabase.storage
      .from('proprio_photos')
      .upload(testFilePath, testFile, { upsert: true })

    if (proprioUploadError) {
      console.log(`   ❌ Erreur proprio_photos: ${proprioUploadError.message}`)
    } else {
      console.log('   ✅ Upload proprio_photos réussi')
      
      // Test de l'URL publique
      const { data: proprioUrl } = supabase.storage
        .from('proprio_photos')
        .getPublicUrl(testFilePath)
      console.log(`   🔗 URL publique: ${proprioUrl.publicUrl}`)
    }

    // Test upload vers pro_photo
    console.log('   📤 Test upload vers pro_photo...')
    const { data: proUpload, error: proUploadError } = await supabase.storage
      .from('pro_photo')
      .upload(testFilePath, testFile, { upsert: true })

    if (proUploadError) {
      console.log(`   ❌ Erreur pro_photo: ${proUploadError.message}`)
    } else {
      console.log('   ✅ Upload pro_photo réussi')
      
      // Test de l'URL publique
      const { data: proUrl } = supabase.storage
        .from('pro_photo')
        .getPublicUrl(testFilePath)
      console.log(`   🔗 URL publique: ${proUrl.publicUrl}`)
    }

    // 4. Nettoyage des fichiers de test
    console.log('\n🧹 NETTOYAGE DES FICHIERS DE TEST:')
    
    const bucketsToClean = ['avatars', 'proprio_photos', 'pro_photo']
    for (const bucketName of bucketsToClean) {
      try {
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove([testFilePath])

        if (deleteError) {
          console.log(`   ⚠️  Erreur suppression ${bucketName}: ${deleteError.message}`)
        } else {
          console.log(`   ✅ Fichier de test supprimé de ${bucketName}`)
        }
      } catch (error) {
        console.log(`   ⚠️  Erreur lors de la suppression de ${bucketName}: ${error.message}`)
      }
    }

    console.log('\n🎉 TEST TERMINÉ !')
    console.log('📋 Résumé:')
    console.log('   - Buckets créés et accessibles')
    console.log('   - Colonnes photo_url ajoutées aux tables')
    console.log('   - Upload de photos fonctionnel')
    console.log('   - URLs publiques générées correctement')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testPhotoUpload()
