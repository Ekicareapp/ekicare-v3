// Script pour corriger la table et créer un client de test
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

async function fixAndTestClients() {
  console.log('🔧 Correction et test de la table mes_clients');
  console.log('============================================');

  try {
    // 1. Nettoyer la table mes_clients
    console.log('\n1️⃣ Nettoyage de la table mes_clients...');
    const { error: deleteError } = await supabase
      .from('mes_clients')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tous les enregistrements

    if (deleteError) {
      console.log('ℹ️  Table déjà vide ou erreur (normal):', deleteError.message);
    } else {
      console.log('✅ Table nettoyée');
    }

    // 2. Récupérer un PRO et un PROPRIO
    console.log('\n2️⃣ Récupération des données...');
    const { data: pros, error: prosError } = await supabase
      .from('pro_profiles')
      .select('id, user_id, prenom, nom')
      .limit(1);

    if (prosError || !pros || pros.length === 0) {
      console.error('❌ Aucun PRO trouvé:', prosError);
      return;
    }

    const pro = pros[0];
    console.log(`✅ PRO: ${pro.prenom} ${pro.nom} (ID: ${pro.id})`);

    const { data: proprios, error: propriosError } = await supabase
      .from('proprio_profiles')
      .select('id, user_id, prenom, nom')
      .limit(1);

    if (propriosError || !proprios || proprios.length === 0) {
      console.error('❌ Aucun PROPRIO trouvé:', propriosError);
      return;
    }

    const proprio = proprios[0];
    console.log(`✅ PROPRIO: ${proprio.prenom} ${proprio.nom} (ID: ${proprio.id})`);

    // 3. Créer une relation simple (sans contraintes complexes)
    console.log('\n3️⃣ Création d\'une relation de test...');
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
      console.error('❌ Erreur lors de la création:', createError);
      console.log('\n💡 Le problème vient des contraintes de clé étrangère');
      console.log('   Il faut corriger la structure de la table dans Supabase Dashboard');
      return;
    }

    console.log('✅ Client créé avec succès !');
    console.log(`   ${pro.prenom} ${pro.nom} → ${proprio.prenom} ${proprio.nom}`);

    // 4. Tester l'API avec les données créées
    console.log('\n4️⃣ Test de l\'API...');
    console.log('💡 Maintenant, testez dans le navigateur :');
    console.log('1. Connectez-vous en tant que PRO (pro@test.com / 142536)');
    console.log('2. Allez dans "Mes clients"');
    console.log('3. Le client devrait apparaître');

    // 5. Vérifier les données créées
    console.log('\n5️⃣ Vérification des données...');
    const { data: allClients, error: allClientsError } = await supabase
      .from('mes_clients')
      .select('*');

    if (allClientsError) {
      console.error('❌ Erreur lors de la vérification:', allClientsError);
    } else {
      console.log(`✅ Nombre total de clients: ${allClients.length}`);
      allClients.forEach((client, index) => {
        console.log(`  ${index + 1}. PRO: ${client.pro_id} → PROPRIO: ${client.proprio_id}`);
      });
    }

    console.log('\n✅ Test terminé');
    console.log('\n📋 Si l\'erreur "Unauthorized" persiste dans le navigateur:');
    console.log('1. Vérifiez que vous êtes bien connecté en tant que PRO');
    console.log('2. Vérifiez la console du navigateur (F12) pour plus de détails');
    console.log('3. Essayez de vous déconnecter et vous reconnecter');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

fixAndTestClients();








