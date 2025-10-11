import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// CRITIQUE : Configuration pour webhooks Stripe
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configuration Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

// Configuration Supabase avec service role pour bypasser RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// IMPORTANT : Désactiver le parsing automatique du body
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  // Vérifier que la requête vient bien de Stripe
  const userAgent = request.headers.get('user-agent')
  if (!userAgent?.includes('Stripe')) {
    console.error('❌ [WEBHOOK] Requête non-Stripe reçue:', userAgent)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  console.log('🔔 [WEBHOOK] Stripe webhook reçu')
  console.log('🌐 [WEBHOOK] Environment:', process.env.NODE_ENV)
  console.log('🌐 [WEBHOOK] Vercel URL:', process.env.VERCEL_URL)
  console.log('🔑 [WEBHOOK] Webhook secret présent:', !!webhookSecret)
  console.log('🔑 [WEBHOOK] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...')
  console.log('🔑 [WEBHOOK] Service Role Key présent:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  try {
    // Récupérer le body RAW sans parsing (arrayBuffer pour préserver l'encodage exact)
    const bodyBuffer = await request.arrayBuffer()
    const body = Buffer.from(bodyBuffer).toString('utf8')
    console.log('📦 [WEBHOOK] Body length:', body.length)
    console.log('📦 [WEBHOOK] Body preview:', body.substring(0, 100))
    
    // Vérifier que le body n'est pas vide
    if (!body || body.length === 0) {
      console.error('❌ [WEBHOOK] Body vide ou null')
      return NextResponse.json({ error: 'Empty body' }, { status: 400 })
    }
    
    const signature = request.headers.get('stripe-signature')
    console.log('✍️ [WEBHOOK] Signature présente:', !!signature)

    // DEBUG : Vérifier le secret
    console.log('🔍 [WEBHOOK] Secret length:', webhookSecret.length)
    console.log('🔍 [WEBHOOK] Secret starts with whsec_:', webhookSecret.startsWith('whsec_'))
    console.log('🔍 [WEBHOOK] Secret has spaces:', webhookSecret.includes(' '))
    console.log('🔍 [WEBHOOK] Secret has newlines:', webhookSecret.includes('\n'))
    console.log('🔍 [WEBHOOK] Secret preview:', webhookSecret.substring(0, 20) + '...')
    console.log('🔍 [WEBHOOK] Secret ends with:', webhookSecret.substring(webhookSecret.length - 10))
    
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    let event: Stripe.Event
    if (webhookSecret) {
      // Get the signature sent by Stripe
      try {
        console.log('🔐 [WEBHOOK] Tentative de vérification signature...')
        console.log('🔐 [WEBHOOK] Body length:', body.length)
        console.log('🔐 [WEBHOOK] Signature header:', signature)
        console.log('🔐 [WEBHOOK] Secret utilisé:', webhookSecret.substring(0, 20) + '...')
        
        event = stripe.webhooks.constructEvent(Buffer.from(bodyBuffer), signature!, webhookSecret)
        console.log('✅ [WEBHOOK] Signature vérifiée - Événement:', event.type)
      } catch (err: any) {
        console.error('⚠️ [WEBHOOK] Webhook signature verification failed:', err.message)
        console.error('⚠️ [WEBHOOK] Error details:', {
          message: err.message,
          type: err.type,
          code: err.code
        })
        return NextResponse.json({ 
          error: 'Invalid signature',
          details: err.message 
        }, { status: 400 })
      }
    } else {
      console.warn('⚠️ [WEBHOOK] No endpoint secret defined - using JSON.parse')
      event = JSON.parse(body)
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('💳 [WEBHOOK] Checkout session completed!')
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log(`💰 [WEBHOOK] PaymentIntent for ${paymentIntent.amount} was successful!`)
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        break
        
      case 'payment_method.attached':
        const paymentMethod = event.data.object
        console.log('💳 [WEBHOOK] PaymentMethod attached:', paymentMethod.id)
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break
        
      default:
        // Unexpected event type
        console.log(`ℹ️ [WEBHOOK] Unhandled event type ${event.type}.`)
    }

    // Return a 200 response to acknowledge receipt of the event
    console.log('✅ [WEBHOOK] Event processed successfully')
    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erreur générale:', error.message)
    return NextResponse.json({ 
      error: 'Webhook error',
      details: error.message 
    }, { status: 500 })
  }
}

// Fonction pour traiter checkout.session.completed
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 [WEBHOOK] Traitement checkout.session.completed')
  console.log('📋 [WEBHOOK] Session ID:', session.id)
  console.log('👤 [WEBHOOK] Client Reference ID:', session.client_reference_id)
  
  try {
    // Récupérer l'user_id depuis client_reference_id
    const userId = session.client_reference_id
    if (!userId) {
      console.error('❌ [WEBHOOK] client_reference_id manquant')
      return
    }

    console.log('🔍 [WEBHOOK] Recherche profil pour user_id:', userId)

    // Mettre à jour le profil professionnel
    const { data: updatedProfile, error: updateError } = await supabase
      .from('pro_profiles')
      .update({
        is_verified: true,
        is_subscribed: true
      })
      .eq('user_id', userId)
      .select('id, prenom, nom')
      .single()

    if (updateError) {
      console.error('❌ [WEBHOOK] Erreur mise à jour profil:', updateError)
      throw updateError
    }

    if (!updatedProfile) {
      console.error('❌ [WEBHOOK] Profil non trouvé pour user_id:', userId)
      return
    }

    console.log('✅ [WEBHOOK] Profil mis à jour avec succès:')
    console.log('✅ [WEBHOOK] - ID:', updatedProfile.id)
    console.log('✅ [WEBHOOK] - Nom:', updatedProfile.prenom, updatedProfile.nom)
    console.log('✅ [WEBHOOK] - is_verified: true')
    console.log('✅ [WEBHOOK] - is_subscribed: true')

    // Optionnel : Log pour audit
    console.log('📊 [WEBHOOK] Audit - Paiement validé:', {
      session_id: session.id,
      user_id: userId,
      amount: session.amount_total,
      currency: session.currency,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erreur traitement session:', error.message)
    throw error
  }
}

// Gérer les méthodes non autorisées
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
