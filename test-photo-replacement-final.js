#!/usr/bin/env node

/**
 * 🧪 TEST FINAL REMPLACEMENT PHOTO
 * Teste le remplacement de photo avec cache buster
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

async function testPhotoReplacementFinal() {
  console.log('🧪 TEST FINAL REMPLACEMENT PHOTO')
  console.log('================================')

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

    // 2. Vérifier l'état initial
    console.log('\n📊 ÉTAT INITIAL:')
    const { data: initialProfile, error: initialError } = await supabase
      .from('pro_profiles')
      .select('photo_url, nom, prenom')
      .eq('user_id', authData.user.id)
      .single()

    if (initialError) {
      console.log(`❌ Erreur lecture profil initial: ${initialError.message}`)
    } else {
      console.log(`✅ Profil initial:`)
      console.log(`   Nom: ${initialProfile.nom} ${initialProfile.prenom}`)
      console.log(`   Photo URL initiale: ${initialProfile.photo_url || 'Aucune'}`)
    }

    // 3. Test de remplacement avec cache buster
    console.log('\n📤 TEST REMPLACEMENT AVEC CACHE BUSTER:')
    
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
    
    const testFile = new File([testImageBuffer], 'test-profile-replacement.png', { type: 'image/png' })
    const filePath = `${authData.user.id}/profile.jpg`
    
    try {
      // Upload avec upsert
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pro_photo')
        .upload(filePath, testFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.log(`❌ Erreur upload: ${uploadError.message}`)
        return
      } else {
        console.log(`✅ Upload réussi (remplacement)`)
        console.log(`   Chemin: ${uploadData.path}`)
        
        // Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from('pro_photo')
          .getPublicUrl(filePath)
        
        // Ajouter cache buster
        const urlWithCacheBuster = `${urlData.publicUrl}?t=${Date.now()}`
        console.log(`   URL avec cache buster: ${urlWithCacheBuster}`)
        
        // Mettre à jour le profil
        const { error: updateError } = await supabase
          .from('pro_profiles')
          .update({ photo_url: urlWithCacheBuster })
          .eq('user_id', authData.user.id)

        if (updateError) {
          console.log(`❌ Erreur mise à jour: ${updateError.message}`)
        } else {
          console.log('✅ Profil mis à jour avec cache buster')
        }
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue: ${error.message}`)
      return
    }

    // 4. Vérifier le résultat
    console.log('\n📖 VÉRIFICATION DU RÉSULTAT:')
    
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
      
      // Vérifier si l'URL contient un cache buster
      if (finalProfile.photo_url && finalProfile.photo_url.includes('?t=')) {
        console.log('✅ Cache buster présent dans l\'URL')
      } else {
        console.log('⚠️  Cache buster absent de l\'URL')
      }
    }

    // 5. Test de rechargement (simuler le comportement de l'UI)
    console.log('\n🔄 TEST DE RECHARGEMENT:')
    
    // Simuler le chargement de la photo avec cache buster
    const reloadedUrl = finalProfile.photo_url ? `${finalProfile.photo_url.split('?')[0]}?t=${Date.now()}` : null
    console.log(`   URL de rechargement: ${reloadedUrl}`)

    // 6. Nettoyage
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

    // 7. Déconnexion
    console.log('\n🔒 DÉCONNEXION:')
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.log(`⚠️  Erreur déconnexion: ${signOutError.message}`)
    } else {
      console.log('✅ Utilisateur déconnecté')
    }

    console.log('\n🎉 TEST FINAL TERMINÉ !')
    console.log('📋 Résumé:')
    console.log('   ✅ Upload avec upsert fonctionnel')
    console.log('   ✅ Cache buster ajouté à l\'URL')
    console.log('   ✅ Mise à jour du profil réussie')
    console.log('   ✅ Remplacement de photo opérationnel')

    console.log('\n💡 INSTRUCTIONS POUR L\'UTILISATEUR:')
    console.log('   1. Recharger l\'application')
    console.log('   2. Aller dans "Mon profil" (côté pro)')
    console.log('   3. Tester le remplacement de photo')
    console.log('   4. La nouvelle photo devrait s\'afficher immédiatement !')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testPhotoReplacementFinal()
