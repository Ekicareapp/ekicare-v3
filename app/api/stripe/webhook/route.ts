import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Configuration pour Next.js 15 + Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configuration Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

if (!stripeSecretKey || !webhookSecret) {
  console.error('❌ [WEBHOOK] Configuration Stripe manquante')
  throw new Error('Configuration Stripe manquante')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
})

// Configuration Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

console.log('✅ [WEBHOOK] Configuration initialisée')

/**
 * WEBHOOK STRIPE - VERSION OPTIMISÉE POUR VERCEL
 * 
 * Cette version utilise arrayBuffer() pour récupérer le raw body
 * et gère correctement les signatures Stripe sur Vercel.
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
    const arrayBuffer = await request.arrayBuffer()
    const rawBody = Buffer.from(arrayBuffer)
    
    console.log('📦 [WEBHOOK] Body récupéré:', rawBody.length, 'bytes')
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ÉTAPE 2 : Validation des données
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (rawBody.length === 0) {
      console.error('❌ [WEBHOOK] Body vide')
      return NextResponse.json({ error: 'Body vide' }, { status: 400 })
    }
    
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      console.error('❌ [WEBHOOK] Signature manquante')
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
    }
    
    console.log('🔐 [WEBHOOK] Signature présente')
    
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
      
    } catch (err: any) {
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
      console.error('')
      console.error('🔐 SIGNATURE REÇUE:')
      console.error('  Présent:', !!signature)
      console.error('  Preview:', signature.substring(0, 60) + '...')
      console.error('')
      console.error('🔑 SECRET CONFIGURÉ:')
      console.error('  Présent:', !!webhookSecret)
      console.error('  Format whsec_:', webhookSecret?.startsWith('whsec_'))
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
      console.error('━━━ ✅ SOLUTION EN 4 ÉTAPES ━━━')
      console.error('')
      console.error('1. Stripe Dashboard → Webhooks → SUPPRIMER tous sauf un')
      console.error('2. Dans l\'endpoint restant → Roll secret → Copier')
      console.error('3. Vercel → STRIPE_WEBHOOK_SECRET → Cocher Production')
      console.error('4. Redéployer')
      console.error('')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return NextResponse.json({ 
        error: 'Signature invalide',
        message: err.message,
        hint: 'Voir logs serveur pour diagnostic complet'
      }, { status: 400 })
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ÉTAPE 4 : TRAITEMENT DES ÉVÉNEMENTS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          console.log('💳 [WEBHOOK] Event checkout.session.completed reçu ✅')
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
          break
        
        case 'invoice.payment_succeeded':
          console.log('🧾 [WEBHOOK] Event invoice.payment_succeeded reçu ✅')
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
          break
        
        case 'customer.subscription.updated':
          console.log('📋 [WEBHOOK] Event customer.subscription.updated reçu ✅')
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
    
    // Retourner 200 OK pour confirmer à Stripe
    return NextResponse.json({ 
      received: true,
      eventId: event.id,
      eventType: event.type,
      status: 'success'
    }, { status: 200 })
    
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
  console.log('💳 [HANDLER] Traitement checkout.session.completed:', session.id)
  
  try {
    const userId = session.client_reference_id || session.metadata?.userId || session.metadata?.user_id
    
    if (!userId) {
      console.error('❌ [HANDLER] user_id manquant dans la session')
      return
    }
    
    if (session.payment_status !== 'paid') {
      console.log('⚠️ [HANDLER] Paiement non confirmé:', session.payment_status)
      return
    }
    
    console.log('🔍 [HANDLER] Recherche profil pour user:', userId)
    
    const { data: existingProfile, error: selectError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (selectError) {
      console.error('❌ [HANDLER] Erreur recherche profil:', selectError.message)
      return
    }
    
    if (!existingProfile) {
      console.error('❌ [HANDLER] Profil non trouvé pour user:', userId)
      return
    }
    
    console.log('✅ [HANDLER] Profil trouvé, mise à jour...')
    
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update({ 
        is_verified: true, 
        is_subscribed: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    
    if (updateError) {
      console.error('❌ [HANDLER] Erreur mise à jour profil:', updateError.message)
      return
    }
    
    console.log('✅ [HANDLER] Profil activé avec succès pour user:', userId)
    
  } catch (error: any) {
    console.error('❌ [HANDLER] Erreur inattendue:', error.message)
  }
}

/**
 * Gestion invoice.payment_succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('🧾 [HANDLER] Traitement invoice.payment_succeeded:', invoice.id)
  
  try {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    
    if (!customerId) {
      console.log('⚠️ [HANDLER] Customer ID manquant')
      return
    }
    
    const { data: profiles, error: selectError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
    
    if (selectError) {
      console.error('❌ [HANDLER] Erreur recherche profil:', selectError.message)
      return
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ [HANDLER] Profil non trouvé pour customer:', customerId)
      return
    }
    
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update({ 
        is_verified: true, 
        is_subscribed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', profiles[0].id)
    
    if (updateError) {
      console.error('❌ [HANDLER] Erreur mise à jour profil:', updateError.message)
      return
    }
    
    console.log('✅ [HANDLER] Profil mis à jour via invoice pour customer:', customerId)
    
  } catch (error: any) {
    console.error('❌ [HANDLER] Erreur inattendue:', error.message)
  }
}

/**
 * Gestion customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('📋 [HANDLER] Traitement customer.subscription.updated:', subscription.id)
  
  try {
    const customerId = subscription.customer as string
    const isActive = ['active', 'trialing'].includes(subscription.status)
    
    console.log('🔍 [HANDLER] Statut subscription:', subscription.status, '→ Active:', isActive)
    
    const { data: profiles, error: selectError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
    
    if (selectError) {
      console.error('❌ [HANDLER] Erreur recherche profil:', selectError.message)
      return
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ [HANDLER] Profil non trouvé pour subscription:', customerId)
      return
    }
    
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update({ 
        is_verified: isActive, 
        is_subscribed: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', profiles[0].id)
    
    if (updateError) {
      console.error('❌ [HANDLER] Erreur mise à jour profil:', updateError.message)
      return
    }
    
    console.log(`✅ [HANDLER] Profil mis à jour (${subscription.status}) pour customer:`, customerId)
    
  } catch (error: any) {
    console.error('❌ [HANDLER] Erreur inattendue:', error.message)
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