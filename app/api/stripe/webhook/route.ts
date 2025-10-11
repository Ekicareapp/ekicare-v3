import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Configuration pour Next.js 15 + Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configuration Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil',
})

/**
 * WEBHOOK STRIPE - VERSION ULTRA-SIMPLIFIÉE POUR VERCEL
 * 
 * Cette version respecte strictement les exigences :
 * - Lecture raw body uniquement via arrayBuffer()
 * - Pas de transformation avant constructEvent
 * - Validation stricte de la config
 * - Gestion d'erreurs propre
 */
export async function POST(request: NextRequest) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🛰️ [WEBHOOK] Nouveau webhook Stripe')
  console.log('🕐 [WEBHOOK] Time:', new Date().toISOString())
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VÉRIFICATION STRICTE DE LA CONFIG ENV
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('🔧 [CONFIG] Vérification configuration:')
  
  if (!webhookSecret) {
    console.error('❌ [CONFIG] STRIPE_WEBHOOK_SECRET absent')
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET manquant' }, { status: 400 })
  }
  
  if (!stripeSecretKey) {
    console.error('❌ [CONFIG] STRIPE_SECRET_KEY absent')
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY manquant' }, { status: 400 })
  }
  
  // Logs de configuration (sécurisés)
  console.log('🔑 [CONFIG] Secret tronqué chargé:', webhookSecret.substring(0, 8) + '...' + webhookSecret.substring(webhookSecret.length - 8))
  console.log('🌐 [CONFIG] VERCEL_ENV:', process.env.VERCEL_ENV)
  console.log('🎯 [CONFIG] Mode Stripe:', stripeSecretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE')
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LECTURE DU BODY RAW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📦 [WEBHOOK] Lecture body raw...')
  
  let rawBody: Buffer
  try {
    const arrayBuffer = await request.arrayBuffer()
    rawBody = Buffer.from(arrayBuffer)
    console.log('✅ [WEBHOOK] Body raw récupéré:', rawBody.length, 'bytes')
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erreur lecture body:', error.message)
    return NextResponse.json({ error: 'Erreur lecture body' }, { status: 400 })
  }
  
  if (rawBody.length === 0) {
    console.error('❌ [WEBHOOK] Body vide')
    return NextResponse.json({ error: 'Body vide' }, { status: 400 })
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VÉRIFICATION DE LA SIGNATURE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signature = request.headers.get('stripe-signature')
  
  if (!signature) {
    console.error('❌ [WEBHOOK] Header Stripe-Signature absent')
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }
  
  console.log('✅ [WEBHOOK] Signature présente')
  
  // Extraction des composants pour debug
  const sigParts = signature.split(',')
  let timestamp = 'N/A'
  let v1 = 'N/A'
  
  for (const part of sigParts) {
    if (part.startsWith('t=')) {
      timestamp = part.substring(2)
    } else if (part.startsWith('v1=')) {
      v1 = part.substring(3, 20) + '...'
    }
  }
  
  console.log('🔐 [WEBHOOK] Signature (t=):', timestamp)
  console.log('🔐 [WEBHOOK] Signature (v1=):', v1)
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VÉRIFICATION SIGNATURE STRIPE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('🔍 [WEBHOOK] Vérification signature Stripe...')
  
  let event: Stripe.Event
  
  try {
    // CRITIQUE : Passer le Buffer brut directement à Stripe
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
    console.error('📋 [ERROR] Message:', err.message)
    console.error('📋 [ERROR] Type:', err.type)
    console.error('🔐 [ERROR] Timestamp:', timestamp)
    console.error('🔐 [ERROR] Signature v1:', v1)
    console.error('📦 [ERROR] Body length:', rawBody.length, 'bytes')
    console.error('🔑 [ERROR] Secret format:', webhookSecret.startsWith('whsec_'))
    console.error('🌐 [ERROR] Environment:', process.env.VERCEL_ENV)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return NextResponse.json({ 
      error: 'Webhook Error: Signature invalide',
      message: err.message
    }, { status: 400 })
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRAITEMENT MINIMUM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (event.type === 'checkout.session.completed') {
    console.log('💳 [WEBHOOK] checkout.session.completed reçu ✅')
    console.log('✅ [WEBHOOK] Traitement OK - pas de DB update pour test')
  } else {
    console.log(`ℹ️ [WEBHOOK] Event non géré: ${event.type}`)
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // Retourner 200 OK immédiatement
  return NextResponse.json({ 
    received: true,
    eventId: event.id,
    eventType: event.type,
    status: 'success'
  }, { status: 200 })
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