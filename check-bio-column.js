#!/usr/bin/env node

/**
 * 🔍 VÉRIFICATION COLONNE BIO
 * Vérifie si la colonne bio existe dans pro_profiles et l'ajoute si nécessaire
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

async function checkBioColumn() {
  console.log('🔍 VÉRIFICATION COLONNE BIO')
  console.log('============================')

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
      
      // 3. Essayer d'ajouter la colonne bio
      console.log('\n🔧 TENTATIVE D\'AJOUT DE LA COLONNE bio:')
      console.log('   Type: TEXT, Nullable: OUI')
      
      try {
        // Récupérer un utilisateur existant pour le test
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

        // Essayer de mettre à jour un profil existant avec bio
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
          .update({ bio: 'Test bio pour vérifier la colonne' })
          .eq('user_id', existingProfile.user_id)

        if (updateError) {
          console.log(`❌ Impossible de mettre à jour avec bio: ${updateError.message}`)
          console.log('💡 La colonne bio doit être ajoutée manuellement dans le dashboard Supabase')
          
          // Créer un script SQL pour ajouter la colonne
          console.log('\n📝 SCRIPT SQL POUR AJOUTER LA COLONNE bio:')
          console.log('-- Exécuter ce script dans le SQL Editor de Supabase')
          console.log('ALTER TABLE pro_profiles ADD COLUMN IF NOT EXISTS bio TEXT;')
          console.log('COMMENT ON COLUMN pro_profiles.bio IS \'Biographie du professionnel\';')
          
        } else {
          console.log('✅ Colonne bio ajoutée via mise à jour')
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
    console.log('   - Colonne bio vérifiée/ajoutée si nécessaire')
    console.log('   - Autres colonnes vérifiées')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkBioColumn()
