import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  try {
    console.log('💳 Création d\'une session de paiement Stripe')
    
    // Contexte sans cookies: accepter un userId optionnel dans le corps de la requête
    // pour lier la session à un utilisateur; sinon continuer sans metadata bloquante
    let userId: string | undefined
    try {
      const body = await request.json().catch(() => null)
      if (body && typeof body.userId === 'string') {
        userId = body.userId
      } else if (body && typeof body.user_id === 'string') {
        userId = body.user_id
      }
    } catch {}

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
      payment_method_collection: 'always',
      subscription_data: {
        trial_period_days: 7,
      },
      ...(userId ? { client_reference_id: userId } : {}),
      metadata: {
        ...(userId ? { user_id: userId } : {}),
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
