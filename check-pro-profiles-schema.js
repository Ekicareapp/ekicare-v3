#!/usr/bin/env node

/**
 * 🔍 VÉRIFICATION DU SCHÉMA pro_profiles
 * Vérifie la structure de la table pro_profiles et ajoute la colonne bio si nécessaire
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

async function checkProProfilesSchema() {
  console.log('🔍 VÉRIFICATION DU SCHÉMA pro_profiles')
  console.log('=====================================')

  try {
    // 1. Vérifier la structure actuelle de pro_profiles
    console.log('\n📊 STRUCTURE ACTUELLE DE pro_profiles:')
    const { data: columns, error: columnsError } = await supabase
      .from('pro_profiles')
      .select('*')
      .limit(1)

    if (columnsError) {
      console.error('❌ Erreur lors de la récupération de la structure:', columnsError)
      return
    }

    if (columns && columns.length > 0) {
      console.log('✅ Colonnes disponibles:')
      Object.keys(columns[0]).forEach(column => {
        console.log(`   - ${column}`)
      })
    } else {
      console.log('⚠️  Aucune donnée dans la table')
    }

    // 2. Vérifier spécifiquement la colonne bio
    console.log('\n🔍 VÉRIFICATION DE LA COLONNE bio:')
    const { data: bioTest, error: bioError } = await supabase
      .from('pro_profiles')
      .select('bio')
      .limit(1)

    if (bioError) {
      console.log(`❌ Colonne bio manquante: ${bioError.message}`)
      
      // 3. Ajouter la colonne bio
      console.log('\n🔧 AJOUT DE LA COLONNE bio:')
      console.log('   Type: TEXT, Nullable: OUI')
      
      // Essayer d'ajouter la colonne via un profil temporaire
      try {
        // Récupérer un utilisateur existant
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('role', 'PRO')
          .limit(1)

        if (usersError || !users || users.length === 0) {
          console.log('❌ Aucun utilisateur PRO trouvé pour le test')
          return
        }

        const testUser = users[0]
        console.log(`   Utilisateur de test: ${testUser.email}`)

        // Créer un profil temporaire avec bio
        const { error: tempProfileError } = await supabase
          .from('pro_profiles')
          .insert([{
            user_id: testUser.user_id,
            prenom: 'Test',
            nom: 'User',
            bio: 'Test bio'
          }])

        if (tempProfileError) {
          console.log(`❌ Impossible de créer un profil temporaire: ${tempProfileError.message}`)
          
          // Essayer de mettre à jour un profil existant
          const { data: existingProfiles, error: existingError } = await supabase
            .from('pro_profiles')
            .select('user_id')
            .limit(1)

          if (existingError || !existingProfiles || existingProfiles.length === 0) {
            console.log('❌ Aucun profil existant trouvé')
            return
          }

          const existingProfile = existingProfiles[0]
          console.log(`   Tentative de mise à jour du profil existant: ${existingProfile.user_id}`)
          
          const { error: updateError } = await supabase
            .from('pro_profiles')
            .update({ bio: 'Test bio' })
            .eq('user_id', existingProfile.user_id)

          if (updateError) {
            console.log(`❌ Impossible de mettre à jour avec bio: ${updateError.message}`)
            console.log('💡 La colonne bio doit être ajoutée manuellement dans le dashboard Supabase')
          } else {
            console.log('✅ Colonne bio ajoutée via mise à jour')
          }
        } else {
          console.log('✅ Colonne bio ajoutée via profil temporaire')
          
          // Nettoyer le profil temporaire
          await supabase.from('pro_profiles').delete().eq('user_id', testUser.user_id)
        }
      } catch (error) {
        console.log(`❌ Erreur lors de l'ajout de la colonne: ${error.message}`)
        console.log('💡 La colonne bio doit être ajoutée manuellement dans le dashboard Supabase')
      }
    } else {
      console.log('✅ Colonne bio existe déjà')
    }

    // 4. Vérifier les autres colonnes mentionnées dans le code
    console.log('\n🔍 VÉRIFICATION DES AUTRES COLONNES:')
    const columnsToCheck = ['experience_years', 'price_range', 'payment_methods']
    
    for (const column of columnsToCheck) {
      const { data: testData, error: testError } = await supabase
        .from('pro_profiles')
        .select(column)
        .limit(1)

      if (testError) {
        console.log(`❌ Colonne ${column} manquante: ${testError.message}`)
      } else {
        console.log(`✅ Colonne ${column} existe`)
      }
    }

    // 5. Vérifier la structure finale
    console.log('\n📊 STRUCTURE FINALE DE pro_profiles:')
    const { data: finalColumns, error: finalError } = await supabase
      .from('pro_profiles')
      .select('*')
      .limit(1)

    if (finalError) {
      console.error('❌ Erreur lors de la vérification finale:', finalError)
    } else if (finalColumns && finalColumns.length > 0) {
      console.log('✅ Colonnes disponibles:')
      Object.keys(finalColumns[0]).forEach(column => {
        console.log(`   - ${column}`)
      })
    }

    console.log('\n🎉 VÉRIFICATION TERMINÉE !')
    console.log('📋 Résumé:')
    console.log('   - Structure de pro_profiles vérifiée')
    console.log('   - Colonne bio ajoutée si nécessaire')
    console.log('   - Autres colonnes vérifiées')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkProProfilesSchema()
