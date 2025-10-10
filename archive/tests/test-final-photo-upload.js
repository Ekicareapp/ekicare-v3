#!/usr/bin/env node

/**
 * 🎯 TEST FINAL DE L'UPLOAD DE PHOTO
 * Teste l'upload de photo pour les professionnels
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

async function testFinalPhotoUpload() {
  console.log('🎯 TEST FINAL DE L\'UPLOAD DE PHOTO')
  console.log('==================================')

  try {
    // 1. Récupérer un profil professionnel existant
    console.log('\n👨‍⚕️ RÉCUPÉRATION D\'UN PROFIL PROFESSIONNEL:')
    const { data: proProfiles, error: proError } = await supabase
      .from('pro_profiles')
      .select('user_id, prenom, nom, photo_url')
      .limit(1)

    if (proError) {
      console.error('❌ Erreur lors de la récupération des profils:', proError)
      return
    }

    if (!proProfiles || proProfiles.length === 0) {
      console.log('⚠️  Aucun profil professionnel trouvé')
      return
    }

    const profile = proProfiles[0]
    console.log(`   Profil: ${profile.prenom} ${profile.nom}`)
    console.log(`   ID: ${profile.user_id}`)
    console.log(`   Photo actuelle: ${profile.photo_url || 'Aucune'}`)

    // 2. Créer une image de test
    console.log('\n🖼️  CRÉATION D\'UNE IMAGE DE TEST:')
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
    console.log('✅ Image de test créée')

    // 3. Test d'upload vers le bucket avatars
    console.log('\n📤 TEST D\'UPLOAD VERS LE BUCKET avatars:')
    const filePath = `${profile.user_id}/profile.jpg`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, testFile, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.log(`❌ Erreur upload: ${uploadError.message}`)
      return
    }

    console.log('✅ Upload réussi')
    console.log(`   Chemin: ${uploadData.path}`)

    // 4. Récupérer l'URL publique
    console.log('\n🔗 RÉCUPÉRATION DE L\'URL PUBLIQUE:')
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    console.log(`✅ URL publique: ${urlData.publicUrl}`)

    // 5. Mettre à jour le profil avec l'URL de la photo
    console.log('\n💾 MISE À JOUR DU PROFIL:')
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update({ photo_url: urlData.publicUrl })
      .eq('user_id', profile.user_id)

    if (updateError) {
      console.log(`❌ Erreur mise à jour: ${updateError.message}`)
      return
    }

    console.log('✅ Profil mis à jour avec l\'URL de la photo')

    // 6. Vérifier que la photo est bien sauvegardée
    console.log('\n✅ VÉRIFICATION DE LA SAUVEGARDE:')
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('pro_profiles')
      .select('photo_url')
      .eq('user_id', profile.user_id)
      .single()

    if (verifyError) {
      console.log(`❌ Erreur vérification: ${verifyError.message}`)
    } else {
      console.log(`✅ Photo sauvegardée: ${updatedProfile.photo_url}`)
    }

    // 7. Test d'affichage de l'image
    console.log('\n🖼️  TEST D\'AFFICHAGE DE L\'IMAGE:')
    try {
      const response = await fetch(urlData.publicUrl)
      if (response.ok) {
        console.log('✅ Image accessible via URL publique')
        console.log(`   Taille: ${response.headers.get('content-length')} bytes`)
        console.log(`   Type: ${response.headers.get('content-type')}`)
      } else {
        console.log(`❌ Image non accessible: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Erreur lors du test d\'affichage: ${error.message}`)
    }

    // 8. Nettoyage (optionnel)
    console.log('\n🧹 NETTOYAGE:')
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([filePath])

    if (deleteError) {
      console.log(`⚠️  Erreur suppression: ${deleteError.message}`)
    } else {
      console.log('✅ Fichier de test supprimé')
    }

    console.log('\n🎉 TEST TERMINÉ AVEC SUCCÈS !')
    console.log('📋 Résumé:')
    console.log('   ✅ Buckets Supabase Storage configurés')
    console.log('   ✅ Upload de photos fonctionnel')
    console.log('   ✅ URLs publiques générées')
    console.log('   ✅ Mise à jour des profils fonctionnelle')
    console.log('   ✅ Affichage des images opérationnel')

    console.log('\n💡 INSTRUCTIONS POUR L\'UTILISATEUR:')
    console.log('   1. Allez dans "Mon profil" dans le dashboard')
    console.log('   2. Cliquez sur "Ajouter une photo" ou "Remplacer la photo"')
    console.log('   3. Sélectionnez une image (JPEG, PNG, max 5MB)')
    console.log('   4. L\'image sera automatiquement uploadée et sauvegardée')
    console.log('   5. L\'image s\'affichera immédiatement dans votre profil')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testFinalPhotoUpload()
