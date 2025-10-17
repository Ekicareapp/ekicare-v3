// Script de debug pour vérifier l'authentification des clients
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAuthClients() {
  console.log('🔍 Debug de l\'authentification pour les clients');
  console.log('===============================================');

  try {
    // 1. Vérifier les utilisateurs PRO
    console.log('\n1️⃣ Vérification des utilisateurs PRO...');
    const { data: pros, error: prosError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'PRO');

    if (prosError) {
      console.error('❌ Erreur lors de la récupération des PROs:', prosError);
      return;
    }

    console.log(`✅ Nombre de PROs trouvés: ${pros.length}`);
    pros.forEach((pro, index) => {
      console.log(`  ${index + 1}. ${pro.email} (ID: ${pro.id})`);
    });

    if (pros.length === 0) {
      console.log('❌ Aucun PRO trouvé ! Créez un compte PRO d\'abord');
      return;
    }

    // 2. Vérifier les profils PRO
    console.log('\n2️⃣ Vérification des profils PRO...');
    const { data: proProfiles, error: proProfilesError } = await supabase
      .from('pro_profiles')
      .select('id, user_id, prenom, nom')
      .limit(5);

    if (proProfilesError) {
      console.error('❌ Erreur lors de la récupération des profils PRO:', proProfilesError);
      return;
    }

    console.log(`✅ Nombre de profils PRO trouvés: ${proProfiles.length}`);
    proProfiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.prenom} ${profile.nom} (ID: ${profile.id}, User: ${profile.user_id})`);
    });

    // 3. Vérifier les clients existants
    console.log('\n3️⃣ Vérification des clients existants...');
    const { data: clients, error: clientsError } = await supabase
      .from('mes_clients')
      .select(`
        pro_id,
        proprio_id,
        created_at,
        pro_profiles!inner(prenom, nom),
        proprio_profiles!inner(prenom, nom)
      `);

    if (clientsError) {
      console.error('❌ Erreur lors de la récupération des clients:', clientsError);
    } else {
      console.log(`✅ Nombre de clients trouvés: ${clients.length}`);
      if (clients.length > 0) {
        clients.forEach((client, index) => {
          console.log(`  ${index + 1}. ${client.pro_profiles.prenom} ${client.pro_profiles.nom} → ${client.proprio_profiles.prenom} ${client.proprio_profiles.nom}`);
        });
      } else {
        console.log('ℹ️  Aucun client trouvé - c\'est normal si aucun RDV n\'a été confirmé');
      }
    }

    // 4. Créer un client de test si nécessaire
    if (clients.length === 0) {
      console.log('\n4️⃣ Création d\'un client de test...');
      
      // Récupérer un PRO et un PROPRIO
      const pro = proProfiles[0];
      const { data: proprios, error: propriosError } = await supabase
        .from('proprio_profiles')
        .select('id, prenom, nom')
        .limit(1);

      if (propriosError || !proprios || proprios.length === 0) {
        console.log('❌ Aucun PROPRIO trouvé pour créer un client de test');
        return;
      }

      const proprio = proprios[0];
      
      // Créer la relation
      const { data: newClient, error: createError } = await supabase
        .from('mes_clients')
        .insert({
          pro_id: pro.id,
          proprio_id: proprio.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (createError) {
        console.error('❌ Erreur lors de la création du client de test:', createError);
      } else {
        console.log('✅ Client de test créé avec succès !');
        console.log(`   ${pro.prenom} ${pro.nom} → ${proprio.prenom} ${proprio.nom}`);
      }
    }

    console.log('\n✅ Debug terminé');
    console.log('\n💡 Instructions pour tester:');
    console.log('1. Connectez-vous en tant que PRO dans le navigateur');
    console.log('2. Allez dans "Mes clients"');
    console.log('3. Si l\'erreur persiste, vérifiez la console du navigateur (F12)');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugAuthClients();












