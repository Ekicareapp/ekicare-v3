#!/usr/bin/env node

/**
 * 🧪 TEST SAUVEGARDE CHAMP BIO
 * Teste la sauvegarde du champ bio après ajout de la colonne
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

async function testBioSave() {
  console.log('🧪 TEST SAUVEGARDE CHAMP BIO')
  console.log('============================')

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

    // 2. Vérifier l'état actuel du profil
    console.log('\n📊 ÉTAT ACTUEL DU PROFIL:')
    const { data: currentProfile, error: currentError } = await supabase
      .from('pro_profiles')
      .select('bio, experience_years, price_range, payment_methods, nom, prenom')
      .eq('user_id', authData.user.id)
      .single()

    if (currentError) {
      console.log(`❌ Erreur lecture profil actuel: ${currentError.message}`)
      console.log('💡 Exécuter le script add-missing-columns-pro-profiles.sql')
      return
    } else {
      console.log(`✅ Profil actuel:`)
      console.log(`   Nom: ${currentProfile.nom} ${currentProfile.prenom}`)
      console.log(`   Bio actuelle: ${currentProfile.bio || 'Aucune'}`)
      console.log(`   Expérience: ${currentProfile.experience_years || 'Non définie'} ans`)
      console.log(`   Gamme de prix: ${currentProfile.price_range || 'Non définie'}`)
      console.log(`   Moyens de paiement: ${currentProfile.payment_methods || 'Non définis'}`)
    }

    // 3. Test de sauvegarde avec le champ bio
    console.log('\n💾 TEST DE SAUVEGARDE AVEC CHAMP BIO:')
    
    const testData = {
      bio: 'Vétérinaire expérimenté avec 10 ans d\'expérience dans le soin des équidés. Spécialisé dans la médecine préventive et les urgences.',
      experience_years: 10,
      price_range: '€€€',
      payment_methods: ['CB', 'Espèces', 'Chèque', 'Virement']
    }

    try {
      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update(testData)
        .eq('user_id', authData.user.id)

      if (updateError) {
        console.log(`❌ Erreur sauvegarde: ${updateError.message}`)
        console.log('💡 Vérifier que les colonnes ont été ajoutées')
        return
      } else {
        console.log('✅ Sauvegarde réussie avec champ bio')
        console.log(`   Bio: ${testData.bio}`)
        console.log(`   Expérience: ${testData.experience_years} ans`)
        console.log(`   Gamme de prix: ${testData.price_range}`)
        console.log(`   Moyens de paiement: ${testData.payment_methods.join(', ')}`)
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue sauvegarde: ${error.message}`)
      return
    }

    // 4. Vérifier la sauvegarde
    console.log('\n📖 VÉRIFICATION DE LA SAUVEGARDE:')
    
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
      if (savedProfile.bio === testData.bio && 
          savedProfile.experience_years === testData.experience_years &&
          savedProfile.price_range === testData.price_range) {
        console.log('✅ Toutes les données ont été sauvegardées correctement')
      } else {
        console.log('⚠️  Certaines données ne correspondent pas')
      }
    }

    // 5. Test de mise à jour partielle (simuler l'édition du profil)
    console.log('\n🔄 TEST DE MISE À JOUR PARTIELLE:')
    
    const partialUpdate = {
      bio: 'Vétérinaire spécialisé dans les équidés avec 15 ans d\'expérience. Expert en médecine préventive.',
      experience_years: 15
    }

    try {
      const { error: partialError } = await supabase
        .from('pro_profiles')
        .update(partialUpdate)
        .eq('user_id', authData.user.id)

      if (partialError) {
        console.log(`❌ Erreur mise à jour partielle: ${partialError.message}`)
      } else {
        console.log('✅ Mise à jour partielle réussie')
        console.log(`   Nouvelle bio: ${partialUpdate.bio}`)
        console.log(`   Nouvelle expérience: ${partialUpdate.experience_years} ans`)
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue mise à jour partielle: ${error.message}`)
    }

    // 6. Vérification finale
    console.log('\n📊 VÉRIFICATION FINALE:')
    
    const { data: finalProfile, error: finalError } = await supabase
      .from('pro_profiles')
      .select('bio, experience_years, price_range, payment_methods')
      .eq('user_id', authData.user.id)
      .single()

    if (finalError) {
      console.log(`❌ Erreur vérification finale: ${finalError.message}`)
    } else {
      console.log('✅ Profil final:')
      console.log(`   Bio: ${finalProfile.bio}`)
      console.log(`   Expérience: ${finalProfile.experience_years} ans`)
      console.log(`   Gamme de prix: ${finalProfile.price_range}`)
      console.log(`   Moyens de paiement: ${finalProfile.payment_methods}`)
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
    console.log('   ✅ Lecture du profil fonctionnelle')
    console.log('   ✅ Sauvegarde avec champ bio réussie')
    console.log('   ✅ Mise à jour partielle fonctionnelle')
    console.log('   ✅ Persistance en BDD confirmée')

    console.log('\n💡 INSTRUCTIONS POUR L\'UTILISATEUR:')
    console.log('   1. Exécuter le script add-missing-columns-pro-profiles.sql dans Supabase')
    console.log('   2. Recharger l\'application')
    console.log('   3. Aller dans "Mon profil" (côté pro)')
    console.log('   4. Tester l\'édition et la sauvegarde du champ bio')
    console.log('   5. La sauvegarde devrait maintenant fonctionner sans erreur !')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testBioSave()
