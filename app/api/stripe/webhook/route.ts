import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// 🛰️ WEBHOOK STRIPE ROBUSTE - SOURCE DE VÉRITÉ
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

// 🔍 DIAGNOSTIC AU DÉMARRAGE
console.log('🔧 [WEBHOOK-INIT] Configuration chargée:')
console.log('  - Stripe Secret Key:', stripeSecretKey ? `${stripeSecretKey.substring(0, 12)}...` : 'MANQUANT')
console.log('  - Stripe Secret Key Mode:', stripeSecretKey?.startsWith('sk_test_') ? 'TEST' : stripeSecretKey?.startsWith('sk_live_') ? 'LIVE' : 'INVALIDE')
console.log('  - Webhook Secret:', webhookSecret ? `${webhookSecret.substring(0, 12)}...` : 'MANQUANT')
console.log('  - Webhook Secret Valid:', webhookSecret?.startsWith('whsec_') ? 'OUI' : 'NON')

/**
 * 🛰️ WEBHOOK STRIPE - SOURCE DE VÉRITÉ
 * 
 * Ce webhook est la source principale de mise à jour des statuts
 * après un paiement réussi. Il doit être fiable et robuste.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  // 📊 LOGS DÉTAILLÉS POUR DIAGNOSTIC
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🛰️ [WEBHOOK] Nouveau webhook Stripe reçu')
  console.log('🕐 [WEBHOOK] Timestamp:', new Date().toISOString())
  
  try {
    // 1. RÉCUPÉRATION DU RAW BODY EN ARRAYBUFFER (critique pour la signature)
    // ⚡ IMPORTANT : Ne JAMAIS utiliser request.text() ou request.json()
    // Stripe nécessite le buffer brut exact pour la vérification de signature
    const arrayBuffer = await request.arrayBuffer()
    const body = Buffer.from(arrayBuffer)
    
    const signature = request.headers.get('stripe-signature')
    const webhookId = request.headers.get('stripe-webhook-id')
    const userAgent = request.headers.get('user-agent')
    const host = request.headers.get('host')
    const requestUrl = request.url
    
    // 🔍 ANALYSE SIGNATURE DÉTAILLÉE
    // Format Stripe: t=timestamp,v1=signature,v0=signature
    let signatureTimestamp = 'N/A'
    let signatureV1 = 'N/A'
    let signatureV0 = 'N/A'
    
    if (signature) {
      const parts = signature.split(',')
      for (const part of parts) {
        if (part.startsWith('t=')) {
          signatureTimestamp = part.substring(2)
        } else if (part.startsWith('v1=')) {
          signatureV1 = part.substring(3, 13) + '...' // Tronqué pour sécurité
        } else if (part.startsWith('v0=')) {
          signatureV0 = part.substring(3, 13) + '...' // Tronqué pour sécurité
        }
      }
    }
    
    // 📊 LOGS DÉTAILLÉS POUR AUDIT
    console.log('━━━ REQUÊTE ━━━')
    console.log('📍 [WEBHOOK] URL complète:', requestUrl)
    console.log('🌐 [WEBHOOK] Host:', host)
    console.log('🔑 [WEBHOOK] Webhook ID:', webhookId)
    console.log('👤 [WEBHOOK] User-Agent:', userAgent)
    
    console.log('━━━ BODY ━━━')
    console.log('📦 [WEBHOOK] Body type:', typeof body)
    console.log('📦 [WEBHOOK] Body instanceof Buffer:', body instanceof Buffer)
    console.log('📦 [WEBHOOK] Body length:', body.length, 'bytes')
    console.log('📦 [WEBHOOK] Body preview (50 chars):', body.toString('utf8').substring(0, 50))
    
    console.log('━━━ SIGNATURE STRIPE ━━━')
    console.log('🔐 [WEBHOOK] Signature présente:', !!signature)
    console.log('🔐 [WEBHOOK] Signature complète (tronquée):', signature ? signature.substring(0, 60) + '...' : 'MANQUANTE')
    console.log('🔐 [WEBHOOK] → Timestamp (t):', signatureTimestamp)
    console.log('🔐 [WEBHOOK] → Signature v1 (tronquée):', signatureV1)
    console.log('🔐 [WEBHOOK] → Signature v0 (tronquée):', signatureV0)
    
    console.log('━━━ CONFIGURATION SERVEUR ━━━')
    console.log('🔑 [WEBHOOK] Webhook Secret configuré:', webhookSecret ? `${webhookSecret.substring(0, 12)}...` : 'MANQUANT')
    console.log('🔑 [WEBHOOK] Secret valid (whsec_):', webhookSecret?.startsWith('whsec_'))
    console.log('🔑 [WEBHOOK] Stripe Key Mode:', stripeSecretKey?.startsWith('sk_test_') ? 'TEST' : 'LIVE')
    console.log('🔑 [WEBHOOK] Environment:', process.env.VERCEL_ENV || 'local')
    
    if (!signature) {
      console.error('❌ [WEBHOOK] Signature Stripe manquante')
      console.error('❌ [WEBHOOK] Headers disponibles:', Array.from(request.headers.keys()))
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
    }

    if (!webhookSecret) {
      console.error('❌ [WEBHOOK] STRIPE_WEBHOOK_SECRET non configuré')
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    // 2. VÉRIFICATION DE LA SIGNATURE STRIPE avec le buffer brut
    let event: Stripe.Event
    
    try {
      // ⚡ CRITIQUE : Passer le Buffer brut directement à Stripe
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      
      console.log('━━━ SIGNATURE VALIDÉE ✅ ━━━')
      console.log('✅ [WEBHOOK] Signature vérifiée avec succès')
      console.log('📋 [WEBHOOK] Event ID:', event.id)
      console.log('📋 [WEBHOOK] Event type:', event.type)
      console.log('📋 [WEBHOOK] Event livemode:', event.livemode)
      console.log('📋 [WEBHOOK] Event created:', new Date(event.created * 1000).toISOString())
      
      // 🔍 VÉRIFICATION MODE COHÉRENT
      const expectedLiveMode = stripeSecretKey?.startsWith('sk_live_')
      if (event.livemode !== expectedLiveMode) {
        console.error('━━━ ERREUR MODE INCOHÉRENT ❌ ━━━')
        console.error('⚠️ [WEBHOOK] MODE MISMATCH DÉTECTÉ !')
        console.error('  - Event livemode:', event.livemode, '(reçu de Stripe)')
        console.error('  - Stripe Key Mode:', expectedLiveMode ? 'LIVE' : 'TEST', '(configuré)')
        console.error('  - Action: Vérifier que les clés Stripe correspondent au même mode')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        return NextResponse.json({ 
          error: 'Mode incohérent: event livemode ne correspond pas aux clés configurées',
          eventLivemode: event.livemode,
          configuredMode: expectedLiveMode ? 'LIVE' : 'TEST',
          hint: 'Vérifier STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET'
        }, { status: 400 })
      }
      
      console.log('✅ [WEBHOOK] Mode cohérent:', event.livemode ? 'LIVE' : 'TEST')
      
    } catch (err: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ ERREUR SIGNATURE STRIPE - MISMATCH DÉTECTÉ')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      console.error('━━━ ERREUR ━━━')
      console.error('❌ [WEBHOOK] Échec vérification signature')
      console.error('❌ [WEBHOOK] Message:', err.message)
      console.error('❌ [WEBHOOK] Type:', err.type)
      console.error('❌ [WEBHOOK] Code:', err.code)
      
      console.error('━━━ SIGNATURE REÇUE ━━━')
      console.error('🔐 [WEBHOOK] Timestamp (t):', signatureTimestamp)
      console.error('🔐 [WEBHOOK] Signature v1:', signatureV1)
      console.error('🔐 [WEBHOOK] Signature v0:', signatureV0)
      console.error('🔐 [WEBHOOK] Signature complète:', signature?.substring(0, 80) + '...')
      
      console.error('━━━ SECRET CONFIGURÉ ━━━')
      console.error('🔑 [WEBHOOK] Secret tronqué:', webhookSecret?.substring(0, 12) + '...')
      console.error('🔑 [WEBHOOK] Secret valide (whsec_):', webhookSecret?.startsWith('whsec_'))
      console.error('🔑 [WEBHOOK] Environment:', process.env.VERCEL_ENV || 'local')
      
      console.error('━━━ DIAGNOSTIC COMPLET ━━━')
      console.error('🔍 [WEBHOOK] Timestamp:', new Date().toISOString())
      console.error('🔍 [WEBHOOK] Webhook ID:', webhookId)
      console.error('🔍 [WEBHOOK] Host:', host)
      console.error('🔍 [WEBHOOK] URL:', requestUrl)
      console.error('🔍 [WEBHOOK] Body Buffer:', body instanceof Buffer)
      console.error('🔍 [WEBHOOK] Body Length:', body.length, 'bytes')
      console.error('🔍 [WEBHOOK] Stripe Key Mode:', stripeSecretKey?.startsWith('sk_test_') ? 'TEST' : 'LIVE')
      
      console.error('━━━ CAUSE PROBABLE ━━━')
      console.error('⚠️  Le secret configuré ne correspond PAS à celui de l\'endpoint Stripe')
      console.error('⚠️  SOIT: Plusieurs endpoints actifs avec secrets différents')
      console.error('⚠️  SOIT: Secret non mis à jour après régénération')
      console.error('⚠️  SOIT: Secret en Preview au lieu de Production sur Vercel')
      
      console.error('━━━ ACTIONS REQUISES ━━━')
      console.error('1. 🔍 Aller dans Stripe Dashboard → Webhooks')
      console.error('2. ❌ SUPPRIMER tous les endpoints sauf UN')
      console.error('3. 🔄 RÉGÉNÉRER le secret (Roll secret)')
      console.error('4. 📋 COPIER le nouveau whsec_...')
      console.error('5. ⚙️  METTRE À JOUR dans Vercel en PRODUCTION')
      console.error('6. 🚀 REDÉPLOYER')
      
      console.error('━━━ COMPARAISON POUR DEBUG ━━━')
      console.error('Pour identifier l\'endpoint problématique:')
      console.error('1. Comparer le timestamp:', signatureTimestamp)
      console.error('2. Chercher dans Stripe Dashboard → Webhooks → Event logs')
      console.error('3. Trouver l\'event avec ce timestamp')
      console.error('4. Voir quel endpoint l\'a envoyé')
      
      console.error('━━━ STACK TRACE ━━━')
      console.error(err.stack)
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return NextResponse.json({ 
        error: 'Signature mismatch: le secret ne correspond pas',
        message: err.message,
        webhookId: webhookId,
        timestamp: new Date().toISOString(),
        signatureTimestamp: signatureTimestamp,
        hint: 'Un seul endpoint doit être actif avec le bon secret en Production'
      }, { status: 400 })
    }

    // 3. TRAITEMENT DES ÉVÉNEMENTS
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
    console.error('❌ [WEBHOOK] Erreur générale:', error)
    console.error('❌ [WEBHOOK] Message:', error.message)
    console.error('❌ [WEBHOOK] Stack:', error.stack)
    console.error('⏱️ [WEBHOOK] Durée avant erreur:', duration, 'ms')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return NextResponse.json({ 
      error: 'Erreur serveur',
      message: error.message,
      duration: duration
    }, { status: 500 })
  }
}

/**
 * 💳 GESTION CHECKOUT SESSION COMPLETED
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 [WEBHOOK] Checkout session completed:', session.id)
  
  try {
    // Récupérer l'ID utilisateur depuis plusieurs sources possibles
    const userId = session.client_reference_id || session.metadata?.userId || session.metadata?.user_id
    const userEmail = session.customer_email || session.customer_details?.email
    
    console.log('🔍 [WEBHOOK] Données de la session:')
    console.log('  - client_reference_id:', session.client_reference_id)
    console.log('  - metadata.userId:', session.metadata?.userId)
    console.log('  - metadata.user_id:', session.metadata?.user_id)
    console.log('  - user_id final:', userId)
    
    if (!userId) {
      console.error('❌ [WEBHOOK] user_id manquant dans les métadonnées et client_reference_id')
      return
    }

    console.log('👤 [WEBHOOK] User ID:', userId)
    console.log('📧 [WEBHOOK] Email:', userEmail)
    console.log('💰 [WEBHOOK] Payment status:', session.payment_status)
    console.log('🔗 [WEBHOOK] Customer ID:', session.customer)
    console.log('📋 [WEBHOOK] Subscription ID:', session.subscription)

    // Vérifier que le paiement est bien confirmé
    if (session.payment_status !== 'paid') {
      console.log('⚠️ [WEBHOOK] Paiement non confirmé:', session.payment_status)
      return
    }

    // 1. VÉRIFIER SI LE PROFIL EXISTE
    console.log('🔍 [WEBHOOK] Recherche du profil pour user_id:', userId)
    
    const { data: existingProfile, error: findError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('user_id', userId)
    
    console.log('📊 [WEBHOOK] Résultat recherche profil:')
    console.log('  - Profils trouvés:', existingProfile?.length || 0)
    console.log('  - Erreur:', findError?.message || 'Aucune')
    
    if (findError) {
      console.error('❌ [WEBHOOK] Erreur lors de la recherche du profil:', findError)
      // Ne pas bloquer, continuer quand même
    }

    if (!existingProfile || existingProfile.length === 0) {
      console.error('⚠️ [WEBHOOK] AUCUN PROFIL TROUVÉ pour user_id:', userId)
      console.error('⚠️ [WEBHOOK] Le profil professionnel doit être créé AVANT le paiement')
      console.error('⚠️ [WEBHOOK] Vérifier que le signup crée bien le profil dans pro_profiles')
      
      // Vérifier si l'utilisateur existe au moins dans la table users
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single()
      
      if (userError || !user) {
        console.error('❌ [WEBHOOK] Utilisateur inexistant dans la table users:', userError)
        return
      }
      
      console.log('✅ [WEBHOOK] Utilisateur trouvé:', user.email, '- Role:', user.role)
      
      // L'utilisateur existe mais pas son profil pro -> Cas anormal
      console.error('❌ [WEBHOOK] ERREUR CRITIQUE: User existe mais pro_profile manquant')
      console.error('❌ [WEBHOOK] Le paiement a été effectué mais le profil n\'a pas été créé lors du signup')
      
      return
    }

    // 2. METTRE À JOUR LE PROFIL
    const profile = existingProfile[0]
    console.log('✅ [WEBHOOK] Profil trouvé, ID:', profile.id)
    console.log('📊 [WEBHOOK] État actuel:')
    console.log('  - is_verified:', profile.is_verified)
    console.log('  - is_subscribed:', profile.is_subscribed)
    
    // ⚡ MISE À JOUR ROBUSTE : Uniquement les champs qui existent dans le schéma
    const updateData: any = {
      is_verified: true,
      is_subscribed: true
    }

    // Ajouter les champs Stripe seulement s'ils existent dans le schéma
    // Note: Ces champs ne sont PAS dans le schéma actuel, donc on les sauvegarde dans metadata si nécessaire
    console.log('💾 [WEBHOOK] Données Stripe reçues:')
    console.log('  - Customer ID:', session.customer)
    console.log('  - Subscription ID:', session.subscription)
    console.log('  - Session ID:', session.id)
    console.log('  - Email:', userEmail)
    
    console.log('🔄 [WEBHOOK] Mise à jour avec:', updateData)
    console.log('ℹ️ [WEBHOOK] Champs Stripe non sauvegardés (colonnes inexistantes dans le schéma):')
    console.log('  - stripe_customer_id:', session.customer)
    console.log('  - stripe_subscription_id:', session.subscription)
    console.log('  - stripe_session_id:', session.id)

    const { data: updatedProfile, error: updateError } = await supabase
      .from('pro_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()

    if (updateError) {
      console.error('❌ [WEBHOOK] Erreur mise à jour profil:', updateError)
      console.error('❌ [WEBHOOK] Code erreur:', updateError.code)
      console.error('❌ [WEBHOOK] Message:', updateError.message)
      console.error('❌ [WEBHOOK] Details:', updateError.details)
      
      // Si l'erreur est liée à une colonne manquante, on continue quand même
      if (updateError.code === 'PGRST204') {
        console.log('⚠️ [WEBHOOK] Colonne manquante détectée, mais is_verified et is_subscribed sont les seuls champs critiques')
        // Réessayer avec uniquement les champs de base
        const minimalUpdate = { is_verified: true, is_subscribed: true }
        const { error: retryError } = await supabase
          .from('pro_profiles')
          .update(minimalUpdate)
          .eq('user_id', userId)
        
        if (retryError) {
          console.error('❌ [WEBHOOK] Échec de la mise à jour minimale:', retryError)
          throw retryError
        }
        
        console.log('✅ [WEBHOOK] Mise à jour minimale réussie (is_verified + is_subscribed)')
        return
      }
      
      throw updateError
    }

    console.log('✅ [WEBHOOK] Profil mis à jour avec succès')
    console.log('📊 [WEBHOOK] Données mises à jour:', updatedProfile)
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erreur handleCheckoutSessionCompleted:', error)
    throw error
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

    console.log('👤 [WEBHOOK] Customer ID:', customerId)

    // Trouver le profil par customer_id Stripe (sans .single() pour éviter PGRST116)
    const { data: profiles, error: findError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)

    if (findError) {
      console.error('❌ [WEBHOOK] Erreur recherche profil:', findError)
      return
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ [WEBHOOK] Profil non trouvé pour customer:', customerId)
      return
    }

    const profile = profiles[0]
    console.log('✅ [WEBHOOK] Profil trouvé:', profile.id)

    // Mettre à jour les statuts (uniquement les champs existants dans le schéma)
    const updateData = {
      is_verified: true,
      is_subscribed: true
    }
    
    console.log('🔄 [WEBHOOK] Mise à jour invoice avec:', updateData)

    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update(updateData)
      .eq('id', profile.id)

    if (updateError) {
      console.error('❌ [WEBHOOK] Erreur mise à jour invoice:', updateError)
      console.error('❌ [WEBHOOK] Code erreur:', updateError.code)
      throw updateError
    }

    console.log('✅ [WEBHOOK] Statuts mis à jour via invoice')
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erreur handleInvoicePaymentSucceeded:', error)
    throw error
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
    
    console.log('👤 [WEBHOOK] Customer ID:', customerId)
    console.log('📊 [WEBHOOK] Status:', status)

    // Trouver le profil par customer_id Stripe (sans .single() pour éviter PGRST116)
    const { data: profiles, error: findError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)

    if (findError) {
      console.error('❌ [WEBHOOK] Erreur recherche profil:', findError)
      return
    }

    if (!profiles || profiles.length === 0) {
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
    
    console.log('🔄 [WEBHOOK] Mise à jour subscription avec:', updateData)
    console.log('ℹ️ [WEBHOOK] Subscription ID non sauvegardé (colonne inexistante):', subscription.id)
    
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update(updateData)
      .eq('id', profile.id)

    if (updateError) {
      console.error('❌ [WEBHOOK] Erreur mise à jour subscription:', updateError)
      console.error('❌ [WEBHOOK] Code erreur:', updateError.code)
      throw updateError
    }

    console.log(`✅ [WEBHOOK] Subscription ${status} - Profil mis à jour`)
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erreur handleSubscriptionUpdated:', error)
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
