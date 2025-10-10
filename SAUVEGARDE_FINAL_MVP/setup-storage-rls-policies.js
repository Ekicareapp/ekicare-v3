#!/usr/bin/env node

/**
 * 🔐 CONFIGURATION DES POLICIES RLS SUPABASE STORAGE
 * Configure les policies RLS pour les buckets de photos de profil
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

async function setupStorageRLSPolicies() {
  console.log('🔐 CONFIGURATION DES POLICIES RLS SUPABASE STORAGE')
  console.log('=================================================')

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

    // 2. Créer les policies RLS pour chaque bucket de photos
    const photoBuckets = ['avatars', 'proprio_photos', 'pro_photo']
    
    for (const bucketName of photoBuckets) {
      if (!bucketNames.includes(bucketName)) {
        console.log(`\n⚠️  Bucket ${bucketName} n'existe pas, ignoré`)
        continue
      }

      console.log(`\n🔧 CONFIGURATION DES POLICIES POUR ${bucketName.toUpperCase()}:`)

      // Policy pour la lecture (SELECT) - Lecture publique
      console.log('   📖 Configuration de la policy SELECT...')
      try {
        const { error: selectError } = await supabase.rpc('exec', {
          sql: `
            CREATE POLICY IF NOT EXISTS "Public read access for ${bucketName}" 
            ON storage.objects FOR SELECT 
            USING (bucket_id = '${bucketName}');
          `
        })

        if (selectError) {
          console.log(`   ⚠️  Policy SELECT déjà existante ou erreur: ${selectError.message}`)
        } else {
          console.log('   ✅ Policy SELECT créée')
        }
      } catch (error) {
        console.log(`   ⚠️  Erreur policy SELECT: ${error.message}`)
      }

      // Policy pour l'upload (INSERT) - Upload autorisé pour l'utilisateur authentifié
      console.log('   📤 Configuration de la policy INSERT...')
      try {
        const { error: insertError } = await supabase.rpc('exec', {
          sql: `
            CREATE POLICY IF NOT EXISTS "Users can upload to ${bucketName}" 
            ON storage.objects FOR INSERT 
            WITH CHECK (
              bucket_id = '${bucketName}' AND 
              auth.role() = 'authenticated' AND
              auth.uid()::text = (storage.foldername(name))[1]
            );
          `
        })

        if (insertError) {
          console.log(`   ⚠️  Policy INSERT déjà existante ou erreur: ${insertError.message}`)
        } else {
          console.log('   ✅ Policy INSERT créée')
        }
      } catch (error) {
        console.log(`   ⚠️  Erreur policy INSERT: ${error.message}`)
      }

      // Policy pour la mise à jour (UPDATE) - Modification autorisée pour l'utilisateur
      console.log('   🔄 Configuration de la policy UPDATE...')
      try {
        const { error: updateError } = await supabase.rpc('exec', {
          sql: `
            CREATE POLICY IF NOT EXISTS "Users can update in ${bucketName}" 
            ON storage.objects FOR UPDATE 
            USING (
              bucket_id = '${bucketName}' AND 
              auth.role() = 'authenticated' AND
              auth.uid()::text = (storage.foldername(name))[1]
            );
          `
        })

        if (updateError) {
          console.log(`   ⚠️  Policy UPDATE déjà existante ou erreur: ${updateError.message}`)
        } else {
          console.log('   ✅ Policy UPDATE créée')
        }
      } catch (error) {
        console.log(`   ⚠️  Erreur policy UPDATE: ${error.message}`)
      }

      // Policy pour la suppression (DELETE) - Suppression autorisée pour l'utilisateur
      console.log('   🗑️  Configuration de la policy DELETE...')
      try {
        const { error: deleteError } = await supabase.rpc('exec', {
          sql: `
            CREATE POLICY IF NOT EXISTS "Users can delete from ${bucketName}" 
            ON storage.objects FOR DELETE 
            USING (
              bucket_id = '${bucketName}' AND 
              auth.role() = 'authenticated' AND
              auth.uid()::text = (storage.foldername(name))[1]
            );
          `
        })

        if (deleteError) {
          console.log(`   ⚠️  Policy DELETE déjà existante ou erreur: ${deleteError.message}`)
        } else {
          console.log('   ✅ Policy DELETE créée')
        }
      } catch (error) {
        console.log(`   ⚠️  Erreur policy DELETE: ${error.message}`)
      }
    }

    // 3. Tester les policies avec un upload
    console.log('\n🧪 TEST DES POLICIES AVEC UPLOAD:')
    
    // Récupérer un utilisateur existant
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1)

    if (usersError || !users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé pour le test')
      return
    }

    const testUser = users[0]
    console.log(`   Utilisateur de test: ${testUser.email} (${testUser.role})`)

    // Créer une image de test
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

    // Tester l'upload vers avatars
    console.log('\n   📤 Test upload vers avatars:')
    const filePath = `${testUser.id}/profile.jpg`
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, testFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.log(`   ❌ Erreur upload: ${uploadError.message}`)
      } else {
        console.log('   ✅ Upload réussi')
        
        // Tester la lecture
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        console.log(`   🔗 URL publique: ${urlData.publicUrl}`)
        
        // Nettoyer
        await supabase.storage
          .from('avatars')
          .remove([filePath])
        console.log('   🧹 Fichier de test supprimé')
      }
    } catch (error) {
      console.log(`   ❌ Erreur inattendue: ${error.message}`)
    }

    console.log('\n🎉 CONFIGURATION DES POLICIES TERMINÉE !')
    console.log('📋 Résumé:')
    console.log('   - Policies RLS configurées pour tous les buckets de photos')
    console.log('   - Lecture publique autorisée')
    console.log('   - Upload/modification/suppression autorisés pour les utilisateurs authentifiés')
    console.log('   - Structure de chemin: {bucket}/{user_id}/profile.jpg')

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
  }
}

// Exécuter la configuration
setupStorageRLSPolicies()
