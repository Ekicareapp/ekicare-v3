// Script pour vérifier les IDs des propriétaires
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

async function debugProprioIds() {
  console.log('🔍 Debug des IDs des propriétaires');
  console.log('==================================');

  try {
    // 1. Vérifier tous les propriétaires
    console.log('\n1️⃣ Tous les propriétaires dans proprio_profiles...');
    const { data: allProprios, error: allPropriosError } = await supabase
      .from('proprio_profiles')
      .select('id, user_id, prenom, nom')
      .order('created_at', { ascending: false });

    if (allPropriosError) {
      console.error('❌ Erreur lors de la récupération des propriétaires:', allPropriosError);
      return;
    }

    console.log(`✅ Nombre de propriétaires trouvés: ${allProprios.length}`);
    allProprios.forEach((proprio, index) => {
      console.log(`  ${index + 1}. ${proprio.prenom} ${proprio.nom}`);
      console.log(`     ID profil: ${proprio.id}`);
      console.log(`     ID user: ${proprio.user_id}`);
      console.log('     ---');
    });

    // 2. Vérifier les RDV
    console.log('\n2️⃣ Tous les RDV...');
    const { data: allAppointments, error: allAppointmentsError } = await supabase
      .from('appointments')
      .select('id, pro_id, proprio_id, status, main_slot')
      .order('created_at', { ascending: false });

    if (allAppointmentsError) {
      console.error('❌ Erreur lors de la récupération des RDV:', allAppointmentsError);
      return;
    }

    console.log(`✅ Nombre de RDV trouvés: ${allAppointments.length}`);
    allAppointments.forEach((apt, index) => {
      console.log(`  ${index + 1}. RDV ID: ${apt.id}`);
      console.log(`     PRO ID: ${apt.pro_id}`);
      console.log(`     PROPRIO ID: ${apt.proprio_id}`);
      console.log(`     Status: ${apt.status}`);
      console.log('     ---');
    });

    // 3. Vérifier la correspondance
    console.log('\n3️⃣ Vérification de la correspondance...');
    const confirmedAppointments = allAppointments.filter(apt => apt.status === 'confirmed');
    const uniqueProprioIds = [...new Set(confirmedAppointments.map(apt => apt.proprio_id))];
    
    console.log(`✅ IDs uniques des propriétaires dans les RDV: ${uniqueProprioIds.length}`);
    uniqueProprioIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });

    console.log(`\n✅ IDs des propriétaires dans proprio_profiles: ${allProprios.length}`);
    allProprios.forEach((proprio, index) => {
      console.log(`  ${index + 1}. ${proprio.id}`);
    });

    // 4. Vérifier si les IDs correspondent
    console.log('\n4️⃣ Vérification de la correspondance...');
    const matchingProprios = allProprios.filter(proprio => 
      uniqueProprioIds.includes(proprio.id) || uniqueProprioIds.includes(proprio.user_id)
    );

    console.log(`✅ Propriétaires correspondants: ${matchingProprios.length}`);
    if (matchingProprios.length > 0) {
      matchingProprios.forEach((proprio, index) => {
        console.log(`  ${index + 1}. ${proprio.prenom} ${proprio.nom}`);
        console.log(`     ID profil: ${proprio.id}`);
        console.log(`     ID user: ${proprio.user_id}`);
      });
    } else {
      console.log('❌ Aucune correspondance trouvée !');
      console.log('💡 Le problème est que les IDs ne correspondent pas');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugProprioIds();











