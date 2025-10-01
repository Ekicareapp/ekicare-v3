#!/usr/bin/env node

/**
 * 🧪 TEST D'UPLOAD CÔTÉ CLIENT
 * Teste l'upload de photo avec un utilisateur authentifié (simulation côté client)
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

// Configuration Supabase (client avec clé anonyme pour simuler le côté client)
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testClientUpload() {
  console.log('🧪 TEST D\'UPLOAD CÔTÉ CLIENT')
  console.log('=============================')

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
    const filePath = `${authData.user.id}/profile.jpg`
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, testFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.log(`❌ Erreur upload: ${uploadError.message}`)
        
        // Analyser le type d'erreur
        if (uploadError.message.includes('row-level security policy')) {
          console.log('🔍 Problème RLS détecté - Les policies RLS bloquent l\'upload')
          console.log('💡 Solution: Exécuter le script storage-rls-policies.sql dans le dashboard Supabase')
        } else if (uploadError.message.includes('not found')) {
          console.log('🔍 Bucket non accessible')
        } else if (uploadError.message.includes('permission denied')) {
          console.log('🔍 Permission refusée - Vérifier les policies RLS')
        }
      } else {
        console.log('✅ Upload réussi')
        console.log(`   Chemin: ${uploadData.path}`)
        
        // 4. Récupérer l'URL publique
        console.log('\n🔗 RÉCUPÉRATION DE L\'URL PUBLIQUE:')
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        console.log(`✅ URL publique: ${urlData.publicUrl}`)
        
        // 5. Mettre à jour le profil
        console.log('\n💾 MISE À JOUR DU PROFIL:')
        const { error: updateError } = await supabase
          .from('pro_profiles')
          .update({ photo_url: urlData.publicUrl })
          .eq('user_id', authData.user.id)

        if (updateError) {
          console.log(`❌ Erreur mise à jour profil: ${updateError.message}`)
        } else {
          console.log('✅ Profil mis à jour avec l\'URL de la photo')
        }
        
        // 6. Nettoyage
        console.log('\n🧹 NETTOYAGE:')
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([filePath])

        if (deleteError) {
          console.log(`⚠️  Erreur suppression: ${deleteError.message}`)
        } else {
          console.log('✅ Fichier de test supprimé')
        }
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue: ${error.message}`)
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
    console.log('   - Test d\'upload côté client effectué')
    console.log('   - Si erreur RLS: Exécuter storage-rls-policies.sql')
    console.log('   - Si succès: Upload de photo fonctionnel')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testClientUpload()
