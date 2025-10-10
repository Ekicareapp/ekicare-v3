import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  try {
    console.log('💳 Création d\'une session Stripe Checkout pour inscription pro')
    
    // Récupérer le user_id depuis le body de la requête
    const body = await request.json()
    const { user_id } = body
    
    if (!user_id) {
      console.error('❌ user_id manquant dans la requête')
      return NextResponse.json({ error: 'User ID requis' }, { status: 400 })
    }
    
    // Vérifier que les variables d'environnement sont présentes
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY manquante')
      return NextResponse.json({ error: 'Configuration Stripe manquante' }, { status: 500 })
    }
    
    if (!process.env.STRIPE_PRICE_ID) {
      console.error('❌ STRIPE_PRICE_ID manquant')
      return NextResponse.json({ error: 'Configuration Stripe manquante' }, { status: 500 })
    }
    
    console.log('👤 User ID pour Stripe:', user_id)
    
    // Déterminer l'URL de base dynamiquement - PRIORITÉ AU HEADER HOST
    const requestHost = request.headers.get('host')
    const baseUrl = requestHost ? `http://${requestHost}` : 
                   (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    
    console.log('🌐 Base URL détectée:', baseUrl)
    console.log('🌐 Request Host:', requestHost)
    
    // Créer une session de paiement en mode subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success-pro?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/paiement-requis`,
      client_reference_id: user_id,
      metadata: {
        source: 'signup_pro',
        user_type: 'professional',
        userId: user_id
      }
    })

    console.log('✅ Session Stripe créée:', session.id)
    console.log('🔗 URL de paiement:', session.url)

    return NextResponse.json({ 
      url: session.url
    })
  } catch (err: any) {
    console.error("Stripe session error:", err)
    return NextResponse.json({ error: err.message || 'Erreur lors de la création de la session Stripe' }, { status: 500 })
  }
}
