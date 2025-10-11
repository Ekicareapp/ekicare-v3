import { headers } from 'next/headers'
import Stripe from 'stripe'

// Configuration pour Vercel - Edge Runtime
export const runtime = 'edge'

// Configuration Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * WEBHOOK STRIPE - IMPLÉMENTATION PROPRE ET FIABLE
 * 
 * Cette version utilise le Edge Runtime de Vercel pour éviter le buffering
 * et lit le body brut avec req.text() pour une compatibilité parfaite.
 */
export async function POST(req: Request) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🛰️ [WEBHOOK] Nouveau webhook Stripe reçu')
  console.log('🕐 [WEBHOOK] Time:', new Date().toISOString())
  
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LECTURE DU BODY BRUT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('📦 [WEBHOOK] Lecture du body brut...')
    
    const body = await req.text()
    console.log('✅ [WEBHOOK] Body brut récupéré:', body.length, 'caractères')
    
    if (!body) {
      console.error('❌ [WEBHOOK] Body vide')
      return new Response('Body vide', { status: 400 })
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // RÉCUPÉRATION DE LA SIGNATURE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('🔐 [WEBHOOK] Récupération de la signature...')
    
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')
    
    if (!signature) {
      console.error('❌ [WEBHOOK] Header stripe-signature manquant')
      return new Response('Signature manquante', { status: 400 })
    }
    
    console.log('✅ [WEBHOOK] Signature présente')
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VÉRIFICATION DE LA SIGNATURE STRIPE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('🔍 [WEBHOOK] Vérification de la signature Stripe...')
    
    let event: Stripe.Event
    
    try {
      // CRITIQUE : Passer le body brut directement à Stripe
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      
      console.log('━━━ ✅ Webhook validé ✅ ━━━')
      console.log('✅ [WEBHOOK] Signature vérifiée avec succès')
      
    } catch (err: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ Erreur de vérification Stripe')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('📋 [ERROR] Message:', err.message)
      console.error('📋 [ERROR] Type:', err.type)
      console.error('🔐 [ERROR] Signature présente:', !!signature)
      console.error('📦 [ERROR] Body length:', body.length)
      console.error('🔑 [ERROR] Secret présent:', !!webhookSecret)
      console.error('🔑 [ERROR] Secret format:', webhookSecret?.startsWith('whsec_'))
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return new Response('Erreur de vérification Stripe', { status: 400 })
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TRAITEMENT DE L'ÉVÉNEMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('🎯 Event reçu :', event.type)
    console.log('📋 [WEBHOOK] Event ID:', event.id)
    console.log('📋 [WEBHOOK] Event livemode:', event.livemode)
    
    // Gestion spécifique de checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('💳 Paiement validé :', session.id)
      console.log('💳 [WEBHOOK] Session ID:', session.id)
      console.log('💳 [WEBHOOK] Payment status:', session.payment_status)
      console.log('💳 [WEBHOOK] Customer email:', session.customer_details?.email)
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ [WEBHOOK] Traitement terminé avec succès')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Retourner 200 OK
    return new Response('OK', { status: 200 })
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erreur inattendue:', error.message)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return new Response('Erreur serveur', { status: 500 })
  }
}

// Méthodes non autorisées
export async function GET() {
  return new Response('Method not allowed', { status: 405 })
}

export async function PUT() {
  return new Response('Method not allowed', { status: 405 })
}

export async function DELETE() {
  return new Response('Method not allowed', { status: 405 })
}