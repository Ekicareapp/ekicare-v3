#!/usr/bin/env node

/**
 * Script de diagnostic Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Test avec différentes configurations
const configs = [
  {
    name: 'Configuration 1: Variables d\'environnement',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  {
    name: 'Configuration 2: URL hardcodée (à remplacer)',
    url: 'https://your-project.supabase.co', // Remplacez par votre URL
    key: 'your-anon-key' // Remplacez par votre clé
  }
];

async function testSupabaseConfig(config) {
  console.log(`\n🔍 Test: ${config.name}`);
  console.log('URL:', config.url ? '✅ Configurée' : '❌ Manquante');
  console.log('Key:', config.key ? '✅ Configurée' : '❌ Manquante');
  
  if (!config.url || !config.key) {
    console.log('❌ Configuration incomplète, test ignoré');
    return false;
  }

  try {
    const supabase = createClient(config.url, config.key);
    
    // Test 1: Connexion de base
    console.log('1. Test de connexion...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erreur de connexion:', testError.message);
      return false;
    }
    
    console.log('✅ Connexion réussie');
    console.log('   Utilisateurs trouvés:', testData.length);
    
    // Test 2: Recherche d'utilisateur spécifique
    console.log('2. Recherche de tibereecom@gmail.com...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tibereecom@gmail.com');
    
    if (userError) {
      console.log('❌ Erreur de recherche:', userError.message);
    } else {
      console.log('✅ Recherche réussie');
      console.log('   Utilisateur trouvé:', userData.length > 0);
      if (userData.length > 0) {
        console.log('   Détails:', userData[0]);
      }
    }
    
    // Test 3: Test d'authentification
    console.log('3. Test d\'authentification...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'tibereecom@gmail.com',
      password: 'test123'
    });
    
    if (authError) {
      console.log('❌ Erreur d\'authentification:', authError.message);
    } else {
      console.log('✅ Authentification réussie');
      console.log('   User ID:', authData.user?.id);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
    return false;
  }
}

async function runDiagnostic() {
  console.log('🔍 DIAGNOSTIC SUPABASE');
  console.log('='.repeat(50));
  
  let success = false;
  
  for (const config of configs) {
    const result = await testSupabaseConfig(config);
    if (result) {
      success = true;
      break;
    }
  }
  
  if (!success) {
    console.log('\n❌ Aucune configuration Supabase ne fonctionne');
    console.log('\n📋 SOLUTIONS:');
    console.log('1. Vérifiez que votre serveur Next.js a accès aux variables d\'environnement');
    console.log('2. Créez un fichier .env.local avec vos clés Supabase');
    console.log('3. Redémarrez le serveur avec: npm run dev');
    console.log('4. Vérifiez que votre projet Supabase est actif');
  } else {
    console.log('\n✅ Configuration Supabase fonctionnelle');
  }
}

// Exécution
if (require.main === module) {
  runDiagnostic().catch(console.error);
}

module.exports = { runDiagnostic };
