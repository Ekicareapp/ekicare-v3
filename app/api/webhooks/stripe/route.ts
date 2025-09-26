import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

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
      console.log('🕐 Timestamp:', new Date().toISOString())
      
      const session = event.data.object as Stripe.Checkout.Session
      console.log('📋 Session ID:', session.id)
      console.log('📋 Session metadata complète:', JSON.stringify(session.metadata, null, 2))

      // Récupérer le userId depuis les metadata - priorité à userId
      let userId = session.metadata?.userId
      if (!userId) {
        userId = session.metadata?.user_id
        console.log('⚠️ userId non trouvé, tentative avec user_id:', userId)
      } else {
        console.log('✅ userId trouvé directement dans metadata.userId')
      }
      
      if (!userId) {
        console.error('❌ Aucun userId trouvé dans session.metadata')
        console.error('📋 Clés disponibles dans metadata:', Object.keys(session.metadata || {}))
        console.error('📋 Valeurs dans metadata:', session.metadata)
        return NextResponse.json({ error: 'No userId in metadata' }, { status: 400 })
      }

      console.log('👤 User ID extrait avec succès:', userId)
      console.log('🔍 Type du userId:', typeof userId)

      // Vérifier que Supabase est initialisé
      if (!supabase) {
        console.error('❌ Supabase client not initialized')
        return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
      }

      // Vérifier d'abord si le profil existe
      console.log('🔍 Vérification de l\'existence du profil pour user_id:', userId)
      const { data: existingProfile, error: fetchError } = await supabase
        .from('pro_profiles')
        .select('user_id, is_verified, is_subscribed')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération du profil:', fetchError)
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      console.log('📊 Profil existant trouvé:', existingProfile)

      // Mettre à jour le profil professionnel
      console.log('🔄 Début de la mise à jour de pro_profiles')
      console.log('📝 User ID ciblé:', userId)
      console.log('📝 Valeurs à mettre à jour:')
      console.log('   - is_verified: true')
      console.log('   - is_subscribed: true')
      console.log('   - subscription_end: +30 jours')
      
      const subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      console.log('📅 Date de fin d\'abonnement calculée:', subscriptionEndDate.toISOString())
      
      const { data: updateResult, error: updateError } = await supabase
        .from('pro_profiles')
        .update({
          is_verified: true,
          is_subscribed: true,
          subscription_end: subscriptionEndDate.toISOString()
        })
        .eq('user_id', userId)
        .select() // Retourner les données mises à jour

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour de pro_profiles:')
        console.error('   Code d\'erreur:', updateError.code)
        console.error('   Message:', updateError.message)
        console.error('   Détails:', updateError.details)
        console.error('   Hint:', updateError.hint)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      console.log('✅ Mise à jour SQL effectuée avec succès')
      console.log('📊 Résultat de la mise à jour:', updateResult)

      // Vérifier que la mise à jour a bien eu lieu
      console.log('🔍 Vérification post-mise à jour...')
      const { data: updatedProfile, error: verifyError } = await supabase
        .from('pro_profiles')
        .select('user_id, is_verified, is_subscribed, subscription_end, updated_at')
        .eq('user_id', userId)
        .single()

      if (verifyError) {
        console.error('❌ Erreur lors de la vérification post-mise à jour:', verifyError)
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
      }

      console.log('✅ Vérification réussie - Profil final:')
      console.log('   👤 User ID:', updatedProfile.user_id)
      console.log('   ✅ is_verified:', updatedProfile.is_verified)
      console.log('   💳 is_subscribed:', updatedProfile.is_subscribed)
      console.log('   📅 subscription_end:', updatedProfile.subscription_end)
      console.log('   🕐 updated_at:', updatedProfile.updated_at)

      // Vérification finale des valeurs
      const isVerifiedCorrect = updatedProfile.is_verified === true
      const isSubscribedCorrect = updatedProfile.is_subscribed === true
      const hasSubscriptionEnd = updatedProfile.subscription_end !== null

      console.log('🎯 Vérifications finales:')
      console.log('   ✅ is_verified = true:', isVerifiedCorrect ? '✅' : '❌')
      console.log('   ✅ is_subscribed = true:', isSubscribedCorrect ? '✅' : '❌')
      console.log('   ✅ subscription_end défini:', hasSubscriptionEnd ? '✅' : '❌')

      if (isVerifiedCorrect && isSubscribedCorrect && hasSubscriptionEnd) {
        console.log('🎉 MISE À JOUR COMPLÈTE ET RÉUSSIE pour user:', userId)
      } else {
        console.error('❌ MISE À JOUR INCOMPLÈTE - Vérifiez la base de données')
      }
    } else {
      console.log('ℹ️ Événement non traité:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
