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

async function testFirstLoginColumn() {
  console.log('🧪 TEST COLONNE FIRST_LOGIN_COMPLETED');
  console.log('=====================================\n');

  try {
    // 1. Tester directement la lecture de pro_profiles
    console.log('📊 Test de lecture de pro_profiles...');
    const { data: profiles, error: readError } = await supabase
      .from('pro_profiles')
      .select('*')
      .limit(1);

    if (readError) {
      console.error('❌ Erreur lors de la lecture:', readError);
      return;
    }

    if (profiles && profiles.length > 0) {
      console.log('✅ Données lues avec succès:');
      const profile = profiles[0];
      console.log('Colonnes disponibles:', Object.keys(profile));
      
      // Vérifier si first_login_completed existe
      if ('first_login_completed' in profile) {
        console.log('\n✅ Colonne first_login_completed trouvée !');
        console.log(`Valeur actuelle: ${profile.first_login_completed}`);
        
        // Tester la mise à jour
        console.log('\n🔄 Test de mise à jour...');
        const { error: updateError } = await supabase
          .from('pro_profiles')
          .update({ first_login_completed: true })
          .eq('user_id', profile.user_id);

        if (updateError) {
          console.error('❌ Erreur lors de la mise à jour:', updateError);
        } else {
          console.log('✅ Mise à jour réussie !');
          
          // Remettre à false pour ne pas affecter les données
          await supabase
            .from('pro_profiles')
            .update({ first_login_completed: false })
            .eq('user_id', profile.user_id);
          console.log('✅ Valeur remise à false');
        }
      } else {
        console.log('\n❌ Colonne first_login_completed non trouvée !');
        console.log('💡 Exécutez le script add-first-login-column.sql dans Supabase');
      }
    } else {
      console.log('⚠️ Aucun profil professionnel trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testFirstLoginColumn();
