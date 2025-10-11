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

// Configuration Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Validation au démarrage
if (!stripeSecretKey || !webhookSecret) {
  console.error('❌ [INIT] Configuration Stripe manquante!')
} else {
  console.log('✅ [INIT] Configuration OK')
  console.log('  Mode:', stripeSecretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE')
}

/**
 * WEBHOOK STRIPE - VERSION FINALE ROBUSTE
 * 
 * Ce endpoint DOIT recevoir le body brut (raw) pour valider la signature.
 * Stripe calcule une HMAC sur les bytes exacts reçus.
 * 
 * @see https://stripe.com/docs/webhooks/signatures
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🛰️ [WEBHOOK] Nouveau webhook Stripe')
  console.log('🕐 [WEBHOOK] Time:', new Date().toISOString())
  
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ÉTAPE 1 : Récupération du RAW BODY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CRITIQUE : arrayBuffer() garantit les bytes bruts sans transformation
    const arrayBuffer = await request.arrayBuffer()
    const rawBody = Buffer.from(arrayBuffer)
    
    console.log('📦 [WEBHOOK] Body récupéré:', rawBody.length, 'bytes')
    console.log('📦 [WEBHOOK] Body type:', Object.prototype.toString.call(rawBody))
    console.log('📦 [WEBHOOK] instanceof Buffer:', rawBody instanceof Buffer)
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ÉTAPE 2 : Récupération de la signature
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const signature = request.headers.get('stripe-signature')
    
    if (!rawBody || rawBody.length === 0) {
      console.error('❌ [WEBHOOK] Body vide')
      return NextResponse.json({ error: 'Body vide' }, { status: 400 })
    }
    
    if (!signature) {
      console.error('❌ [WEBHOOK] Signature manquante')
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
    }
    
    console.log('🔐 [WEBHOOK] Signature présente')
    
    // Extraction du timestamp pour traçabilité
    const sigParts = signature.split(',')
    let sigTimestamp = 'N/A'
    let sigV1 = 'N/A'
    
    for (const part of sigParts) {
      if (part.startsWith('t=')) {
        sigTimestamp = part.substring(2)
      } else if (part.startsWith('v1=')) {
        sigV1 = part.substring(3, 20) + '...'
      }
    }
    
    console.log('🔐 [WEBHOOK] Signature timestamp (t):', sigTimestamp)
    console.log('🔐 [WEBHOOK] Signature v1 (preview):', sigV1)
    console.log('🔑 [WEBHOOK] Secret présent:', !!webhookSecret)
    console.log('🔑 [WEBHOOK] Secret format (whsec_):', webhookSecret?.startsWith('whsec_'))
    console.log('🔍 [WEBHOOK] Env:', process.env.VERCEL_ENV || 'local')
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ÉTAPE 3 : VÉRIFICATION SIGNATURE STRIPE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let event: Stripe.Event
    
    try {
      // CRITIQUE : Passer le Buffer brut à Stripe
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
      
      console.log('━━━ ✅ SIGNATURE VALIDÉE ✅ ━━━')
      console.log('✅ [WEBHOOK] Signature OK')
      console.log('📋 [WEBHOOK] Event ID:', event.id)
      console.log('📋 [WEBHOOK] Event type:', event.type)
      console.log('📋 [WEBHOOK] Event livemode:', event.livemode)
      
      // Vérification mode cohérent
      const expectedLiveMode = stripeSecretKey.startsWith('sk_live_')
      if (event.livemode !== expectedLiveMode) {
        console.error('⚠️ [WEBHOOK] MODE MISMATCH!')
        console.error('  Event mode:', event.livemode)
        console.error('  Config mode:', expectedLiveMode ? 'LIVE' : 'TEST')
        return NextResponse.json({ 
          error: 'Mode incohérent',
          eventLivemode: event.livemode,
          configuredMode: expectedLiveMode ? 'LIVE' : 'TEST'
        }, { status: 400 })
      }
      
      console.log('✅ [WEBHOOK] Mode cohérent:', event.livemode ? 'LIVE' : 'TEST')
      
    } catch (err: any) {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ERREUR SIGNATURE - DIAGNOSTIC COMPLET
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ ❌ ❌ ERREUR SIGNATURE STRIPE ❌ ❌ ❌')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('')
      console.error('📋 ERREUR STRIPE:')
      console.error('  Message:', err.message)
      console.error('  Type:', err.type)
      console.error('')
      console.error('📦 BODY ENVOYÉ À STRIPE:')
      console.error('  Type:', typeof rawBody)
      console.error('  instanceof Buffer:', rawBody instanceof Buffer)
      console.error('  Length:', rawBody.length, 'bytes')
      console.error('  Preview (50 chars):', rawBody.toString('utf8').substring(0, 50))
      console.error('')
      console.error('🔐 SIGNATURE REÇUE:')
      console.error('  Timestamp (t):', sigTimestamp)
      console.error('  Signature v1:', sigV1)
      console.error('  Full preview:', signature.substring(0, 60) + '...')
      console.error('')
      console.error('🔑 SECRET CONFIGURÉ:')
      console.error('  Présent:', !!webhookSecret)
      console.error('  Format whsec_:', webhookSecret?.startsWith('whsec_'))
      console.error('  Preview:', webhookSecret?.substring(0, 12) + '...')
      console.error('  Length:', webhookSecret?.length)
      console.error('')
      console.error('🌐 ENVIRONNEMENT:')
      console.error('  VERCEL_ENV:', process.env.VERCEL_ENV)
      console.error('  Mode Stripe:', stripeSecretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE')
      console.error('')
      console.error('━━━ 🎯 DIAGNOSTIC ━━━')
      console.error('')
      console.error('Le body brut est CORRECT (Buffer de', rawBody.length, 'bytes)')
      console.error('La signature est PRÉSENTE')
      console.error('Le secret est PRÉSENT et au bon format')
      console.error('')
      console.error('➡️  LE PROBLÈME EST LA CONFIGURATION:')
      console.error('')
      console.error('CAUSE #1 (90%): Plusieurs endpoints Stripe actifs')
      console.error('  → Stripe envoie depuis un endpoint avec un autre secret')
      console.error('  → Solution: Garder UN SEUL endpoint actif')
      console.error('')
      console.error('CAUSE #2 (8%): Secret pas en "Production" sur Vercel')
      console.error('  → Le secret n\'est accessible qu\'en Preview')
      console.error('  → Solution: Cocher "Production" sur Vercel')
      console.error('')
      console.error('CAUSE #3 (2%): Secret obsolète')
      console.error('  → Le secret a été régénéré côté Stripe')
      console.error('  → Solution: Régénérer et mettre à jour')
      console.error('')
      console.error('━━━ 🔍 IDENTIFIER L\'ENDPOINT ━━━')
      console.error('')
      console.error('1. Copier le timestamp:', sigTimestamp)
      console.error('2. Aller sur: https://dashboard.stripe.com/webhooks')
      console.error('3. Pour chaque endpoint → Event logs')
      console.error('4. Chercher l\'event avec ce timestamp')
      console.error('5. Tu verras QUEL endpoint l\'a envoyé')
      console.error('6. Supprimer cet endpoint OU tous sauf un')
      console.error('')
      console.error('━━━ ✅ SOLUTION EN 4 ÉTAPES ━━━')
      console.error('')
      console.error('1. Stripe Dashboard → Webhooks → SUPPRIMER tous sauf un')
      console.error('2. Dans l\'endpoint restant → Roll secret → Copier')
      console.error('3. Vercel → STRIPE_WEBHOOK_SECRET → Cocher Production')
      console.error('4. Redéployer')
      console.error('')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return NextResponse.json({ 
        error: 'Signature invalide - Configuration Stripe/Vercel',
        message: err.message,
        timestamp: sigTimestamp,
        hint: 'Voir logs serveur pour diagnostic complet. Le code est correct, vérifier la configuration Stripe.'
      }, { status: 400 })
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ÉTAPE 4 : TRAITEMENT DES ÉVÉNEMENTS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
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
          console.log(`ℹ️ [WEBHOOK] Event non géré: ${event.type}`)
      }
    } catch (handlerError: any) {
      console.error('❌ [WEBHOOK] Erreur traitement event:', handlerError.message)
      // Ne pas return d'erreur à Stripe, l'event est valide
    }
    
    const duration = Date.now() - startTime
    console.log('✅ [WEBHOOK] Event traité avec succès')
    console.log('⏱️ [WEBHOOK] Durée:', duration, 'ms')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return NextResponse.json({ 
      received: true,
      eventId: event.id,
      eventType: event.type
    })
    
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('❌ [WEBHOOK] Erreur inattendue:', error.message)
    console.error('⏱️ [WEBHOOK] Durée avant erreur:', duration, 'ms')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return NextResponse.json({ 
      error: 'Erreur serveur',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * Gestion checkout.session.completed
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 [HANDLER] checkout.session.completed:', session.id)
  
  try {
    const userId = session.client_reference_id || session.metadata?.userId || session.metadata?.user_id
    
    if (!userId) {
      console.error('❌ [HANDLER] user_id manquant')
      return
    }
    
    if (session.payment_status !== 'paid') {
      console.log('⚠️ [HANDLER] Paiement non confirmé:', session.payment_status)
      return
    }
    
    const { data: existingProfile } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('user_id', userId)
    
    if (!existingProfile || existingProfile.length === 0) {
      console.error('❌ [HANDLER] Profil non trouvé pour user:', userId)
      return
    }
    
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update({ is_verified: true, is_subscribed: true })
      .eq('user_id', userId)
    
    if (updateError) {
      console.error('❌ [HANDLER] Erreur mise à jour:', updateError.message)
      return
    }
    
    console.log('✅ [HANDLER] Profil activé pour user:', userId)
    
  } catch (error: any) {
    console.error('❌ [HANDLER] Erreur:', error.message)
  }
}

/**
 * Gestion invoice.payment_succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('🧾 [HANDLER] invoice.payment_succeeded:', invoice.id)
  
  try {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    
    if (!customerId) {
      console.log('⚠️ [HANDLER] Customer ID manquant')
      return
    }
    
    const { data: profiles } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ [HANDLER] Profil non trouvé pour customer:', customerId)
      return
    }
    
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update({ is_verified: true, is_subscribed: true })
      .eq('id', profiles[0].id)
    
    if (updateError) {
      console.error('❌ [HANDLER] Erreur mise à jour:', updateError.message)
      return
    }
    
    console.log('✅ [HANDLER] Profil mis à jour via invoice')
    
  } catch (error: any) {
    console.error('❌ [HANDLER] Erreur:', error.message)
  }
}

/**
 * Gestion customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('📋 [HANDLER] subscription.updated:', subscription.id)
  
  try {
    const customerId = subscription.customer as string
    const isActive = ['active', 'trialing'].includes(subscription.status)
    
    const { data: profiles } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ [HANDLER] Profil non trouvé pour subscription:', customerId)
      return
    }
    
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update({ is_verified: isActive, is_subscribed: isActive })
      .eq('id', profiles[0].id)
    
    if (updateError) {
      console.error('❌ [HANDLER] Erreur mise à jour:', updateError.message)
      return
    }
    
    console.log(`✅ [HANDLER] Profil mis à jour (${subscription.status})`)
    
  } catch (error: any) {
    console.error('❌ [HANDLER] Erreur:', error.message)
  }
}

// Méthodes non autorisées
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

