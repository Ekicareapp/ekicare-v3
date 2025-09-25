import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    console.log('🔔 Webhook Stripe reçu')

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
      const session = event.data.object as Stripe.Checkout.Session
      
      console.log('💳 Traitement du paiement:', session.id)
      console.log('📧 Email client:', session.customer_email)
      console.log('🆔 Client reference ID:', session.client_reference_id)
      
      // Récupérer l'user_id depuis client_reference_id
      const userId = session.client_reference_id
      
      if (!userId) {
        console.error('❌ No client_reference_id found in session:', session.id)
        return NextResponse.json({ error: 'No client_reference_id found' }, { status: 400 })
      }

      console.log('👤 User ID à vérifier:', userId)

      // Vérifier que Supabase est initialisé
      if (!supabase) {
        console.error('❌ Supabase client not initialized')
        return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
      }

      // Vérifier que l'utilisateur existe et est un professionnel
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .eq('role', 'PRO')
        .limit(1)

      if (userError || !userData || userData.length === 0) {
        console.error('❌ User not found or not a professional:', userId, userError)
        return NextResponse.json({ error: 'User not found or not a professional' }, { status: 404 })
      }

      console.log('✅ Utilisateur professionnel trouvé:', userData[0])

      // Mettre à jour pro_profiles avec is_verified = true
      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update({ is_verified: true })
        .eq('user_id', userId)

      if (updateError) {
        console.error('❌ Error updating pro_profiles:', updateError)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      console.log('✅ Paiement vérifié avec succès pour l\'utilisateur:', userId)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}