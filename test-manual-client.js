// Script pour créer manuellement un client de test
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

async function createTestClient() {
  console.log('🧪 Création d\'un client de test');
  console.log('================================');

  try {
    // 1. Récupérer un PRO existant
    console.log('\n1️⃣ Recherche d\'un PRO existant...');
    const { data: pros, error: prosError } = await supabase
      .from('pro_profiles')
      .select('id, user_id')
      .limit(1);

    if (prosError || !pros || pros.length === 0) {
      console.error('❌ Aucun PRO trouvé:', prosError);
      return;
    }

    const pro = pros[0];
    console.log(`✅ PRO trouvé: ${pro.id} (user: ${pro.user_id})`);

    // 2. Récupérer un PROPRIO existant
    console.log('\n2️⃣ Recherche d\'un PROPRIO existant...');
    const { data: proprios, error: propriosError } = await supabase
      .from('proprio_profiles')
      .select('id, user_id')
      .limit(1);

    if (propriosError || !proprios || proprios.length === 0) {
      console.error('❌ Aucun PROPRIO trouvé:', propriosError);
      return;
    }

    const proprio = proprios[0];
    console.log(`✅ PROPRIO trouvé: ${proprio.id} (user: ${proprio.user_id})`);

    // 3. Vérifier si la relation existe déjà
    console.log('\n3️⃣ Vérification de la relation existante...');
    const { data: existingRelation, error: relationError } = await supabase
      .from('mes_clients')
      .select('*')
      .eq('pro_id', pro.id)
      .eq('proprio_id', proprio.id);

    if (relationError) {
      console.error('❌ Erreur lors de la vérification:', relationError);
      return;
    }

    if (existingRelation && existingRelation.length > 0) {
      console.log('ℹ️  Relation déjà existante, suppression...');
      const { error: deleteError } = await supabase
        .from('mes_clients')
        .delete()
        .eq('pro_id', pro.id)
        .eq('proprio_id', proprio.id);

      if (deleteError) {
        console.error('❌ Erreur lors de la suppression:', deleteError);
        return;
      }
    }

    // 4. Créer la relation manuellement
    console.log('\n4️⃣ Création de la relation PRO-client...');
    const { data: newRelation, error: createError } = await supabase
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
      return;
    }

    console.log('✅ Relation créée avec succès !');
    console.log('📋 Détails:', newRelation[0]);

    // 5. Vérifier que l'API fonctionne maintenant
    console.log('\n5️⃣ Test de l\'API...');
    console.log('💡 Maintenant, connectez-vous en tant que PRO et allez dans "Mes clients"');
    console.log(`   PRO ID: ${pro.id}`);
    console.log(`   PROPRIO ID: ${proprio.id}`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createTestClient();











