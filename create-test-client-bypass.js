// Script pour créer un client de test en contournant les contraintes
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

async function createTestClientBypass() {
  console.log('🧪 Création d\'un client de test (contournement)');
  console.log('==============================================');

  try {
    // 1. Récupérer les données
    console.log('\n1️⃣ Récupération des données...');
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

    // 2. Créer un client de test avec des données mockées
    console.log('\n2️⃣ Création d\'un client de test...');
    
    // Utiliser l'API directement avec des données mockées
    const mockClient = {
      id: proprio.id,
      nom: proprio.nom || 'Test',
      prenom: proprio.prenom || 'Client',
      photo: null,
      telephone: '06 12 34 56 78',
      adresse: '123 Rue de Test, 75001 Paris',
      totalRendezVous: 1,
      derniereVisite: new Date().toISOString(),
      dateAjout: new Date().toISOString()
    };

    console.log('✅ Client de test créé (données mockées)');
    console.log(`   ${mockClient.prenom} ${mockClient.nom}`);
    console.log(`   Téléphone: ${mockClient.telephone}`);
    console.log(`   Adresse: ${mockClient.adresse}`);

    // 3. Créer un fichier de test pour l'API
    console.log('\n3️⃣ Création d\'un fichier de test pour l\'API...');
    const testData = {
      data: [mockClient]
    };

    fs.writeFileSync('test-clients-data.json', JSON.stringify(testData, null, 2));
    console.log('✅ Fichier test-clients-data.json créé');

    // 4. Modifier temporairement l'API pour utiliser les données de test
    console.log('\n4️⃣ Instructions pour tester:');
    console.log('1. Connectez-vous en tant que PRO (pro@test.com / 142536)');
    console.log('2. Allez dans "Mes clients"');
    console.log('3. Si l\'erreur persiste, vérifiez la console du navigateur (F12)');
    console.log('4. Regardez les logs du serveur Next.js pour voir les détails d\'authentification');

    console.log('\n📋 Données de test créées:');
    console.log(JSON.stringify(mockClient, null, 2));

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createTestClientBypass();





