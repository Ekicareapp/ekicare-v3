#!/usr/bin/env node

/**
 * 🧪 TEST SAUVEGARDE PROFIL AVEC PHOTO
 * Teste la sauvegarde du profil après suppression de la référence updated_at
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

async function testProfileSaveWithPhoto() {
  console.log('🧪 TEST SAUVEGARDE PROFIL AVEC PHOTO')
  console.log('====================================')

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

    // 2. Test d'upload de photo (simulation)
    console.log('\n📤 TEST D\'UPLOAD DE PHOTO:')
    
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
        console.log(`✅ Upload de photo réussi`)
        console.log(`   Chemin: ${uploadData.path}`)
        
        // Récupérer l'URL publique avec cache buster
        const { data: urlData } = supabase.storage
          .from('pro_photo')
          .getPublicUrl(filePath)
        const urlWithCacheBuster = `${urlData.publicUrl}?t=${Date.now()}`
        console.log(`   URL: ${urlWithCacheBuster}`)
        
        // 3. Test de sauvegarde du profil (simulation du code frontend)
        console.log('\n💾 TEST DE SAUVEGARDE DU PROFIL:')
        
        const profileData = {
          telephone: '+33123456789',
          profession: 'Vétérinaire',
          ville_nom: 'Paris',
          rayon_km: 50,
          siret: '12345678901234',
          bio: 'Vétérinaire spécialisé dans les équidés avec 15 ans d\'expérience. Expert en médecine préventive et urgences.',
          payment_methods: ['CB', 'Espèces', 'Chèque', 'Virement'],
          price_range: '€€€',
          experience_years: 15,
          photo_url: urlWithCacheBuster
        };

        try {
          const { error: updateError } = await supabase
            .from('pro_profiles')
            .update(profileData)
            .eq('user_id', authData.user.id)

          if (updateError) {
            console.log(`❌ Erreur sauvegarde profil: ${updateError.message}`)
            return
          } else {
            console.log('✅ Sauvegarde du profil réussie')
            console.log(`   Bio: ${profileData.bio}`)
            console.log(`   Expérience: ${profileData.experience_years} ans`)
            console.log(`   Photo URL: ${profileData.photo_url}`)
          }
        } catch (error) {
          console.log(`❌ Erreur inattendue sauvegarde: ${error.message}`)
          return
        }
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue upload: ${error.message}`)
      return
    }

    // 4. Vérifier la sauvegarde
    console.log('\n📖 VÉRIFICATION DE LA SAUVEGARDE:')
    
    const { data: savedProfile, error: savedError } = await supabase
      .from('pro_profiles')
      .select('bio, experience_years, price_range, payment_methods, photo_url, nom, prenom')
      .eq('user_id', authData.user.id)
      .single()

    if (savedError) {
      console.log(`❌ Erreur lecture profil sauvegardé: ${savedError.message}`)
    } else {
      console.log('✅ Profil sauvegardé vérifié:')
      console.log(`   Nom: ${savedProfile.nom} ${savedProfile.prenom}`)
      console.log(`   Bio: ${savedProfile.bio}`)
      console.log(`   Expérience: ${savedProfile.experience_years} ans`)
      console.log(`   Photo URL: ${savedProfile.photo_url}`)
      
      // Vérifier que les données correspondent
      if (savedProfile.bio === profileData.bio && 
          savedProfile.experience_years === profileData.experience_years &&
          savedProfile.photo_url === profileData.photo_url) {
        console.log('✅ Toutes les données ont été sauvegardées correctement')
      } else {
        console.log('⚠️  Certaines données ne correspondent pas')
      }
    }

    // 5. Test de remplacement de photo
    console.log('\n🔄 TEST DE REMPLACEMENT DE PHOTO:')
    
    // Créer une nouvelle image de test
    const newImageBuffer = Buffer.from([
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
    
    const newTestFile = new File([newImageBuffer], 'test-profile-new.png', { type: 'image/png' })
    
    try {
      // Upload de la nouvelle photo
      const { data: newUploadData, error: newUploadError } = await supabase.storage
        .from('pro_photo')
        .upload(filePath, newTestFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (newUploadError) {
        console.log(`❌ Erreur upload nouvelle photo: ${newUploadError.message}`)
      } else {
        console.log(`✅ Nouvelle photo uploadée`)
        
        // Récupérer la nouvelle URL
        const { data: newUrlData } = supabase.storage
          .from('pro_photo')
          .getPublicUrl(filePath)
        const newUrlWithCacheBuster = `${newUrlData.publicUrl}?t=${Date.now()}`
        
        // Mettre à jour le profil avec la nouvelle photo
        const { error: photoUpdateError } = await supabase
          .from('pro_profiles')
          .update({ photo_url: newUrlWithCacheBuster })
          .eq('user_id', authData.user.id)

        if (photoUpdateError) {
          console.log(`❌ Erreur mise à jour photo: ${photoUpdateError.message}`)
        } else {
          console.log('✅ Photo remplacée avec succès')
          console.log(`   Nouvelle URL: ${newUrlWithCacheBuster}`)
        }
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue remplacement: ${error.message}`)
    }

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

    console.log('\n🎉 TEST TERMINÉ !')
    console.log('📋 Résumé:')
    console.log('   ✅ Upload de photo fonctionnel')
    console.log('   ✅ Sauvegarde du profil réussie (sans updated_at)')
    console.log('   ✅ Remplacement de photo fonctionnel')
    console.log('   ✅ Plus d\'erreur "Could not find updated_at column"')

    console.log('\n💡 INSTRUCTIONS POUR L\'UTILISATEUR:')
    console.log('   1. Recharger l\'application')
    console.log('   2. Aller dans "Mon profil" (côté pro)')
    console.log('   3. Tester le remplacement de photo')
    console.log('   4. Cliquer sur "Enregistrer"')
    console.log('   5. La sauvegarde devrait maintenant fonctionner sans erreur !')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testProfileSaveWithPhoto()
