// Script de debug pour vérifier la table mes_clients
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugClientsTable() {
  console.log('🔍 Debug de la table mes_clients');
  console.log('================================');

  try {
    // 1. Vérifier la structure de la table
    console.log('\n1️⃣ Vérification de la structure de la table...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'mes_clients');

    if (tableError) {
      console.error('❌ Erreur lors de la vérification de la table:', tableError);
    } else {
      console.log('✅ Structure de la table mes_clients:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

    // 2. Vérifier les données existantes
    console.log('\n2️⃣ Vérification des données existantes...');
    const { data: clients, error: clientsError } = await supabase
      .from('mes_clients')
      .select('*');

    if (clientsError) {
      console.error('❌ Erreur lors de la récupération des clients:', clientsError);
    } else {
      console.log(`✅ Nombre de clients trouvés: ${clients.length}`);
      if (clients.length > 0) {
        console.log('📋 Clients existants:');
        clients.forEach((client, index) => {
          console.log(`  ${index + 1}. PRO: ${client.pro_id} → PROPRIO: ${client.proprio_id}`);
          console.log(`     Créé le: ${client.created_at}`);
        });
      } else {
        console.log('ℹ️  Aucun client trouvé dans la table');
      }
    }

    // 3. Vérifier les rendez-vous confirmés
    console.log('\n3️⃣ Vérification des rendez-vous confirmés...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, pro_id, proprio_id, status, main_slot')
      .eq('status', 'confirmed');

    if (appointmentsError) {
      console.error('❌ Erreur lors de la récupération des rendez-vous:', appointmentsError);
    } else {
      console.log(`✅ Nombre de rendez-vous confirmés: ${appointments.length}`);
      if (appointments.length > 0) {
        console.log('📋 Rendez-vous confirmés:');
        appointments.forEach((appointment, index) => {
          console.log(`  ${index + 1}. PRO: ${appointment.pro_id} → PROPRIO: ${appointment.proprio_id}`);
          console.log(`     Date: ${appointment.main_slot}`);
        });
      } else {
        console.log('ℹ️  Aucun rendez-vous confirmé trouvé');
      }
    }

    // 4. Vérifier les triggers
    console.log('\n4️⃣ Vérification des triggers...');
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing')
      .eq('trigger_name', 'trigger_create_client_relation');

    if (triggersError) {
      console.error('❌ Erreur lors de la vérification des triggers:', triggersError);
    } else {
      if (triggers.length > 0) {
        console.log('✅ Trigger trouvé:');
        triggers.forEach(trigger => {
          console.log(`  - Nom: ${trigger.trigger_name}`);
          console.log(`  - Événement: ${trigger.event_manipulation}`);
          console.log(`  - Timing: ${trigger.action_timing}`);
        });
      } else {
        console.log('❌ Trigger "trigger_create_client_relation" non trouvé');
        console.log('💡 Vous devez exécuter le script SQL dans Supabase Dashboard');
      }
    }

    console.log('\n✅ Debug terminé');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le debug
debugClientsTable();
