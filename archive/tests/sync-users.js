#!/usr/bin/env node

/**
 * Script pour synchroniser les utilisateurs de auth.users vers public.users
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://krxujhjpzmknxpjhqfbx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeHVqaGpwem1rbnhwamhxZmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjI3MDMsImV4cCI6MjA3NDA5ODcwM30.AAVWADt-uVa0pZbovDqPOoUcB0vNSSkGGykL09kfkC4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncUsers() {
  console.log('🔄 Synchronisation des utilisateurs...\n');

  try {
    // 1. Récupérer tous les utilisateurs de auth.users
    console.log('1. Récupération des utilisateurs de auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs auth:', authError);
      return;
    }

    console.log(`✅ ${authUsers.users.length} utilisateurs trouvés dans auth.users`);

    // 2. Récupérer tous les utilisateurs de public.users
    console.log('\n2. Récupération des utilisateurs de public.users...');
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email');

    if (publicError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs public:', publicError);
      return;
    }

    console.log(`✅ ${publicUsers.length} utilisateurs trouvés dans public.users`);

    // 3. Identifier les utilisateurs manquants
    const publicUserIds = new Set(publicUsers.map(u => u.id));
    const missingUsers = authUsers.users.filter(authUser => !publicUserIds.has(authUser.id));

    console.log(`\n3. ${missingUsers.length} utilisateurs manquants dans public.users`);

    if (missingUsers.length === 0) {
      console.log('✅ Tous les utilisateurs sont synchronisés');
      return;
    }

    // 4. Créer les utilisateurs manquants dans public.users
    console.log('\n4. Création des utilisateurs manquants...');
    
    for (const authUser of missingUsers) {
      console.log(`   - ${authUser.email} (${authUser.id})`);
      
      // Déterminer le rôle par défaut (vous pouvez ajuster cette logique)
      const role = 'PROPRIETAIRE'; // Rôle par défaut
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: authUser.id,
          email: authUser.email,
          role: role,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at
        }]);

      if (insertError) {
        console.error(`   ❌ Erreur pour ${authUser.email}:`, insertError.message);
      } else {
        console.log(`   ✅ ${authUser.email} ajouté à public.users`);
      }
    }

    console.log('\n🎉 Synchronisation terminée !');
    
    // 5. Vérification finale
    console.log('\n5. Vérification finale...');
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('*');

    if (finalError) {
      console.error('❌ Erreur lors de la vérification finale:', finalError);
    } else {
      console.log(`✅ ${finalUsers.length} utilisateurs maintenant dans public.users`);
      finalUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
if (require.main === module) {
  syncUsers().catch(console.error);
}

module.exports = { syncUsers };
