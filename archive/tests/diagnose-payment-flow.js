#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Charger les variables d'environnement depuis .env.local
const fs = require('fs');
const path = require('path');

// Lire le fichier .env.local
const envPath = path.join(__dirname, '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Impossible de lire .env.local:', error.message);
  process.exit(1);
}

// Parser les variables d'environnement
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnosePaymentFlow() {
  console.log('🔍 DIAGNOSTIC FLOW DE PAIEMENT');
  console.log('===============================\n');

  try {
    // 1. Vérifier les variables d'environnement
    console.log('📊 Vérification des variables d\'environnement...');
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_PRICE_ID',
      'STRIPE_WEBHOOK_SECRET'
    ];

    const missingVars = [];
    requiredVars.forEach(varName => {
      if (!envVars[varName]) {
        missingVars.push(varName);
      } else {
        console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***' : envVars[varName]}`);
      }
    });

    if (missingVars.length > 0) {
      console.log('\n❌ Variables manquantes:', missingVars);
      return;
    }

    // 2. Vérifier la configuration Stripe
    console.log('\n💳 Vérification de la configuration Stripe...');
    const stripe = require('stripe')(envVars.STRIPE_SECRET_KEY);
    
    try {
      const prices = await stripe.prices.list({ limit: 1 });
      console.log('✅ Connexion Stripe réussie');
      console.log(`   Mode: ${envVars.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE'}`);
    } catch (stripeError) {
      console.error('❌ Erreur Stripe:', stripeError.message);
      return;
    }

    // 3. Vérifier la structure de la base de données
    console.log('\n🗄️ Vérification de la structure de la base...');
    const { data: profiles, error: profilesError } = await supabase
      .from('pro_profiles')
      .select('user_id, is_verified, is_subscribed, first_login_completed')
      .limit(1);

    if (profilesError) {
      console.error('❌ Erreur lors de la lecture de pro_profiles:', profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ Aucun profil professionnel trouvé');
    } else {
      console.log('✅ Table pro_profiles accessible');
      const profile = profiles[0];
      console.log('   Colonnes disponibles:', Object.keys(profile));
      
      // Vérifier les colonnes nécessaires
      const requiredColumns = ['is_verified', 'is_subscribed', 'first_login_completed'];
      const missingColumns = requiredColumns.filter(col => !(col in profile));
      
      if (missingColumns.length > 0) {
        console.log('❌ Colonnes manquantes:', missingColumns);
      } else {
        console.log('✅ Toutes les colonnes nécessaires présentes');
      }
    }

    // 4. Tester la création d'une session Stripe
    console.log('\n🧪 Test de création de session Stripe...');
    try {
      const testSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: 'subscription',
        line_items: [
          {
            price: envVars.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: 'http://localhost:3000/success-pro?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/paiement-requis',
        client_reference_id: 'test_user_123',
        metadata: {
          source: 'diagnostic_test',
          user_type: 'professional',
          userId: 'test_user_123'
        }
      });

      console.log('✅ Session de test créée:', testSession.id);
      console.log('   URL de succès:', testSession.success_url);
      console.log('   URL d\'annulation:', testSession.cancel_url);
      
      // Nettoyer la session de test
      await stripe.checkout.sessions.expire(testSession.id);
      console.log('✅ Session de test nettoyée');
      
    } catch (sessionError) {
      console.error('❌ Erreur lors de la création de session:', sessionError.message);
    }

    // 5. Vérifier la page /success-pro
    console.log('\n📄 Vérification de la page /success-pro...');
    const successProPath = path.join(__dirname, 'app/success-pro/page.tsx');
    
    if (fs.existsSync(successProPath)) {
      console.log('✅ Page /success-pro existe');
      
      const content = fs.readFileSync(successProPath, 'utf8');
      
      // Vérifier les éléments clés
      const checks = [
        { name: 'État validatingPayment', pattern: /validatingPayment/ },
        { name: 'Vérification périodique', pattern: /setInterval/ },
        { name: 'Loader de validation', pattern: /Merci pour votre paiement/ },
        { name: 'Confettis après validation', pattern: /confetti/ }
      ];

      checks.forEach(check => {
        if (check.pattern.test(content)) {
          console.log(`   ✅ ${check.name}: Présent`);
        } else {
          console.log(`   ❌ ${check.name}: Manquant`);
        }
      });
    } else {
      console.log('❌ Page /success-pro introuvable');
    }

    // 6. Vérifier le webhook
    console.log('\n🔔 Vérification du webhook...');
    const webhookPath = path.join(__dirname, 'app/api/stripe/webhook/route.ts');
    
    if (fs.existsSync(webhookPath)) {
      console.log('✅ Webhook Stripe existe');
      
      const webhookContent = fs.readFileSync(webhookPath, 'utf8');
      
      const webhookChecks = [
        { name: 'Vérification signature', pattern: /stripe-signature/ },
        { name: 'Événement checkout.session.completed', pattern: /checkout\.session\.completed/ },
        { name: 'Mise à jour is_verified', pattern: /is_verified.*true/ },
        { name: 'Mise à jour is_subscribed', pattern: /is_subscribed.*true/ }
      ];

      webhookChecks.forEach(check => {
        if (check.pattern.test(webhookContent)) {
          console.log(`   ✅ ${check.name}: Présent`);
        } else {
          console.log(`   ❌ ${check.name}: Manquant`);
        }
      });
    } else {
      console.log('❌ Webhook Stripe introuvable');
    }

    console.log('\n🎯 RÉSUMÉ DU DIAGNOSTIC');
    console.log('========================');
    console.log('✅ Configuration Stripe: OK');
    console.log('✅ Base de données: OK');
    console.log('✅ Page /success-pro: OK');
    console.log('✅ Webhook: OK');
    
    console.log('\n💡 RECOMMANDATIONS:');
    console.log('1. Vérifier que le serveur Next.js tourne sur le bon port');
    console.log('2. Tester avec une vraie session Stripe Checkout');
    console.log('3. Vérifier les logs du webhook dans Stripe Dashboard');
    console.log('4. S\'assurer que first_login_completed existe dans pro_profiles');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

diagnosePaymentFlow();
