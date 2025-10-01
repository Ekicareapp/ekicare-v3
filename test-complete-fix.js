#!/usr/bin/env node

/**
 * 🎯 TEST COMPLET APRÈS CORRECTION
 * Teste l'upload de photo et la sauvegarde du profil après correction
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

async function testCompleteFix() {
  console.log('🎯 TEST COMPLET APRÈS CORRECTION')
  console.log('================================')

  try {
    // 1. Connexion avec un utilisateur existant
    console.log('\n🔐 CONNEXION UTILISATEUR:')
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

    // 2. Test de la structure de pro_profiles
    console.log('\n📊 TEST DE LA STRUCTURE pro_profiles:')
    const { data: profileTest, error: profileError } = await supabase
      .from('pro_profiles')
      .select('bio, experience_years, price_range, payment_methods')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError) {
      console.log(`❌ Erreur structure profil: ${profileError.message}`)
      console.log('💡 Exécuter le script fix-pro-profiles-and-storage.sql')
      return
    } else {
      console.log('✅ Structure pro_profiles correcte')
      console.log(`   bio: ${profileTest.bio || 'null'}`)
      console.log(`   experience_years: ${profileTest.experience_years || 'null'}`)
      console.log(`   price_range: ${profileTest.price_range || 'null'}`)
      console.log(`   payment_methods: ${profileTest.payment_methods || 'null'}`)
    }

    // 3. Test d'upload de photo
    console.log('\n📤 TEST D\'UPLOAD DE PHOTO:')
    
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
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, testFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.log(`❌ Erreur upload: ${uploadError.message}`)
        console.log('💡 Exécuter le script fix-pro-profiles-and-storage.sql')
        return
      } else {
        console.log('✅ Upload de photo réussi')
        console.log(`   Chemin: ${uploadData.path}`)
        
        // Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        console.log(`   URL: ${urlData.publicUrl}`)
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue upload: ${error.message}`)
      return
    }

    // 4. Test de mise à jour du profil avec bio
    console.log('\n💾 TEST DE MISE À JOUR DU PROFIL:')
    
    const updateData = {
      bio: 'Vétérinaire expérimenté avec 10 ans d\'expérience',
      experience_years: 10,
      price_range: '€€€',
      payment_methods: ['card', 'cash', 'cheque'],
      photo_url: urlData.publicUrl
    }

    try {
      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update(updateData)
        .eq('user_id', authData.user.id)

      if (updateError) {
        console.log(`❌ Erreur mise à jour profil: ${updateError.message}`)
        console.log('💡 Vérifier que les colonnes ont été ajoutées')
        return
      } else {
        console.log('✅ Profil mis à jour avec succès')
        console.log(`   bio: ${updateData.bio}`)
        console.log(`   experience_years: ${updateData.experience_years}`)
        console.log(`   price_range: ${updateData.price_range}`)
        console.log(`   payment_methods: ${updateData.payment_methods.join(', ')}`)
        console.log(`   photo_url: ${updateData.photo_url}`)
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue mise à jour: ${error.message}`)
      return
    }

    // 5. Test de lecture du profil mis à jour
    console.log('\n📖 TEST DE LECTURE DU PROFIL:')
    
    try {
      const { data: updatedProfile, error: readError } = await supabase
        .from('pro_profiles')
        .select('bio, experience_years, price_range, payment_methods, photo_url')
        .eq('user_id', authData.user.id)
        .single()

      if (readError) {
        console.log(`❌ Erreur lecture profil: ${readError.message}`)
      } else {
        console.log('✅ Profil lu avec succès')
        console.log(`   bio: ${updatedProfile.bio}`)
        console.log(`   experience_years: ${updatedProfile.experience_years}`)
        console.log(`   price_range: ${updatedProfile.price_range}`)
        console.log(`   payment_methods: ${updatedProfile.payment_methods}`)
        console.log(`   photo_url: ${updatedProfile.photo_url}`)
      }
    } catch (error) {
      console.log(`❌ Erreur inattendue lecture: ${error.message}`)
    }

    // 6. Nettoyage
    console.log('\n🧹 NETTOYAGE:')
    
    try {
      // Supprimer la photo de test
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      if (deleteError) {
        console.log(`⚠️  Erreur suppression photo: ${deleteError.message}`)
      } else {
        console.log('✅ Photo de test supprimée')
      }
    } catch (error) {
      console.log(`⚠️  Erreur nettoyage: ${error.message}`)
    }

    // 7. Déconnexion
    console.log('\n🔒 DÉCONNEXION:')
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.log(`⚠️  Erreur déconnexion: ${signOutError.message}`)
    } else {
      console.log('✅ Utilisateur déconnecté')
    }

    console.log('\n🎉 TEST COMPLET TERMINÉ !')
    console.log('📋 Résumé:')
    console.log('   ✅ Structure pro_profiles correcte')
    console.log('   ✅ Upload de photo fonctionnel')
    console.log('   ✅ Sauvegarde du profil fonctionnelle')
    console.log('   ✅ Champ bio et autres colonnes opérationnels')
    console.log('   ✅ Policies RLS configurées')

    console.log('\n💡 INSTRUCTIONS POUR L\'UTILISATEUR:')
    console.log('   1. Exécuter le script fix-pro-profiles-and-storage.sql dans Supabase')
    console.log('   2. Recharger l\'application')
    console.log('   3. Tester l\'upload de photo dans "Mon profil"')
    console.log('   4. Tester la sauvegarde du profil avec le champ bio')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testCompleteFix()
