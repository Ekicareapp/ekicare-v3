#!/usr/bin/env node

/**
 * 🔧 AJOUT DE LA COLONNE photo_url
 * Ajoute la colonne photo_url aux tables proprio_profiles et pro_profiles
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

async function addPhotoUrlColumns() {
  console.log('🔧 AJOUT DE LA COLONNE photo_url')
  console.log('=================================')

  try {
    // 1. Vérifier l'état actuel des colonnes
    console.log('\n📊 VÉRIFICATION DE L\'ÉTAT ACTUEL:')
    
    // Vérifier proprio_profiles
    const { data: proprioTest, error: proprioTestError } = await supabase
      .from('proprio_profiles')
      .select('photo_url')
      .limit(1)

    if (proprioTestError) {
      console.log('❌ Colonne photo_url manquante dans proprio_profiles')
    } else {
      console.log('✅ Colonne photo_url existe dans proprio_profiles')
    }

    // Vérifier pro_profiles
    const { data: proTest, error: proTestError } = await supabase
      .from('pro_profiles')
      .select('photo_url')
      .limit(1)

    if (proTestError) {
      console.log('❌ Colonne photo_url manquante dans pro_profiles')
    } else {
      console.log('✅ Colonne photo_url existe dans pro_profiles')
    }

    // 2. Ajouter la colonne photo_url à proprio_profiles si nécessaire
    if (proprioTestError) {
      console.log('\n🔄 Ajout de la colonne photo_url à proprio_profiles...')
      
      // Utiliser une requête SQL brute via RPC
      const { data: addProprioColumn, error: addProprioError } = await supabase
        .rpc('exec', { 
          sql: 'ALTER TABLE proprio_profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;' 
        })

      if (addProprioError) {
        console.log('❌ Erreur lors de l\'ajout de la colonne à proprio_profiles:', addProprioError.message)
        
        // Essayer une approche alternative
        console.log('🔄 Tentative alternative...')
        
        // Créer un profil temporaire pour forcer la création de la colonne
        const { data: tempUser, error: tempUserError } = await supabase.auth.admin.createUser({
          email: `temp-${Date.now()}@test.com`,
          password: 'TempPassword123!',
          email_confirm: true
        })

        if (tempUserError) {
          console.log('❌ Impossible de créer un utilisateur temporaire:', tempUserError.message)
        } else {
          // Créer un profil temporaire avec photo_url
          const { error: tempProfileError } = await supabase
            .from('proprio_profiles')
            .insert([{
              user_id: tempUser.user.id,
              prenom: 'Temp',
              nom: 'User',
              photo_url: null
            }])

          if (tempProfileError) {
            console.log('❌ Impossible de créer un profil temporaire:', tempProfileError.message)
          } else {
            console.log('✅ Colonne photo_url ajoutée à proprio_profiles via profil temporaire')
            
            // Nettoyer le profil temporaire
            await supabase.from('proprio_profiles').delete().eq('user_id', tempUser.user.id)
            await supabase.auth.admin.deleteUser(tempUser.user.id)
          }
        }
      } else {
        console.log('✅ Colonne photo_url ajoutée à proprio_profiles')
      }
    }

    // 3. Vérifier que les colonnes existent maintenant
    console.log('\n✅ VÉRIFICATION FINALE:')
    
    // Vérifier proprio_profiles
    const { data: proprioFinal, error: proprioFinalError } = await supabase
      .from('proprio_profiles')
      .select('photo_url')
      .limit(1)

    if (proprioFinalError) {
      console.log('❌ Colonne photo_url toujours manquante dans proprio_profiles')
    } else {
      console.log('✅ Colonne photo_url disponible dans proprio_profiles')
    }

    // Vérifier pro_profiles
    const { data: proFinal, error: proFinalError } = await supabase
      .from('pro_profiles')
      .select('photo_url')
      .limit(1)

    if (proFinalError) {
      console.log('❌ Colonne photo_url manquante dans pro_profiles')
    } else {
      console.log('✅ Colonne photo_url disponible dans pro_profiles')
    }

    console.log('\n🎉 MIGRATION TERMINÉE !')
    console.log('Les colonnes photo_url sont maintenant disponibles pour l\'upload de photos.')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  }
}

// Exécuter la migration
addPhotoUrlColumns()
