import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  try {
    console.log('💳 Création d\'une session de paiement Stripe')
    
    // Authentification
    if (!supabase) {
      console.error('❌ Database connection error')
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('❌ Unauthorized user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 Utilisateur authentifié:', user.id, user.email)

    // Créer une session de paiement en mode subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success-pro?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/paiement-requis`,
      client_reference_id: user.id, // Ajouter l'user_id comme référence client
      metadata: {
        user_id: user.id,
        source: 'signup_pro'
      }
    });

    console.log('✅ Session Stripe créée:', session.id)
    console.log('🔗 URL de paiement:', session.url)

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('❌ Erreur lors de la création de la session Stripe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}
