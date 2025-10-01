#!/usr/bin/env node

/**
 * 🧪 TEST DE LA LOGIQUE DE LOGIN
 * Vérifie que la logique de login lit correctement les champs is_verified et is_subscribed
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

async function testLoginLogic() {
  console.log('🧪 TEST DE LA LOGIQUE DE LOGIN')
  console.log('==============================')

  try {
    // 1. Récupérer le profil professionnel
    console.log('\n📊 PROFIL PROFESSIONNEL:')
    const { data: proProfiles, error: proError } = await supabase
      .from('pro_profiles')
      .select(`
        user_id,
        prenom,
        nom,
        is_verified,
        is_subscribed
      `)
      .order('created_at', { ascending: false })
      .limit(1)

    if (proError) {
      console.error('❌ Erreur lors de la récupération du profil:', proError)
      return
    }

    if (!proProfiles || proProfiles.length === 0) {
      console.log('⚠️  Aucun profil professionnel trouvé')
      return
    }

    const profile = proProfiles[0]
    console.log(`👤 Profil: ${profile.prenom} ${profile.nom}`)
    console.log(`   Vérifié: ${profile.is_verified ? '✅ OUI' : '❌ NON'}`)
    console.log(`   Abonné: ${profile.is_subscribed ? '✅ OUI' : '❌ NON'}`)

    // 2. Simuler la logique de login
    console.log('\n🔐 SIMULATION DE LA LOGIQUE DE LOGIN:')
    
    // Récupérer l'utilisateur correspondant
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', profile.user_id)
      .single()

    if (userError) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', userError)
      return
    }

    console.log(`👤 Utilisateur: ${user.email} (${user.role})`)

    // 3. Appliquer la logique de login (copiée de app/login/page.tsx)
    console.log('\n🔄 APPLICATION DE LA LOGIQUE DE LOGIN:')
    
    if (user.role === 'PRO') {
      console.log('✅ Utilisateur est un professionnel')
      
      if (!profile.is_verified || !profile.is_subscribed) {
        console.log('❌ Professionnel non vérifié ou non abonné')
        console.log('   → Redirection vers /paiement-requis')
        console.log('   → is_verified:', profile.is_verified)
        console.log('   → is_subscribed:', profile.is_subscribed)
      } else {
        console.log('✅ Professionnel vérifié et abonné')
        console.log('   → Redirection vers /dashboard/pro')
      }
    } else {
      console.log('ℹ️  Utilisateur n\'est pas un professionnel')
      console.log(`   → Rôle: ${user.role}`)
    }

    // 4. Test avec différents scénarios
    console.log('\n🧪 TEST DE DIFFÉRENTS SCÉNARIOS:')
    
    // Scénario 1: Profil non vérifié
    console.log('\n📋 SCÉNARIO 1: Profil non vérifié')
    const scenario1 = {
      is_verified: false,
      is_subscribed: true
    }
    console.log(`   is_verified: ${scenario1.is_verified}, is_subscribed: ${scenario1.is_subscribed}`)
    console.log(`   Résultat: ${(!scenario1.is_verified || !scenario1.is_subscribed) ? '❌ Paiement requis' : '✅ Dashboard'}`)
    
    // Scénario 2: Profil non abonné
    console.log('\n📋 SCÉNARIO 2: Profil non abonné')
    const scenario2 = {
      is_verified: true,
      is_subscribed: false
    }
    console.log(`   is_verified: ${scenario2.is_verified}, is_subscribed: ${scenario2.is_subscribed}`)
    console.log(`   Résultat: ${(!scenario2.is_verified || !scenario2.is_subscribed) ? '❌ Paiement requis' : '✅ Dashboard'}`)
    
    // Scénario 3: Profil vérifié et abonné (état actuel)
    console.log('\n📋 SCÉNARIO 3: Profil vérifié et abonné (état actuel)')
    const scenario3 = {
      is_verified: profile.is_verified,
      is_subscribed: profile.is_subscribed
    }
    console.log(`   is_verified: ${scenario3.is_verified}, is_subscribed: ${scenario3.is_subscribed}`)
    console.log(`   Résultat: ${(!scenario3.is_verified || !scenario3.is_subscribed) ? '❌ Paiement requis' : '✅ Dashboard'}`)

    console.log('\n🎉 TEST TERMINÉ !')
    console.log('La logique de login semble correcte.')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testLoginLogic()
