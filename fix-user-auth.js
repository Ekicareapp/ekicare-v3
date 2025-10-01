#!/usr/bin/env node

/**
 * Script pour corriger les utilisateurs qui existent dans la table users
 * mais pas dans auth.users de Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Clé de service pour créer des utilisateurs

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

// Client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserAuth() {
  console.log('🔧 Correction des utilisateurs dans Supabase Auth...\n');

  try {
    // 1. Récupérer tous les utilisateurs de la table users
    console.log('1. Récupération des utilisateurs de la table users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
      return;
    }

    console.log(`✅ ${users.length} utilisateurs trouvés dans la table users`);

    // 2. Pour chaque utilisateur, vérifier s'il existe dans auth.users
    for (const user of users) {
      console.log(`\n👤 Vérification de l'utilisateur: ${user.email}`);
      
      try {
        // Vérifier si l'utilisateur existe dans auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
        
        if (authError && authError.message.includes('User not found')) {
          console.log(`⚠️  Utilisateur ${user.email} non trouvé dans auth.users`);
          console.log(`🔧 Création de l'utilisateur dans auth.users...`);
          
          // Créer l'utilisateur dans auth.users
          const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: 'TempPassword123!', // Mot de passe temporaire
            email_confirm: true, // Confirmer l'email automatiquement
            user_metadata: {
              role: user.role
            }
          });

          if (createError) {
            console.error(`❌ Erreur lors de la création de l'utilisateur ${user.email}:`, createError);
          } else {
            console.log(`✅ Utilisateur ${user.email} créé dans auth.users`);
            console.log(`   ID: ${newAuthUser.user.id}`);
            console.log(`   Mot de passe temporaire: TempPassword123!`);
            console.log(`   ⚠️  L'utilisateur devra changer son mot de passe à la première connexion`);
          }
        } else if (authError) {
          console.error(`❌ Erreur lors de la vérification de l'utilisateur ${user.email}:`, authError);
        } else {
          console.log(`✅ Utilisateur ${user.email} existe déjà dans auth.users`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors du traitement de l'utilisateur ${user.email}:`, error);
      }
    }

    console.log('\n🎉 Correction terminée !');
    console.log('\n📋 Instructions pour les utilisateurs:');
    console.log('1. Les utilisateurs peuvent maintenant se connecter avec leur email');
    console.log('2. Mot de passe temporaire: TempPassword123!');
    console.log('3. Ils devront changer leur mot de passe à la première connexion');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
if (require.main === module) {
  fixUserAuth().catch(console.error);
}

module.exports = { fixUserAuth };
