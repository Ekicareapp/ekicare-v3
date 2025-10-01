#!/usr/bin/env node

/**
 * Script pour ajouter un utilisateur spécifique à la table public.users
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://krxujhjpzmknxpjhqfbx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeHVqaGpwem1rbnhwamhxZmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjI3MDMsImV4cCI6MjA3NDA5ODcwM30.AAVWADt-uVa0pZbovDqPOoUcB0vNSSkGGykL09kfkC4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addUserToDatabase() {
  console.log('👤 Ajout de l\'utilisateur à la table public.users...\n');

  // Informations de l'utilisateur (remplacez par les vraies informations)
  const userInfo = {
    id: 'a24e8bbf-7b47-4d47-a747-3eea7aea736a', // ID de l'utilisateur dans auth.users
    email: 'tibereecom@gmail.com',
    role: 'PROPRIETAIRE'
  };

  try {
    // 1. Vérifier si l'utilisateur existe déjà
    console.log('1. Vérification de l\'existence de l\'utilisateur...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userInfo.id)
      .single();

    if (existingUser) {
      console.log('✅ L\'utilisateur existe déjà dans public.users');
      return;
    }

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        console.log('✅ L\'utilisateur n\'existe pas encore, on peut l\'ajouter');
      } else {
        console.error('❌ Erreur lors de la vérification:', checkError);
        return;
      }
    }

    // 2. Ajouter l'utilisateur à la table users
    console.log('2. Ajout de l\'utilisateur à public.users...');
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('❌ Erreur lors de l\'ajout:', insertError);
      return;
    }

    console.log('✅ Utilisateur ajouté avec succès à public.users');

    // 3. Ajouter le profil propriétaire
    console.log('3. Ajout du profil propriétaire...');
    const { error: profileError } = await supabase
      .from('proprio_profiles')
      .insert([{
        user_id: userInfo.id,
        prenom: 'Test',
        nom: 'User',
        telephone: '0612345678',
        adresse: '123 Rue Test'
      }]);

    if (profileError) {
      console.error('❌ Erreur lors de l\'ajout du profil:', profileError);
    } else {
      console.log('✅ Profil propriétaire ajouté avec succès');
    }

    // 4. Vérification finale
    console.log('\n4. Vérification finale...');
    const { data: finalUser, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userInfo.id)
      .single();

    if (finalError) {
      console.error('❌ Erreur lors de la vérification finale:', finalError);
    } else {
      console.log('✅ Utilisateur vérifié:');
      console.log(`   - ID: ${finalUser.id}`);
      console.log(`   - Email: ${finalUser.email}`);
      console.log(`   - Rôle: ${finalUser.role}`);
    }

    console.log('\n🎉 Utilisateur prêt pour la connexion !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
if (require.main === module) {
  addUserToDatabase().catch(console.error);
}

module.exports = { addUserToDatabase };
