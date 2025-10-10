#!/usr/bin/env node

/**
 * 🔍 VÉRIFICATION COLONNE updated_at
 * Vérifie si la colonne updated_at existe dans pro_profiles et son utilisation dans le code
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

async function checkUpdatedAtColumn() {
  console.log('🔍 VÉRIFICATION COLONNE updated_at')
  console.log('==================================')

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

    // 2. Vérifier spécifiquement la colonne updated_at
    console.log('\n🔍 VÉRIFICATION DE LA COLONNE updated_at:')
    const { data: updatedAtTest, error: updatedAtError } = await supabase
      .from('pro_profiles')
      .select('updated_at')
      .limit(1)

    if (updatedAtError) {
      console.log(`❌ Colonne updated_at manquante: ${updatedAtError.message}`)
    } else {
      console.log('✅ Colonne updated_at existe')
    }

    // 3. Vérifier les colonnes de timestamp existantes
    console.log('\n🔍 VÉRIFICATION DES COLONNES DE TIMESTAMP:')
    const timestampColumns = ['created_at', 'updated_at', 'last_activity']
    
    for (const column of timestampColumns) {
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

    // 4. Rechercher l'utilisation d'updated_at dans le code
    console.log('\n🔍 RECHERCHE D\'updated_at DANS LE CODE:')
    
    const filesToCheck = [
      'app/dashboard/pro/profil/page.tsx',
      'app/api/auth/signup/route.ts',
      'app/api/stripe/webhook/route.ts'
    ]
    
    for (const filePath of filesToCheck) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n')
        
        const updatedAtLines = lines.filter((line, index) => 
          line.includes('updated_at') && !line.trim().startsWith('//')
        )
        
        if (updatedAtLines.length > 0) {
          console.log(`\n📄 ${filePath}:`)
          updatedAtLines.forEach((line, index) => {
            const lineNumber = lines.indexOf(line) + 1
            console.log(`   Ligne ${lineNumber}: ${line.trim()}`)
          })
        }
      }
    }

    // 5. Test de sauvegarde pour reproduire l'erreur
    console.log('\n🧪 TEST DE SAUVEGARDE POUR REPRODUIRE L\'ERREUR:')
    
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

    // Test de mise à jour du profil
    try {
      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update({ 
          bio: 'Test bio pour vérifier updated_at',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', authData.user.id)

      if (updateError) {
        console.log(`❌ Erreur mise à jour avec updated_at: ${updateError.message}`)
        console.log('💡 La colonne updated_at doit être ajoutée ou retirée du code')
      } else {
        console.log('✅ Mise à jour avec updated_at réussie')
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue: ${error.message}`)
    }

    // 6. Déconnexion
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.log(`⚠️  Erreur déconnexion: ${signOutError.message}`)
    } else {
      console.log('✅ Utilisateur déconnecté')
    }

    console.log('\n🎉 VÉRIFICATION TERMINÉE !')
    console.log('📋 Résumé:')
    console.log('   - Structure de pro_profiles vérifiée')
    console.log('   - Colonne updated_at vérifiée')
    console.log('   - Utilisation dans le code identifiée')
    console.log('   - Test de sauvegarde effectué')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkUpdatedAtColumn()
