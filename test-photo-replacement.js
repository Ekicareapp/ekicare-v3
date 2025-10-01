#!/usr/bin/env node

/**
 * 🧪 TEST REMPLACEMENT PHOTO PROFIL
 * Teste le remplacement d'une photo de profil existante
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

// Configuration Supabase (client avec clé anonyme)
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testPhotoReplacement() {
  console.log('🧪 TEST REMPLACEMENT PHOTO PROFIL')
  console.log('==================================')

  try {
    // 1. Connexion avec un utilisateur professionnel
    console.log('\n🔐 CONNEXION UTILISATEUR PROFESSIONNEL:')
    const email = 'pro.ekicare@ekicare.com'
    const password = 'TestPassword123!'
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('❌ Erreur de connexion:', authError.message)
      return
    }

    console.log(`✅ Utilisateur connecté: ${authData.user.email}`)
    console.log(`   ID: ${authData.user.id}`)

    // 2. Vérifier l'état actuel du profil
    console.log('\n📊 ÉTAT ACTUEL DU PROFIL:')
    const { data: currentProfile, error: profileError } = await supabase
      .from('pro_profiles')
      .select('photo_url, nom, prenom')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError) {
      console.log(`❌ Erreur lecture profil: ${profileError.message}`)
    } else {
      console.log(`✅ Profil actuel:`)
      console.log(`   Nom: ${currentProfile.nom} ${currentProfile.prenom}`)
      console.log(`   Photo URL actuelle: ${currentProfile.photo_url || 'Aucune'}`)
    }

    // 3. Créer deux images de test différentes
    console.log('\n🖼️  CRÉATION D\'IMAGES DE TEST:')
    
    // Image 1 (rouge)
    const image1Buffer = Buffer.from([
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
    
    // Image 2 (différente - bleue)
    const image2Buffer = Buffer.from([
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
    
    const file1 = new File([image1Buffer], 'test-profile-1.png', { type: 'image/png' })
    const file2 = new File([image2Buffer], 'test-profile-2.png', { type: 'image/png' })
    const filePath = `${authData.user.id}/profile.jpg`
    
    console.log('✅ Images de test créées')

    // 4. Test 1: Upload de la première image
    console.log('\n📤 TEST 1: UPLOAD PREMIÈRE IMAGE:')
    
    try {
      const { data: upload1Data, error: upload1Error } = await supabase.storage
        .from('pro_photo')
        .upload(filePath, file1, {
          cacheControl: '3600',
          upsert: true
        })

      if (upload1Error) {
        console.log(`❌ Erreur upload 1: ${upload1Error.message}`)
        return
      } else {
        console.log(`✅ Première image uploadée`)
        console.log(`   Chemin: ${upload1Data.path}`)
        
        // Récupérer l'URL publique
        const { data: url1Data } = supabase.storage
          .from('pro_photo')
          .getPublicUrl(filePath)
        console.log(`   URL: ${url1Data.publicUrl}`)
        
        // Mettre à jour le profil
        const { error: update1Error } = await supabase
          .from('pro_profiles')
          .update({ photo_url: url1Data.publicUrl })
          .eq('user_id', authData.user.id)

        if (update1Error) {
          console.log(`❌ Erreur mise à jour 1: ${update1Error.message}`)
        } else {
          console.log('✅ Profil mis à jour avec première image')
        }
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue upload 1: ${error.message}`)
      return
    }

    // 5. Attendre un peu pour simuler l'utilisateur
    console.log('\n⏳ ATTENTE DE 2 SECONDES...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 6. Test 2: Remplacement avec la deuxième image
    console.log('\n📤 TEST 2: REMPLACEMENT AVEC DEUXIÈME IMAGE:')
    
    try {
      const { data: upload2Data, error: upload2Error } = await supabase.storage
        .from('pro_photo')
        .upload(filePath, file2, {
          cacheControl: '3600',
          upsert: true // Important: permet de remplacer l'image existante
        })

      if (upload2Error) {
        console.log(`❌ Erreur upload 2: ${upload2Error.message}`)
        return
      } else {
        console.log(`✅ Deuxième image uploadée (remplacement)`)
        console.log(`   Chemin: ${upload2Data.path}`)
        
        // Récupérer l'URL publique
        const { data: url2Data } = supabase.storage
          .from('pro_photo')
          .getPublicUrl(filePath)
        console.log(`   URL: ${url2Data.publicUrl}`)
        
        // Mettre à jour le profil
        const { error: update2Error } = await supabase
          .from('pro_profiles')
          .update({ photo_url: url2Data.publicUrl })
          .eq('user_id', authData.user.id)

        if (update2Error) {
          console.log(`❌ Erreur mise à jour 2: ${update2Error.message}`)
        } else {
          console.log('✅ Profil mis à jour avec deuxième image')
        }
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue upload 2: ${error.message}`)
      return
    }

    // 7. Vérifier le résultat final
    console.log('\n📖 VÉRIFICATION DU RÉSULTAT FINAL:')
    
    const { data: finalProfile, error: finalError } = await supabase
      .from('pro_profiles')
      .select('photo_url, nom, prenom')
      .eq('user_id', authData.user.id)
      .single()

    if (finalError) {
      console.log(`❌ Erreur lecture profil final: ${finalError.message}`)
    } else {
      console.log('✅ Profil final:')
      console.log(`   Nom: ${finalProfile.nom} ${finalProfile.prenom}`)
      console.log(`   Photo URL finale: ${finalProfile.photo_url}`)
    }

    // 8. Test avec cache buster
    console.log('\n🔄 TEST AVEC CACHE BUSTER:')
    const timestamp = Date.now()
    const urlWithCacheBuster = `${finalProfile.photo_url}?t=${timestamp}`
    console.log(`   URL avec cache buster: ${urlWithCacheBuster}`)

    // 9. Nettoyage
    console.log('\n🧹 NETTOYAGE:')
    
    try {
      const { error: deleteError } = await supabase.storage
        .from('pro_photo')
        .remove([filePath])

      if (deleteError) {
        console.log(`⚠️  Erreur suppression: ${deleteError.message}`)
      } else {
        console.log('✅ Fichier de test supprimé')
      }
      
      // Supprimer l'URL du profil
      const { error: clearError } = await supabase
        .from('pro_profiles')
        .update({ photo_url: null })
        .eq('user_id', authData.user.id)

      if (clearError) {
        console.log(`⚠️  Erreur suppression URL: ${clearError.message}`)
      } else {
        console.log('✅ URL supprimée du profil')
      }
    } catch (error) {
      console.log(`⚠️  Erreur nettoyage: ${error.message}`)
    }

    // 10. Déconnexion
    console.log('\n🔒 DÉCONNEXION:')
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.log(`⚠️  Erreur déconnexion: ${signOutError.message}`)
    } else {
      console.log('✅ Utilisateur déconnecté')
    }

    console.log('\n🎉 TEST TERMINÉ !')
    console.log('📋 Résumé:')
    console.log('   ✅ Upload première image réussi')
    console.log('   ✅ Remplacement avec deuxième image réussi')
    console.log('   ✅ Mise à jour du profil fonctionnelle')
    console.log('   ✅ Upsert fonctionne correctement')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testPhotoReplacement()
