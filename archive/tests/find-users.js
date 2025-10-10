const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUsers() {
  console.log('🔍 Recherche des utilisateurs existants...');
  
  try {
    // Trouver tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role');
    
    if (usersError) {
      console.error('❌ Erreur:', usersError);
      return;
    }
    
    console.log('📋 Utilisateurs trouvés:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ID: ${user.id}`);
    });
    
    // Trouver des propriétaires avec des équidés
    const { data: proprios, error: propriosError } = await supabase
      .from('users')
      .select(`
        id, email,
        proprio_profiles!inner(prenom, nom),
        equides!inner(id, nom)
      `)
      .eq('role', 'PROPRIETAIRE');
    
    if (propriosError) {
      console.error('❌ Erreur proprio:', propriosError);
    } else {
      console.log('\n🐎 Propriétaires avec équidés:');
      proprios.forEach(proprio => {
        console.log(`  - ${proprio.email} (${proprio.proprio_profiles.prenom} ${proprio.proprio_profiles.nom})`);
        console.log(`    Équidés: ${proprio.equides.map(e => e.nom).join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

findUsers();
