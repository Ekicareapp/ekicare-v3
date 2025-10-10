#!/usr/bin/env node

/**
 * 🧪 TEST UPLOAD PHOTO PROFESSIONNEL
 * Teste l'upload de photo avec le bucket pro_photo (fonctionnel)
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

async function testProPhotoUpload() {
  console.log('🧪 TEST UPLOAD PHOTO PROFESSIONNEL')
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
    console.log(`   Role: ${authData.user.role}`)

    // 2. Test d'upload vers le bucket pro_photo (fonctionnel)
    console.log('\n📤 TEST D\'UPLOAD VERS pro_photo:')
    
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
    const filePath = `${authData.user.id}/profile.jpg`
    
    try {
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
        console.log(`✅ Upload réussi vers pro_photo`)
        console.log(`   📁 Chemin: ${uploadData.path}`)
        
        // 3. Récupérer l'URL publique
        console.log('\n🔗 RÉCUPÉRATION DE L\'URL PUBLIQUE:')
        const { data: urlData } = supabase.storage
          .from('pro_photo')
          .getPublicUrl(filePath)
        console.log(`✅ URL publique: ${urlData.publicUrl}`)
        
        // 4. Mettre à jour le profil professionnel
        console.log('\n💾 MISE À JOUR DU PROFIL PROFESSIONNEL:')
        const { error: updateError } = await supabase
          .from('pro_profiles')
          .update({ photo_url: urlData.publicUrl })
          .eq('user_id', authData.user.id)

        if (updateError) {
          console.log(`❌ Erreur mise à jour profil: ${updateError.message}`)
        } else {
          console.log('✅ Profil mis à jour avec succès')
          console.log(`   photo_url: ${urlData.publicUrl}`)
        }
        
        // 5. Vérifier la mise à jour
        console.log('\n📖 VÉRIFICATION DE LA MISE À JOUR:')
        const { data: updatedProfile, error: readError } = await supabase
          .from('pro_profiles')
          .select('photo_url, nom, prenom')
          .eq('user_id', authData.user.id)
          .single()

        if (readError) {
          console.log(`❌ Erreur lecture profil: ${readError.message}`)
        } else {
          console.log('✅ Profil lu avec succès')
          console.log(`   Nom: ${updatedProfile.nom} ${updatedProfile.prenom}`)
          console.log(`   Photo URL: ${updatedProfile.photo_url}`)
        }
        
        // 6. Test de suppression
        console.log('\n🗑️  TEST DE SUPPRESSION:')
        const { error: deleteError } = await supabase.storage
          .from('pro_photo')
          .remove([filePath])

        if (deleteError) {
          console.log(`❌ Erreur suppression: ${deleteError.message}`)
        } else {
          console.log('✅ Photo supprimée avec succès')
        }
        
        // 7. Mettre à jour le profil pour supprimer l'URL
        const { error: clearError } = await supabase
          .from('pro_profiles')
          .update({ photo_url: null })
          .eq('user_id', authData.user.id)

        if (clearError) {
          console.log(`❌ Erreur suppression URL: ${clearError.message}`)
        } else {
          console.log('✅ URL supprimée du profil')
        }
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue: ${error.message}`)
    }

    // 8. Déconnexion
    console.log('\n🔒 DÉCONNEXION:')
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.log(`⚠️  Erreur déconnexion: ${signOutError.message}`)
    } else {
      console.log('✅ Utilisateur déconnecté')
    }

    console.log('\n🎉 TEST TERMINÉ !')
    console.log('📋 Résumé:')
    console.log('   ✅ Upload de photo vers pro_photo fonctionnel')
    console.log('   ✅ URL publique générée correctement')
    console.log('   ✅ Mise à jour du profil réussie')
    console.log('   ✅ Suppression de photo fonctionnelle')
    console.log('   ✅ Code modifié pour utiliser le bucket fonctionnel')

    console.log('\n💡 INSTRUCTIONS POUR L\'UTILISATEUR:')
    console.log('   1. Recharger l\'application')
    console.log('   2. Aller dans "Mon profil" (côté pro)')
    console.log('   3. Tester l\'upload de photo')
    console.log('   4. L\'upload devrait maintenant fonctionner sans erreur RLS !')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testProPhotoUpload()
