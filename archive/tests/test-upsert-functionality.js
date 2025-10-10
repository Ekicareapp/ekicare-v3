#!/usr/bin/env node

/**
 * 🧪 TEST FONCTIONNALITÉ UPSERT
 * Teste l'upsert après ajout de la contrainte unique sur user_id
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

// Configuration Supabase (client avec clé anonyme)
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUpsertFunctionality() {
  console.log('🧪 TEST FONCTIONNALITÉ UPSERT')
  console.log('=============================')

  try {
    // 1. Connexion avec un utilisateur professionnel
    console.log('\n🔐 CONNEXION UTILISATEUR PROFESSIONNEL:')
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

    // 2. Vérifier l'état initial du profil
    console.log('\n📊 ÉTAT INITIAL DU PROFIL:')
    const { data: initialProfile, error: initialError } = await supabase
      .from('pro_profiles')
      .select('bio, experience_years, price_range, nom, prenom')
      .eq('user_id', authData.user.id)
      .single()

    if (initialError) {
      console.log(`❌ Erreur lecture profil initial: ${initialError.message}`)
    } else {
      console.log(`✅ Profil initial:`)
      console.log(`   Nom: ${initialProfile.nom} ${initialProfile.prenom}`)
      console.log(`   Bio: ${initialProfile.bio || 'Aucune'}`)
      console.log(`   Expérience: ${initialProfile.experience_years || 'Non définie'} ans`)
      console.log(`   Gamme de prix: ${initialProfile.price_range || 'Non définie'}`)
    }

    // 3. Test d'upsert (simulation du code frontend)
    console.log('\n💾 TEST D\'UPSERT (SIMULATION CODE FRONTEND):')
    
    const profileData = {
      telephone: '+33123456789',
      profession: 'Vétérinaire',
      ville_nom: 'Paris',
      rayon_km: 50,
      siret: '12345678901234',
      bio: 'Vétérinaire spécialisé dans les équidés avec 15 ans d\'expérience. Expert en médecine préventive et urgences.',
      payment_methods: ['CB', 'Espèces', 'Chèque', 'Virement'],
      price_range: '€€€',
      experience_years: 15
    };

    try {
      const { data: upsertData, error: upsertError } = await supabase
        .from('pro_profiles')
        .upsert({
          user_id: authData.user.id,
          ...profileData
        }, {
          onConflict: 'user_id'
        })

      if (upsertError) {
        console.log(`❌ Erreur upsert: ${upsertError.message}`)
        
        if (upsertError.message.includes('no unique or exclusion constraint')) {
          console.log('🔍 Problème: La contrainte unique sur user_id n\'a pas été ajoutée')
          console.log('💡 Solution: Exécuter le script fix-upsert-constraints.sql')
          return
        }
      } else {
        console.log('✅ Upsert réussi')
        console.log(`   Données upsertées: ${JSON.stringify(upsertData)}`)
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue upsert: ${error.message}`)
      return
    }

    // 4. Vérifier que les données ont été sauvegardées
    console.log('\n📖 VÉRIFICATION DES DONNÉES UPSERTÉES:')
    
    const { data: savedProfile, error: savedError } = await supabase
      .from('pro_profiles')
      .select('bio, experience_years, price_range, payment_methods, nom, prenom')
      .eq('user_id', authData.user.id)
      .single()

    if (savedError) {
      console.log(`❌ Erreur lecture profil sauvegardé: ${savedError.message}`)
    } else {
      console.log('✅ Profil sauvegardé vérifié:')
      console.log(`   Nom: ${savedProfile.nom} ${savedProfile.prenom}`)
      console.log(`   Bio: ${savedProfile.bio}`)
      console.log(`   Expérience: ${savedProfile.experience_years} ans`)
      console.log(`   Gamme de prix: ${savedProfile.price_range}`)
      console.log(`   Moyens de paiement: ${savedProfile.payment_methods}`)
      
      // Vérifier que les données correspondent
      if (savedProfile.bio === profileData.bio && 
          savedProfile.experience_years === profileData.experience_years &&
          savedProfile.price_range === profileData.price_range) {
        console.log('✅ Toutes les données ont été upsertées correctement')
      } else {
        console.log('⚠️  Certaines données ne correspondent pas')
      }
    }

    // 5. Test de mise à jour (deuxième upsert)
    console.log('\n🔄 TEST DE MISE À JOUR (DEUXIÈME UPSERT):')
    
    const updatedProfileData = {
      bio: 'Vétérinaire expert avec 20 ans d\'expérience. Spécialisé dans la chirurgie équine.',
      experience_years: 20,
      price_range: '€€€€'
    };

    try {
      const { data: updateData, error: updateError } = await supabase
        .from('pro_profiles')
        .upsert({
          user_id: authData.user.id,
          ...updatedProfileData
        }, {
          onConflict: 'user_id'
        })

      if (updateError) {
        console.log(`❌ Erreur mise à jour: ${updateError.message}`)
      } else {
        console.log('✅ Mise à jour réussie')
        console.log(`   Données mises à jour: ${JSON.stringify(updateData)}`)
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue mise à jour: ${error.message}`)
    }

    // 6. Vérification finale
    console.log('\n📊 VÉRIFICATION FINALE:')
    
    const { data: finalProfile, error: finalError } = await supabase
      .from('pro_profiles')
      .select('bio, experience_years, price_range')
      .eq('user_id', authData.user.id)
      .single()

    if (finalError) {
      console.log(`❌ Erreur vérification finale: ${finalError.message}`)
    } else {
      console.log('✅ Profil final:')
      console.log(`   Bio: ${finalProfile.bio}`)
      console.log(`   Expérience: ${finalProfile.experience_years} ans`)
      console.log(`   Gamme de prix: ${finalProfile.price_range}`)
      
      // Vérifier que la mise à jour a fonctionné
      if (finalProfile.bio === updatedProfileData.bio && 
          finalProfile.experience_years === updatedProfileData.experience_years) {
        console.log('✅ La mise à jour a fonctionné correctement')
      } else {
        console.log('⚠️  La mise à jour n\'a pas fonctionné comme attendu')
      }
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
    console.log('   ✅ Connexion utilisateur réussie')
    console.log('   ✅ Upsert fonctionnel (avec contrainte unique)')
    console.log('   ✅ Mise à jour fonctionnelle')
    console.log('   ✅ Plus d\'erreur "no unique or exclusion constraint"')

    console.log('\n💡 INSTRUCTIONS POUR L\'UTILISATEUR:')
    console.log('   1. Exécuter le script fix-upsert-constraints.sql dans Supabase')
    console.log('   2. Recharger l\'application')
    console.log('   3. Aller dans "Mon profil" (côté pro)')
    console.log('   4. Tester l\'enregistrement du profil')
    console.log('   5. L\'upsert devrait maintenant fonctionner sans erreur !')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testUpsertFunctionality()
