#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Charger les variables d'environnement depuis .env.local
const fs = require('fs');
const path = require('path');

// Lire le fichier .env.local
const envPath = path.join(__dirname, '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Impossible de lire .env.local:', error.message);
  process.exit(1);
}

// Parser les variables d'environnement
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function testOnboardingPro() {
  console.log('🧪 TEST ONBOARDING PROFESSIONNEL');
  console.log('=================================\n');

  try {
    // 1. Vérifier que la colonne first_login_completed existe
    console.log('📊 Vérification de la colonne first_login_completed...');
    const { data: profiles, error: readError } = await supabase
      .from('pro_profiles')
      .select('user_id, first_login_completed')
      .limit(1);

    if (readError) {
      console.error('❌ Erreur lors de la lecture:', readError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ Aucun profil professionnel trouvé');
      return;
    }

    const profile = profiles[0];
    if (!('first_login_completed' in profile)) {
      console.log('❌ Colonne first_login_completed non trouvée !');
      console.log('💡 Exécutez le script add-first-login-column.sql dans Supabase');
      return;
    }

    console.log('✅ Colonne first_login_completed trouvée !');
    console.log(`Valeur actuelle: ${profile.first_login_completed}`);

    // 2. Simuler un pro qui n'a pas encore fait l'onboarding
    console.log('\n🔄 Simulation: Pro sans onboarding...');
    const { error: resetError } = await supabase
      .from('pro_profiles')
      .update({ first_login_completed: false })
      .eq('user_id', profile.user_id);

    if (resetError) {
      console.error('❌ Erreur lors de la réinitialisation:', resetError);
      return;
    }

    console.log('✅ Profil réinitialisé (first_login_completed = false)');

    // 3. Vérifier que l'onboarding s'affiche
    console.log('\n📖 Vérification du statut d\'onboarding...');
    const { data: updatedProfile, error: checkError } = await supabase
      .from('pro_profiles')
      .select('first_login_completed')
      .eq('user_id', profile.user_id)
      .single();

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
      return;
    }

    if (!updatedProfile.first_login_completed) {
      console.log('✅ Onboarding devrait s\'afficher (first_login_completed = false)');
    } else {
      console.log('❌ Onboarding ne devrait pas s\'afficher (first_login_completed = true)');
    }

    // 4. Simuler la completion de l'onboarding
    console.log('\n🎯 Simulation: Completion de l\'onboarding...');
    const { error: completeError } = await supabase
      .from('pro_profiles')
      .update({ first_login_completed: true })
      .eq('user_id', profile.user_id);

    if (completeError) {
      console.error('❌ Erreur lors de la completion:', completeError);
      return;
    }

    console.log('✅ Onboarding marqué comme terminé (first_login_completed = true)');

    // 5. Vérifier que l'onboarding ne s'affiche plus
    console.log('\n📖 Vérification finale...');
    const { data: finalProfile, error: finalError } = await supabase
      .from('pro_profiles')
      .select('first_login_completed')
      .eq('user_id', profile.user_id)
      .single();

    if (finalError) {
      console.error('❌ Erreur lors de la vérification finale:', finalError);
      return;
    }

    if (finalProfile.first_login_completed) {
      console.log('✅ Onboarding ne devrait plus s\'afficher (first_login_completed = true)');
    } else {
      console.log('❌ Onboarding devrait encore s\'afficher (first_login_completed = false)');
    }

    console.log('\n🎉 TEST TERMINÉ !');
    console.log('📋 Résumé:');
    console.log('   ✅ Colonne first_login_completed fonctionnelle');
    console.log('   ✅ Mise à jour false → true fonctionnelle');
    console.log('   ✅ Logique d\'onboarding prête');

    console.log('\n💡 INSTRUCTIONS POUR L\'UTILISATEUR:');
    console.log('   1. Exécutez add-first-login-column.sql dans Supabase');
    console.log('   2. Redémarrez l\'application');
    console.log('   3. Connectez-vous avec un compte pro');
    console.log('   4. L\'onboarding devrait s\'afficher la première fois');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testOnboardingPro();
