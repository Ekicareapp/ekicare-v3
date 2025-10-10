#!/usr/bin/env node

/**
 * 🔍 VÉRIFICATION CONTRAINTES UPSERT
 * Vérifie les contraintes uniques sur pro_profiles pour l'upsert
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

async function checkUpsertConstraints() {
  console.log('🔍 VÉRIFICATION CONTRAINTES UPSERT')
  console.log('==================================')

  try {
    // 1. Vérifier les contraintes uniques sur pro_profiles
    console.log('\n📊 VÉRIFICATION DES CONTRAINTES UNIQUES:')
    
    // Récupérer les contraintes uniques via une requête SQL
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            tc.constraint_type
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = 'pro_profiles' 
            AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
          ORDER BY tc.constraint_name, kcu.ordinal_position;
        `
      })

    if (constraintsError) {
      console.log(`❌ Erreur récupération contraintes: ${constraintsError.message}`)
      console.log('💡 Tentative alternative...')
      
      // Alternative: vérifier via un test d'upsert
      console.log('\n🧪 TEST D\'UPSERT POUR DIAGNOSTIQUER:')
      
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

      // Test d'upsert
      try {
        const { data: upsertData, error: upsertError } = await supabase
          .from('pro_profiles')
          .upsert({
            user_id: authData.user.id,
            bio: 'Test bio pour vérifier upsert',
            experience_years: 5
          }, {
            onConflict: 'user_id'
          })

        if (upsertError) {
          console.log(`❌ Erreur upsert: ${upsertError.message}`)
          
          if (upsertError.message.includes('no unique or exclusion constraint')) {
            console.log('🔍 Problème identifié: user_id n\'a pas de contrainte unique')
            console.log('💡 Solution: Ajouter UNIQUE(user_id) à la table pro_profiles')
          }
        } else {
          console.log('✅ Upsert réussi')
          console.log(`   Données: ${JSON.stringify(upsertData)}`)
        }
      } catch (error) {
        console.log(`❌ Erreur inattendue upsert: ${error.message}`)
      }

      // Déconnexion
      await supabase.auth.signOut()
    } else {
      console.log('✅ Contraintes trouvées:')
      constraints?.forEach(constraint => {
        console.log(`   - ${constraint.constraint_name}: ${constraint.column_name} (${constraint.constraint_type})`)
      })
      
      // Vérifier si user_id a une contrainte unique
      const userIdConstraint = constraints?.find(c => c.column_name === 'user_id')
      if (userIdConstraint) {
        console.log(`✅ user_id a une contrainte unique: ${userIdConstraint.constraint_name}`)
      } else {
        console.log('❌ user_id n\'a pas de contrainte unique')
        console.log('💡 Solution: Ajouter UNIQUE(user_id) à la table pro_profiles')
      }
    }

    // 2. Vérifier la structure de la table
    console.log('\n📊 STRUCTURE DE LA TABLE pro_profiles:')
    const { data: columns, error: columnsError } = await supabase
      .from('pro_profiles')
      .select('*')
      .limit(1)

    if (columnsError) {
      console.error('❌ Erreur récupération structure:', columnsError)
    } else if (columns && columns.length > 0) {
      console.log('✅ Colonnes disponibles:')
      Object.keys(columns[0]).forEach(column => {
        console.log(`   - ${column}`)
      })
    }

    // 3. Créer un script SQL pour corriger le problème
    console.log('\n📝 SCRIPT SQL POUR CORRIGER LE PROBLÈME:')
    console.log('-- Exécuter ce script dans le SQL Editor de Supabase')
    console.log('-- Ajouter une contrainte unique sur user_id')
    console.log('')
    console.log('-- Vérifier d\'abord si la contrainte existe déjà')
    console.log('SELECT constraint_name, constraint_type')
    console.log('FROM information_schema.table_constraints')
    console.log('WHERE table_name = \'pro_profiles\' AND constraint_type = \'UNIQUE\';')
    console.log('')
    console.log('-- Ajouter la contrainte unique si elle n\'existe pas')
    console.log('ALTER TABLE pro_profiles ADD CONSTRAINT pro_profiles_user_id_unique UNIQUE (user_id);')
    console.log('')
    console.log('-- Vérifier que la contrainte a été ajoutée')
    console.log('SELECT constraint_name, constraint_type')
    console.log('FROM information_schema.table_constraints')
    console.log('WHERE table_name = \'pro_profiles\' AND constraint_type = \'UNIQUE\';')

    console.log('\n🎉 VÉRIFICATION TERMINÉE !')
    console.log('📋 Résumé:')
    console.log('   - Contraintes uniques vérifiées')
    console.log('   - Structure de la table vérifiée')
    console.log('   - Script de correction généré')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkUpsertConstraints()
