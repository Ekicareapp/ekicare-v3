#!/usr/bin/env node

/**
 * 🔍 DIAGNOSTIC COMPLET DES POLICIES RLS
 * Diagnostique pourquoi les policies RLS ne fonctionnent pas
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
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes dans .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseRLSIssue() {
  console.log('🔍 DIAGNOSTIC COMPLET DES POLICIES RLS')
  console.log('=====================================')

  try {
    // 1. Vérifier les buckets existants
    console.log('\n📦 BUCKETS EXISTANTS:')
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Erreur lors de la récupération des buckets:', bucketsError)
      return
    }

    const bucketNames = buckets?.map(b => b.name) || []
    console.log(`   Buckets trouvés: ${bucketNames.join(', ')}`)

    // 2. Vérifier les policies RLS existantes
    console.log('\n🔐 POLICIES RLS EXISTANTES:')
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, cmd, permissive, roles, qual, with_check')
      .eq('tablename', 'objects')

    if (policiesError) {
      console.log(`❌ Erreur récupération policies: ${policiesError.message}`)
    } else {
      console.log(`   Policies trouvées: ${policies?.length || 0}`)
      policies?.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      })
    }

    // 3. Vérifier si RLS est activé sur storage.objects
    console.log('\n🔒 VÉRIFICATION RLS SUR storage.objects:')
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('relrowsecurity')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage')

    if (rlsError) {
      console.log(`❌ Erreur vérification RLS: ${rlsError.message}`)
    } else {
      const isRLSEnabled = rlsStatus?.[0]?.relrowsecurity
      console.log(`   RLS activé: ${isRLSEnabled ? '✅ OUI' : '❌ NON'}`)
    }

    // 4. Test avec utilisateur authentifié
    console.log('\n🧪 TEST AVEC UTILISATEUR AUTHENTIFIÉ:')
    
    // Connexion utilisateur
    const email = 'pro.ekicare@ekicare.com'
    const password = 'TestPassword123!'
    
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
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

    // 5. Test d'upload vers différents buckets
    console.log('\n📤 TEST D\'UPLOAD VERS DIFFÉRENTS BUCKETS:')
    
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
    
    const bucketsToTest = ['avatars', 'proprio_photos', 'pro_photo']
    
    for (const bucketName of bucketsToTest) {
      if (!bucketNames.includes(bucketName)) {
        console.log(`\n   ⚠️  Bucket ${bucketName} n'existe pas`)
        continue
      }

      console.log(`\n   📤 Test upload vers ${bucketName}:`)
      
      try {
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
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
            console.log(`   💡 Les policies RLS ne sont pas correctement configurées`)
          } else if (uploadError.message.includes('permission denied')) {
            console.log(`   🔍 Permission refusée pour ${bucketName}`)
          } else if (uploadError.message.includes('not found')) {
            console.log(`   🔍 Bucket ${bucketName} non accessible`)
          }
        } else {
          console.log(`   ✅ Upload réussi vers ${bucketName}`)
          console.log(`   📁 Chemin: ${uploadData.path}`)
          
          // Nettoyage
          await supabaseClient.storage
            .from(bucketName)
            .remove([filePath])
          console.log(`   🧹 Fichier supprimé`)
        }
      } catch (error) {
        console.log(`   ❌ Erreur inattendue: ${error.message}`)
      }
    }

    // 6. Vérifier les permissions de l'utilisateur
    console.log('\n👤 VÉRIFICATION DES PERMISSIONS UTILISATEUR:')
    
    try {
      const { data: userProfile, error: profileError } = await supabaseClient
        .from('pro_profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      if (profileError) {
        console.log(`❌ Erreur profil: ${profileError.message}`)
      } else {
        console.log('✅ Profil utilisateur trouvé')
        console.log(`   Nom: ${userProfile.nom} ${userProfile.prenom}`)
        console.log(`   Vérifié: ${userProfile.is_verified}`)
        console.log(`   Abonné: ${userProfile.is_subscribed}`)
      }
    } catch (error) {
      console.log(`❌ Erreur vérification profil: ${error.message}`)
    }

    // 7. Test avec service role (pour comparaison)
    console.log('\n🔧 TEST AVEC SERVICE ROLE (pour comparaison):')
    
    try {
      const { data: adminUploadData, error: adminUploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(filePath, testFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (adminUploadError) {
        console.log(`❌ Erreur admin upload: ${adminUploadError.message}`)
      } else {
        console.log('✅ Upload avec service role réussi')
        console.log(`   📁 Chemin: ${adminUploadData.path}`)
        
        // Nettoyage
        await supabaseAdmin.storage
          .from('avatars')
          .remove([filePath])
        console.log('   🧹 Fichier supprimé')
      }
    } catch (error) {
      console.log(`❌ Erreur admin upload: ${error.message}`)
    }

    // 8. Déconnexion
    console.log('\n🔒 DÉCONNEXION:')
    const { error: signOutError } = await supabaseClient.auth.signOut()
    if (signOutError) {
      console.log(`⚠️  Erreur déconnexion: ${signOutError.message}`)
    } else {
      console.log('✅ Utilisateur déconnecté')
    }

    console.log('\n🎯 DIAGNOSTIC TERMINÉ !')
    console.log('📋 Résumé:')
    console.log('   - Buckets vérifiés')
    console.log('   - Policies RLS vérifiées')
    console.log('   - Tests d\'upload effectués')
    console.log('   - Permissions utilisateur vérifiées')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Exécuter le diagnostic
diagnoseRLSIssue()
