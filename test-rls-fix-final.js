#!/usr/bin/env node

/**
 * 🧪 TEST FINAL APRÈS CORRECTION RLS
 * Teste l'upload de photo après correction des policies RLS
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

async function testRLSFixFinal() {
  console.log('🧪 TEST FINAL APRÈS CORRECTION RLS')
  console.log('==================================')

  try {
    // 1. Connexion avec un utilisateur existant
    console.log('\n🔐 CONNEXION UTILISATEUR:')
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

    // 2. Test d'upload vers tous les buckets
    console.log('\n📤 TEST D\'UPLOAD VERS TOUS LES BUCKETS:')
    
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
    
    const bucketsToTest = [
      { name: 'avatars', description: 'Photos de profil générales' },
      { name: 'proprio_photos', description: 'Photos de propriétaires' },
      { name: 'pro_photo', description: 'Photos de professionnels' }
    ]
    
    let successCount = 0
    let totalCount = bucketsToTest.length
    
    for (const bucket of bucketsToTest) {
      console.log(`\n   📤 Test upload vers ${bucket.name}:`)
      console.log(`   📝 ${bucket.description}`)
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket.name)
          .upload(filePath, testFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.log(`   ❌ Erreur: ${uploadError.message}`)
          
          if (uploadError.message.includes('row-level security policy')) {
            console.log(`   🔍 Problème RLS: Les policies ne sont pas correctement configurées`)
            console.log(`   💡 Solution: Exécuter le script fix-storage-rls-final.sql`)
          }
        } else {
          console.log(`   ✅ Upload réussi`)
          console.log(`   📁 Chemin: ${uploadData.path}`)
          
          // Test de l'URL publique
          const { data: urlData } = supabase.storage
            .from(bucket.name)
            .getPublicUrl(filePath)
          console.log(`   🔗 URL: ${urlData.publicUrl}`)
          
          // Nettoyage
          await supabase.storage
            .from(bucket.name)
            .remove([filePath])
          console.log(`   🧹 Fichier supprimé`)
          
          successCount++
        }
      } catch (error) {
        console.log(`   ❌ Erreur inattendue: ${error.message}`)
      }
    }

    // 3. Résumé des tests
    console.log('\n📊 RÉSUMÉ DES TESTS:')
    console.log(`   ✅ Succès: ${successCount}/${totalCount}`)
    console.log(`   ❌ Échecs: ${totalCount - successCount}/${totalCount}`)
    
    if (successCount === totalCount) {
      console.log('\n🎉 TOUS LES TESTS RÉUSSIS !')
      console.log('📋 L\'upload de photo fonctionne parfaitement pour tous les buckets')
      console.log('💡 Vous pouvez maintenant uploader des photos de profil dans l\'application')
    } else if (successCount > 0) {
      console.log('\n⚠️  CERTAINS TESTS ONT RÉUSSI')
      console.log('📋 Certains buckets fonctionnent, d\'autres ont encore des problèmes')
      console.log('💡 Vérifiez que le script fix-storage-rls-final.sql a été exécuté')
    } else {
      console.log('\n❌ TOUS LES TESTS ONT ÉCHOUÉ')
      console.log('📋 Aucun bucket ne fonctionne')
      console.log('💡 Exécutez le script fix-storage-rls-final.sql dans le dashboard Supabase')
    }

    // 4. Test de mise à jour du profil
    if (successCount > 0) {
      console.log('\n💾 TEST DE MISE À JOUR DU PROFIL:')
      
      try {
        // Upload vers avatars pour le test
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, testFile, { upsert: true })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

          // Mettre à jour le profil
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
          
          // Nettoyage
          await supabase.storage
            .from('avatars')
            .remove([filePath])
        }
      } catch (error) {
        console.log(`❌ Erreur test profil: ${error.message}`)
      }
    }

    // 5. Déconnexion
    console.log('\n🔒 DÉCONNEXION:')
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.log(`⚠️  Erreur déconnexion: ${signOutError.message}`)
    } else {
      console.log('✅ Utilisateur déconnecté')
    }

    console.log('\n🎯 TEST FINAL TERMINÉ !')
    console.log('📋 Instructions:')
    console.log('   1. Si tous les tests réussissent: Upload de photo fonctionnel ✅')
    console.log('   2. Si certains tests échouent: Exécuter fix-storage-rls-final.sql ⚠️')
    console.log('   3. Recharger l\'application après exécution du script SQL 🔄')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testRLSFixFinal()
