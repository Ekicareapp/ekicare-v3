import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// ⚡ CONFIGURATION CRITIQUE POUR WEBHOOKS STRIPE
export const runtime = 'nodejs' // OBLIGATOIRE pour Buffer
export const dynamic = 'force-dynamic' // Désactive le cache

// Configuration Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil',
})

// Configuration Supabase avec service role pour bypasser RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// 🔍 VALIDATION AU DÉMARRAGE
if (!stripeSecretKey || !webhookSecret) {
  console.error('❌ [WEBHOOK-INIT] Configuration Stripe manquante!')
  console.error('  - STRIPE_SECRET_KEY:', !!stripeSecretKey)
  console.error('  - STRIPE_WEBHOOK_SECRET:', !!webhookSecret)
} else {
  console.log('✅ [WEBHOOK-INIT] Configuration Stripe chargée')
  console.log('  - Mode:', stripeSecretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE')
  console.log('  - Webhook Secret:', `${webhookSecret.substring(0, 12)}...`)
}

/**
 * 🛰️ WEBHOOK STRIPE HANDLER
 * 
 * CRITIQUE : Ce endpoint doit recevoir le body RAW (non parsé) pour valider la signature Stripe.
 * La signature Stripe est calculée sur le body exact envoyé, tout parsing le rend invalide.
 * 
 * @see https://stripe.com/docs/webhooks/signatures
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`🛰️ [WEBHOOK] Webhook reçu à ${timestamp}`)
  
  try {
    // ⚡ ÉTAPE 1 : Récupération du RAW BODY
    // CRITIQUE : Utiliser arrayBuffer() puis Buffer.from() pour garantir les bytes exacts
    const arrayBuffer = await request.arrayBuffer()
    const rawBody = Buffer.from(arrayBuffer)
    
    // ⚡ ÉTAPE 2 : Récupération de la signature Stripe
    const signature = request.headers.get('stripe-signature')
    
    // Validation immédiate
    if (!rawBody || rawBody.length === 0) {
      console.error('❌ [WEBHOOK] Body vide')
      return NextResponse.json({ error: 'Body manquant' }, { status: 400 })
    }
    
    if (!signature) {
      console.error('❌ [WEBHOOK] Stripe-Signature header manquant')
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
    }
    
    // Logs de diagnostic
    console.log('✅ [WEBHOOK] Body récupéré:', rawBody.length, 'bytes')
    console.log('✅ [WEBHOOK] Signature présente')
    console.log('🔍 [WEBHOOK] Environment:', process.env.VERCEL_ENV || 'local')
    
    // ⚡ ÉTAPE 3 : VÉRIFICATION DE LA SIGNATURE STRIPE
    let event: Stripe.Event
    
    try {
      // CRITIQUE : Passer le Buffer brut directement à Stripe
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
      
      console.log('━━━ SIGNATURE VALIDÉE ✅ ━━━')
      console.log('✅ [WEBHOOK] Signature vérifiée avec succès')
      console.log('📋 [WEBHOOK] Event ID:', event.id)
      console.log('📋 [WEBHOOK] Event type:', event.type)
      console.log('📋 [WEBHOOK] Event livemode:', event.livemode)
      
      // Vérification mode cohérent
      const expectedLiveMode = stripeSecretKey.startsWith('sk_live_')
      if (event.livemode !== expectedLiveMode) {
        console.error('⚠️ [WEBHOOK] MODE MISMATCH !')
        console.error('  - Event livemode:', event.livemode)
        console.error('  - Config mode:', expectedLiveMode ? 'LIVE' : 'TEST')
        return NextResponse.json({ 
          error: 'Mode incohérent',
          eventLivemode: event.livemode,
          configuredMode: expectedLiveMode ? 'LIVE' : 'TEST'
        }, { status: 400 })
      }
      
      console.log('✅ [WEBHOOK] Mode cohérent:', event.livemode ? 'LIVE' : 'TEST')
      
    } catch (err: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ ERREUR SIGNATURE STRIPE')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ [WEBHOOK] Message:', err.message)
      console.error('❌ [WEBHOOK] Type:', err.type)
      console.error('🔍 [WEBHOOK] Body length:', rawBody.length, 'bytes')
      console.error('🔍 [WEBHOOK] Signature preview:', signature.substring(0, 50) + '...')
      console.error('🔍 [WEBHOOK] Secret preview:', webhookSecret.substring(0, 12) + '...')
      console.error('🔍 [WEBHOOK] Environment:', process.env.VERCEL_ENV)
      console.error('')
      console.error('━━━ SOLUTIONS POSSIBLES ━━━')
      console.error('1. Vérifier qu\'un seul endpoint est actif dans Stripe Dashboard')
      console.error('2. Vérifier que STRIPE_WEBHOOK_SECRET correspond à cet endpoint')
      console.error('3. Régénérer le webhook secret si nécessaire')
      console.error('4. Vérifier que le secret est bien en Production sur Vercel')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return NextResponse.json({ 
        error: 'Signature invalide',
        message: err.message,
        hint: 'Vérifier le webhook secret et qu\'un seul endpoint est actif'
      }, { status: 400 })
    }
    
    // ⚡ ÉTAPE 4 : TRAITEMENT DES ÉVÉNEMENTS
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      default:
        console.log(`ℹ️ [WEBHOOK] Événement non géré: ${event.type}`)
    }
    
    const duration = Date.now() - startTime
    console.log('✅ [WEBHOOK] Événement traité avec succès')
    console.log('⏱️ [WEBHOOK] Durée totale:', duration, 'ms')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return NextResponse.json({ 
      received: true,
      eventId: event.id,
      eventType: event.type,
      duration: duration
    })
    
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('❌ [WEBHOOK] Erreur générale:', error.message)
    console.error('⏱️ [WEBHOOK] Durée avant erreur:', duration, 'ms')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return NextResponse.json({ 
      error: 'Erreur serveur',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * 💳 GESTION CHECKOUT SESSION COMPLETED
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 [WEBHOOK] Checkout session completed:', session.id)
  
  try {
    // Récupérer l'ID utilisateur
    const userId = session.client_reference_id || session.metadata?.userId || session.metadata?.user_id
    
    if (!userId) {
      console.error('❌ [WEBHOOK] user_id manquant')
      return
    }
    
    console.log('👤 [WEBHOOK] User ID:', userId)
    console.log('💰 [WEBHOOK] Payment status:', session.payment_status)
    
    if (session.payment_status !== 'paid') {
      console.log('⚠️ [WEBHOOK] Paiement non confirmé:', session.payment_status)
      return
    }
    
    // Vérifier si le profil existe
    const { data: existingProfile, error: findError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('user_id', userId)
    
    if (findError || !existingProfile || existingProfile.length === 0) {
      console.error('❌ [WEBHOOK] Profil non trouvé pour user_id:', userId)
      return
    }
    
    const profile = existingProfile[0]
    console.log('✅ [WEBHOOK] Profil trouvé, ID:', profile.id)
    
    // Mettre à jour le profil
    const updateData = {
      is_verified: true,
      is_subscribed: true
    }
    
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update(updateData)
      .eq('user_id', userId)
    
    if (updateError) {
      console.error('❌ [WEBHOOK] Erreur mise à jour profil:', updateError.message)
      return
    }
    
    console.log('✅ [WEBHOOK] Profil activé avec succès')
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erreur handleCheckoutSessionCompleted:', error.message)
  }
}

/**
 * 🧾 GESTION INVOICE PAYMENT SUCCEEDED
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('🧾 [WEBHOOK] Invoice payment succeeded:', invoice.id)
  
  try {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    
    if (!customerId) {
      console.log('⚠️ [WEBHOOK] Customer ID manquant')
      return
    }
    
    // Trouver le profil par customer_id Stripe
    const { data: profiles, error: findError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
    
    if (findError || !profiles || profiles.length === 0) {
      console.log('⚠️ [WEBHOOK] Profil non trouvé pour customer:', customerId)
      return
    }
    
    const profile = profiles[0]
    console.log('✅ [WEBHOOK] Profil trouvé:', profile.id)
    
    // Mettre à jour les statuts
    const updateData = {
      is_verified: true,
      is_subscribed: true
    }
    
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update(updateData)
      .eq('id', profile.id)
    
    if (updateError) {
      console.error('❌ [WEBHOOK] Erreur mise à jour invoice:', updateError.message)
      return
    }
    
    console.log('✅ [WEBHOOK] Statuts mis à jour via invoice')
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erreur handleInvoicePaymentSucceeded:', error.message)
  }
}

/**
 * 📋 GESTION SUBSCRIPTION UPDATED
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('📋 [WEBHOOK] Subscription updated:', subscription.id)
  
  try {
    const customerId = subscription.customer as string
    const status = subscription.status
    
    // Trouver le profil par customer_id Stripe
    const { data: profiles, error: findError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
    
    if (findError || !profiles || profiles.length === 0) {
      console.log('⚠️ [WEBHOOK] Profil non trouvé pour subscription:', customerId)
      return
    }
    
    const profile = profiles[0]
    console.log('✅ [WEBHOOK] Profil trouvé:', profile.id)
    
    // Mettre à jour selon le statut
    const isActive = ['active', 'trialing'].includes(status)
    
    const updateData = {
      is_verified: isActive,
      is_subscribed: isActive
    }
    
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update(updateData)
      .eq('id', profile.id)
    
    if (updateError) {
      console.error('❌ [WEBHOOK] Erreur mise à jour subscription:', updateError.message)
      return
    }
    
    console.log(`✅ [WEBHOOK] Subscription ${status} - Profil mis à jour`)
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erreur handleSubscriptionUpdated:', error.message)
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

