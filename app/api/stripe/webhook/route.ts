import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// IMPORTANT : Désactiver le bodyParser pour que Stripe puisse vérifier la signature
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Créer une instance Supabase avec la clé service pour bypasser RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔔 [WEBHOOK] Stripe webhook reçu')
    console.log('🌐 [WEBHOOK] Environment:', process.env.NODE_ENV)
    console.log('🌐 [WEBHOOK] Vercel URL:', process.env.VERCEL_URL)
    console.log('🔑 [WEBHOOK] Webhook secret présent:', !!webhookSecret)
    console.log('🔑 [WEBHOOK] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...')
    console.log('🔑 [WEBHOOK] Service Role Key présent:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    const body = await request.text()
    console.log('📦 [WEBHOOK] Body length:', body.length)
    
    const signature = request.headers.get('stripe-signature')
    console.log('✍️ [WEBHOOK] Signature présente:', !!signature)

    if (!signature) {
      console.error('❌ Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event
    try {
      console.log('🔐 [WEBHOOK] Début vérification signature...')
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ [WEBHOOK] Signature webhook vérifiée avec succès')
      console.log('📋 [WEBHOOK] Event type:', event.type)
      console.log('📋 [WEBHOOK] Event ID:', event.id)
    } catch (err: any) {
      console.error('❌ [WEBHOOK] Signature verification FAILED')
      console.error('❌ [WEBHOOK] Error message:', err.message)
      console.error('❌ [WEBHOOK] Error type:', err.type)
      console.error('❌ [WEBHOOK] Webhook secret length:', webhookSecret?.length)
      console.error('❌ [WEBHOOK] Signature length:', signature?.length)
      console.error('❌ [WEBHOOK] Body preview:', body.substring(0, 100))
      return NextResponse.json({ 
        error: 'Invalid signature', 
        details: err.message,
        hint: 'Vérifiez que STRIPE_WEBHOOK_SECRET correspond au webhook Stripe Dashboard' 
      }, { status: 400 })
    }

    // Traiter l'événement checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      console.log('💳 [WEBHOOK] Événement checkout.session.completed reçu')
      
      const session = event.data.object as Stripe.Checkout.Session
      console.log('📋 [WEBHOOK] Session ID:', session.id)
      console.log('📋 [WEBHOOK] Session metadata:', JSON.stringify(session.metadata))
      console.log('📋 [WEBHOOK] Customer ID:', session.customer)
      console.log('📋 [WEBHOOK] Subscription ID:', session.subscription)
      console.log('📋 [WEBHOOK] Payment status:', session.payment_status)
      console.log('📋 [WEBHOOK] Client reference ID:', session.client_reference_id)

      // Récupérer le userId depuis les metadata ou client_reference_id
      const userId = session.metadata?.userId || session.client_reference_id
      if (!userId) {
        console.error('❌ [WEBHOOK] No userId found in session')
        console.error('❌ [WEBHOOK] Available metadata:', JSON.stringify(session.metadata))
        console.error('❌ [WEBHOOK] Client reference ID:', session.client_reference_id)
        console.error('❌ [WEBHOOK] Full session object keys:', Object.keys(session))
        return NextResponse.json({ 
          error: 'No userId found',
          metadata: session.metadata,
          client_reference_id: session.client_reference_id
        }, { status: 400 })
      }

      console.log('👤 [WEBHOOK] User ID trouvé:', userId)

      // Vérifier que Supabase est initialisé
      if (!supabase) {
        console.error('❌ [WEBHOOK] Supabase client not initialized')
        console.error('❌ [WEBHOOK] NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
        console.error('❌ [WEBHOOK] SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
        return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
      }
      
      console.log('✅ [WEBHOOK] Supabase client initialisé')

      // Vérifier que l'utilisateur existe d'abord (avec retry en cas de timing)
      let userExists = null
      let userCheckError = null
      let retries = 3
      
      while (retries > 0 && !userExists) {
        const { data, error } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', userId)
          .single()
        
        userExists = data
        userCheckError = error
        
        if (!userExists && retries > 1) {
          console.log(`⏳ User not found, retrying... (${retries - 1} attempts left)`)
          await new Promise(resolve => setTimeout(resolve, 1000)) // Attendre 1 seconde
        }
        
        retries--
      }

      if (userCheckError || !userExists) {
        console.error('❌ [WEBHOOK] User not found in database after retries')
        console.error('❌ [WEBHOOK] User ID recherché:', userId)
        console.error('❌ [WEBHOOK] Error:', JSON.stringify(userCheckError))
        return NextResponse.json({ 
          error: 'User not found',
          userId,
          dbError: userCheckError?.message 
        }, { status: 404 })
      }

      if (userExists.role !== 'PRO') {
        console.error('❌ [WEBHOOK] User is not a professional')
        console.error('❌ [WEBHOOK] User role:', userExists.role)
        return NextResponse.json({ error: 'User is not a professional', role: userExists.role }, { status: 400 })
      }

      console.log('✅ [WEBHOOK] User validated:', userExists.id, userExists.role)

      // Vérifier si le profil est déjà activé pour éviter les doublons
      const { data: currentProfile, error: profileCheckError } = await supabase
        .from('pro_profiles')
        .select('is_verified, is_subscribed, stripe_customer_id')
        .eq('user_id', userId)
        .single()

      if (profileCheckError) {
        console.error('❌ [WEBHOOK] Error checking current profile')
        console.error('❌ [WEBHOOK] Error:', JSON.stringify(profileCheckError))
        return NextResponse.json({ 
          error: 'Profile check failed',
          dbError: profileCheckError.message 
        }, { status: 500 })
      }

      console.log('📊 [WEBHOOK] Current profile status:', {
        is_verified: currentProfile.is_verified,
        is_subscribed: currentProfile.is_subscribed,
        stripe_customer_id: currentProfile.stripe_customer_id
      })

      if (currentProfile.is_verified && currentProfile.is_subscribed) {
        console.log('✅ [WEBHOOK] Profile already activated for user:', userId)
        return NextResponse.json({ received: true, message: 'Profile already activated' })
      }

      // Mettre à jour le profil professionnel
      console.log('🔄 [WEBHOOK] Début mise à jour de pro_profiles pour user_id:', userId)
      
      const updateData = {
        is_verified: true,
        is_subscribed: true,
        subscription_start: new Date().toISOString(),
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription
      }
      
      console.log('📝 [WEBHOOK] Données à mettre à jour:', JSON.stringify(updateData))

      const { data: updateResult, error: updateError } = await supabase
        .from('pro_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()

      if (updateError) {
        console.error('❌ [WEBHOOK] Error updating pro_profiles')
        console.error('❌ [WEBHOOK] Error details:', JSON.stringify(updateError))
        console.error('❌ [WEBHOOK] Update data:', JSON.stringify(updateData))
        return NextResponse.json({ 
          error: 'Database update failed',
          dbError: updateError.message,
          code: updateError.code 
        }, { status: 500 })
      }

      console.log('✅ [WEBHOOK] Subscription activated for user:', userId)
      console.log('✅ [WEBHOOK] Updated rows:', JSON.stringify(updateResult))
      console.log('✅ [WEBHOOK] User can now access dashboard')
      console.log('⏱️ [WEBHOOK] Total processing time:', Date.now() - startTime, 'ms')
    }

    console.log('✅ [WEBHOOK] Webhook traité avec succès')
    console.log('⏱️ [WEBHOOK] Temps total:', Date.now() - startTime, 'ms')
    return NextResponse.json({ received: true, timestamp: new Date().toISOString() })
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Webhook error')
    console.error('❌ [WEBHOOK] Error message:', error.message)
    console.error('❌ [WEBHOOK] Error stack:', error.stack)
    console.error('⏱️ [WEBHOOK] Time before error:', Date.now() - startTime, 'ms')
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}