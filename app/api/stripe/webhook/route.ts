import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Créer une instance Supabase avec la clé service pour bypasser RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook Stripe reçu')
    
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('❌ Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Signature webhook vérifiée')
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Traiter l'événement checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      console.log('💳 Événement checkout.session.completed reçu')
      
      const session = event.data.object as Stripe.Checkout.Session
      console.log('📋 Session ID:', session.id)
      console.log('📋 Session metadata:', session.metadata)
      console.log('📋 Customer ID:', session.customer)
      console.log('📋 Subscription ID:', session.subscription)

      // Récupérer le userId depuis les metadata ou client_reference_id
      const userId = session.metadata?.userId || session.client_reference_id
      if (!userId) {
        console.error('❌ No userId found in session metadata or client_reference_id')
        console.error('❌ Available metadata:', session.metadata)
        console.error('❌ Client reference ID:', session.client_reference_id)
        return NextResponse.json({ error: 'No userId found' }, { status: 400 })
      }

      console.log('👤 User ID trouvé:', userId)

      // Vérifier que Supabase est initialisé
      if (!supabase) {
        console.error('❌ Supabase client not initialized')
        return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
      }

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
        console.error('❌ User not found in database after retries:', userId, userCheckError)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (userExists.role !== 'PRO') {
        console.error('❌ User is not a professional:', userExists.role)
        return NextResponse.json({ error: 'User is not a professional' }, { status: 400 })
      }

      console.log('✅ User validated:', userExists.id, userExists.role)

      // Vérifier si le profil est déjà activé pour éviter les doublons
      const { data: currentProfile, error: profileCheckError } = await supabase
        .from('pro_profiles')
        .select('is_verified, is_subscribed, stripe_customer_id')
        .eq('user_id', userId)
        .single()

      if (profileCheckError) {
        console.error('❌ Error checking current profile:', profileCheckError)
        return NextResponse.json({ error: 'Profile check failed' }, { status: 500 })
      }

      if (currentProfile.is_verified && currentProfile.is_subscribed) {
        console.log('✅ Profile already activated for user:', userId)
        return NextResponse.json({ received: true, message: 'Profile already activated' })
      }

      // Mettre à jour le profil professionnel
      console.log('🔄 Mise à jour de pro_profiles pour user_id:', userId)
      
      const updateData = {
        is_verified: true,
        is_subscribed: true,
        subscription_start: new Date().toISOString(),
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription
      }

      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update(updateData)
        .eq('user_id', userId)

      if (updateError) {
        console.error('❌ Error updating pro_profiles:', updateError)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      console.log('✅ Subscription activated for user:', userId)
      console.log('✅ User can now access dashboard')
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}