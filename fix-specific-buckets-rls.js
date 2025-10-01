#!/usr/bin/env node

/**
 * 🔧 CORRECTION SPÉCIFIQUE DES BUCKETS RLS
 * Corrige les policies RLS pour les buckets avatars et proprio_photos
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

async function fixSpecificBucketsRLS() {
  console.log('🔧 CORRECTION SPÉCIFIQUE DES BUCKETS RLS')
  console.log('=======================================')

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

    // 2. Supprimer les anciennes policies problématiques
    console.log('\n🗑️  SUPPRESSION DES ANCIENNES POLICIES:')
    
    const policiesToDelete = [
      'Public read access for avatars',
      'Users can upload to avatars',
      'Users can update in avatars',
      'Users can delete from avatars',
      'Public read access for proprio_photos',
      'Users can upload to proprio_photos',
      'Users can update in proprio_photos',
      'Users can delete from proprio_photos'
    ]

    for (const policyName of policiesToDelete) {
      try {
        const { error: deleteError } = await supabase.rpc('exec', {
          sql: `DROP POLICY IF EXISTS "${policyName}" ON storage.objects;`
        })

        if (deleteError) {
          console.log(`   ⚠️  Policy ${policyName}: ${deleteError.message}`)
        } else {
          console.log(`   ✅ Policy ${policyName} supprimée`)
        }
      } catch (error) {
        console.log(`   ⚠️  Erreur suppression ${policyName}: ${error.message}`)
      }
    }

    // 3. Créer de nouvelles policies simplifiées
    console.log('\n🔐 CRÉATION DE NOUVELLES POLICIES SIMPLIFIÉES:')
    
    const newPolicies = [
      {
        name: 'Allow public read access for avatars',
        sql: `CREATE POLICY "Allow public read access for avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');`
      },
      {
        name: 'Allow authenticated users to upload to avatars',
        sql: `CREATE POLICY "Allow authenticated users to upload to avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');`
      },
      {
        name: 'Allow authenticated users to update avatars',
        sql: `CREATE POLICY "Allow authenticated users to update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');`
      },
      {
        name: 'Allow authenticated users to delete avatars',
        sql: `CREATE POLICY "Allow authenticated users to delete avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');`
      },
      {
        name: 'Allow public read access for proprio_photos',
        sql: `CREATE POLICY "Allow public read access for proprio_photos" ON storage.objects FOR SELECT USING (bucket_id = 'proprio_photos');`
      },
      {
        name: 'Allow authenticated users to upload to proprio_photos',
        sql: `CREATE POLICY "Allow authenticated users to upload to proprio_photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'proprio_photos' AND auth.role() = 'authenticated');`
      },
      {
        name: 'Allow authenticated users to update proprio_photos',
        sql: `CREATE POLICY "Allow authenticated users to update proprio_photos" ON storage.objects FOR UPDATE USING (bucket_id = 'proprio_photos' AND auth.role() = 'authenticated');`
      },
      {
        name: 'Allow authenticated users to delete proprio_photos',
        sql: `CREATE POLICY "Allow authenticated users to delete proprio_photos" ON storage.objects FOR DELETE USING (bucket_id = 'proprio_photos' AND auth.role() = 'authenticated');`
      }
    ]

    for (const policy of newPolicies) {
      try {
        const { error: createError } = await supabase.rpc('exec', {
          sql: policy.sql
        })

        if (createError) {
          console.log(`   ❌ ${policy.name}: ${createError.message}`)
        } else {
          console.log(`   ✅ ${policy.name} créée`)
        }
      } catch (error) {
        console.log(`   ❌ Erreur création ${policy.name}: ${error.message}`)
      }
    }

    // 4. Tester les nouvelles policies
    console.log('\n🧪 TEST DES NOUVELLES POLICIES:')
    
    // Connexion utilisateur
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

    // Test d'upload
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
    
    const bucketsToTest = ['avatars', 'proprio_photos']
    
    for (const bucketName of bucketsToTest) {
      console.log(`\n   📤 Test upload vers ${bucketName}:`)
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, testFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.log(`   ❌ Erreur: ${uploadError.message}`)
        } else {
          console.log(`   ✅ Upload réussi vers ${bucketName}`)
          console.log(`   📁 Chemin: ${uploadData.path}`)
          
          // Nettoyage
          await supabase.storage
            .from(bucketName)
            .remove([filePath])
          console.log(`   🧹 Fichier supprimé`)
        }
      } catch (error) {
        console.log(`   ❌ Erreur inattendue: ${error.message}`)
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

    console.log('\n🎉 CORRECTION TERMINÉE !')
    console.log('📋 Résumé:')
    console.log('   - Anciennes policies supprimées')
    console.log('   - Nouvelles policies simplifiées créées')
    console.log('   - Tests d\'upload effectués')
    console.log('   - Buckets avatars et proprio_photos corrigés')

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  }
}

// Exécuter la correction
fixSpecificBucketsRLS()
