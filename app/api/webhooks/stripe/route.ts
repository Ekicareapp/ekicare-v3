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

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Traiter l'événement checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Récupérer le user_id depuis les metadata
      const userId = session.metadata?.user_id
      if (!userId) {
        console.error('No user_id found in session metadata')
        return NextResponse.json({ error: 'No user_id in metadata' }, { status: 400 })
      }

      // Vérifier que Supabase est initialisé
      if (!supabase) {
        console.error('Supabase client not initialized')
        return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
      }

      // Mettre à jour le profil professionnel
      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update({
          is_subscribed: true,
          subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 jours
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error updating pro_profiles:', updateError)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      console.log(`Subscription activated for user ${userId}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
