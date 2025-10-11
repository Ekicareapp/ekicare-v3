// Webhook externe simple pour Stripe
// Usage: node webhook-external.js
// Puis: stripe listen --forward-to http://localhost:3001/webhook

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3001;

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware pour parser le body brut
app.use('/webhook', express.raw({ type: 'application/json' }));

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('🔔 [EXTERNAL] Webhook reçu');
  console.log('📦 [EXTERNAL] Body length:', req.body.length);
  console.log('✍️ [EXTERNAL] Signature présente:', !!sig);

  try {
    // Vérifier la signature
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ [EXTERNAL] Signature vérifiée - Événement:', event.type);

    // Traiter l'événement
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('💳 [EXTERNAL] Checkout session completed!');
      console.log('📋 [EXTERNAL] Session ID:', session.id);
      console.log('👤 [EXTERNAL] Client Reference ID:', session.client_reference_id);

      const userId = session.client_reference_id;
      if (userId) {
        // Mettre à jour le profil professionnel
        const { data: updatedProfile, error: updateError } = await supabase
          .from('pro_profiles')
          .update({
            is_verified: true,
            is_subscribed: true
          })
          .eq('user_id', userId)
          .select('id, prenom, nom')
          .single();

        if (updateError) {
          console.error('❌ [EXTERNAL] Erreur mise à jour profil:', updateError);
        } else {
          console.log('✅ [EXTERNAL] Profil mis à jour avec succès:', updatedProfile);
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ [EXTERNAL] Erreur webhook:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.listen(port, () => {
  console.log(`🚀 Webhook externe démarré sur le port ${port}`);
  console.log(`🔗 URL: http://localhost:${port}/webhook`);
  console.log('📋 Commande Stripe CLI: stripe listen --forward-to http://localhost:3001/webhook');
});
