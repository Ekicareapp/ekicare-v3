// Script pour tester la création d'un client avec la structure corrigée
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

async function testFixedClient() {
  console.log('🧪 Test de création d\'un client avec structure corrigée');
  console.log('======================================================');

  try {
    // 1. Récupérer un PRO existant
    console.log('\n1️⃣ Recherche d\'un PRO existant...');
    const { data: pros, error: prosError } = await supabase
      .from('pro_profiles')
      .select('id, user_id, prenom, nom')
      .limit(1);

    if (prosError || !pros || pros.length === 0) {
      console.error('❌ Aucun PRO trouvé:', prosError);
      return;
    }

    const pro = pros[0];
    console.log(`✅ PRO trouvé: ${pro.prenom} ${pro.nom} (ID: ${pro.id})`);

    // 2. Récupérer un PROPRIO existant
    console.log('\n2️⃣ Recherche d\'un PROPRIO existant...');
    const { data: proprios, error: propriosError } = await supabase
      .from('proprio_profiles')
      .select('id, user_id, prenom, nom')
      .limit(1);

    if (propriosError || !proprios || proprios.length === 0) {
      console.error('❌ Aucun PROPRIO trouvé:', propriosError);
      return;
    }

    const proprio = proprios[0];
    console.log(`✅ PROPRIO trouvé: ${proprio.prenom} ${proprio.nom} (ID: ${proprio.id})`);

    // 3. Nettoyer les relations existantes
    console.log('\n3️⃣ Nettoyage des relations existantes...');
    const { error: deleteError } = await supabase
      .from('mes_clients')
      .delete()
      .eq('pro_id', pro.id)
      .eq('proprio_id', proprio.id);

    if (deleteError) {
      console.log('ℹ️  Aucune relation existante à supprimer');
    } else {
      console.log('✅ Relations existantes supprimées');
    }

    // 4. Créer la relation avec la structure corrigée
    console.log('\n4️⃣ Création de la relation PRO-client...');
    const { data: newRelation, error: createError } = await supabase
      .from('mes_clients')
      .insert({
        pro_id: pro.id,  // ID du profil PRO
        proprio_id: proprio.id,  // ID du profil PROPRIO
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (createError) {
      console.error('❌ Erreur lors de la création:', createError);
      console.log('\n💡 Instructions:');
      console.log('1. Exécutez d\'abord le script SQL: fix-mes-clients-table.sql');
      console.log('2. Puis relancez ce test');
      return;
    }

    console.log('✅ Relation créée avec succès !');
    console.log('📋 Détails:', newRelation[0]);

    // 5. Vérifier que l'API peut récupérer les données
    console.log('\n5️⃣ Test de l\'API...');
    console.log('💡 Maintenant, connectez-vous en tant que PRO et allez dans "Mes clients"');
    console.log(`   PRO: ${pro.prenom} ${pro.nom} (ID: ${pro.id})`);
    console.log(`   PROPRIO: ${proprio.prenom} ${proprio.nom} (ID: ${proprio.id})`);

    // 6. Vérifier les données créées
    console.log('\n6️⃣ Vérification des données...');
    const { data: allClients, error: allClientsError } = await supabase
      .from('mes_clients')
      .select(`
        pro_id,
        proprio_id,
        created_at,
        pro_profiles!inner(prenom, nom),
        proprio_profiles!inner(prenom, nom)
      `);

    if (allClientsError) {
      console.error('❌ Erreur lors de la vérification:', allClientsError);
    } else {
      console.log(`✅ Nombre total de clients: ${allClients.length}`);
      allClients.forEach((client, index) => {
        console.log(`  ${index + 1}. ${client.pro_profiles.prenom} ${client.pro_profiles.nom} → ${client.proprio_profiles.prenom} ${client.proprio_profiles.nom}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testFixedClient();




