import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Configuration Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

// Configuration Supabase avec service role pour bypasser RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  console.log('🔔 [WEBHOOK] === DÉBUT WEBHOOK STRIPE ===')
  console.log('🔔 [WEBHOOK] Timestamp:', new Date().toISOString())
  console.log('🔔 [WEBHOOK] Environment:', process.env.NODE_ENV)
  
  try {
    // Vérifier que la requête vient de Stripe
    const userAgent = request.headers.get('user-agent')
    if (!userAgent?.includes('Stripe')) {
      console.error('❌ [WEBHOOK] Requête non-Stripe reçue:', userAgent)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Récupérer le body brut
    const body = await request.text()
    console.log('📦 [WEBHOOK] Body length:', body.length)
    
    if (!body || body.length === 0) {
      console.error('❌ [WEBHOOK] Body vide')
      return NextResponse.json({ error: 'Empty body' }, { status: 400 })
    }

    // Récupérer la signature Stripe
    const signature = request.headers.get('stripe-signature')
    console.log('✍️ [WEBHOOK] Signature présente:', !!signature)
    
    if (!signature) {
      console.error('❌ [WEBHOOK] Signature manquante')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // DEBUG : Vérifier le secret
    console.log('🔍 [WEBHOOK] Secret length:', webhookSecret.length)
    console.log('🔍 [WEBHOOK] Secret starts with whsec_:', webhookSecret.startsWith('whsec_'))
    console.log('🔍 [WEBHOOK] Secret has spaces:', webhookSecret.includes(' '))
    console.log('🔍 [WEBHOOK] Secret has newlines:', webhookSecret.includes('\n'))

    // Vérifier la signature et construire l'événement
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ [WEBHOOK] Signature vérifiée - Événement:', event.type)
    } catch (err: any) {
      console.error('❌ [WEBHOOK] Signature invalide:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Traiter l'événement
    console.log('🎯 [WEBHOOK] Traitement événement:', event.type)
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'payment_intent.succeeded':
        console.log('💰 [WEBHOOK] Payment intent succeeded - Pas d\'action requise')
        break
        
      default:
        console.log('ℹ️ [WEBHOOK] Événement non traité:', event.type)
    }

    console.log('✅ [WEBHOOK] Traitement terminé avec succès')
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
        is_subscribed: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('id, prenom, nom, email')
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
