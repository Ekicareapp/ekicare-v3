#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuration avec la clé service
const supabaseUrl = 'https://krxujhjpzmknxpjhqfbx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserSync() {
  console.log('🔧 Synchronisation de l\'utilisateur...\n');

  try {
    // 1. Récupérer l'utilisateur de auth.users
    console.log('1. Récupération de l\'utilisateur de auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur auth:', authError);
      return;
    }

    const user = authUsers.users.find(u => u.email === 'tibereecom@gmail.com');
    if (!user) {
      console.error('❌ Utilisateur non trouvé dans auth.users');
      return;
    }

    console.log('✅ Utilisateur trouvé:', user.email, user.id);

    // 2. Vérifier s'il existe dans public.users
    console.log('2. Vérification dans public.users...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingUser) {
      console.log('✅ Utilisateur déjà dans public.users');
      return;
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erreur de vérification:', checkError);
      return;
    }

    // 3. Ajouter à public.users
    console.log('3. Ajout à public.users...');
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email: user.email,
        role: 'PROPRIETAIRE',
        created_at: user.created_at,
        updated_at: user.updated_at
      }]);

    if (insertError) {
      console.error('❌ Erreur d\'insertion:', insertError);
      return;
    }

    console.log('✅ Utilisateur ajouté à public.users');

    // 4. Ajouter le profil propriétaire
    console.log('4. Ajout du profil propriétaire...');
    const { error: profileError } = await supabase
      .from('proprio_profiles')
      .insert([{
        user_id: user.id,
        prenom: 'Test',
        nom: 'User',
        telephone: '0612345678',
        adresse: '123 Rue Test'
      }]);

    if (profileError) {
      console.error('❌ Erreur profil:', profileError);
    } else {
      console.log('✅ Profil propriétaire ajouté');
    }

    console.log('\n🎉 Synchronisation terminée !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

if (require.main === module) {
  fixUserSync().catch(console.error);
}
