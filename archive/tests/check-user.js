#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://krxujhjpzmknxpjhqfbx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
  console.log('🔍 Vérification de l\'utilisateur...\n');

  try {
    // Vérifier dans public.users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tibereecom@gmail.com');

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    console.log('Utilisateurs trouvés:', users.length);
    users.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Rôle: ${user.role}`);
      console.log(`- Créé: ${user.created_at}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

if (require.main === module) {
  checkUser().catch(console.error);
}
