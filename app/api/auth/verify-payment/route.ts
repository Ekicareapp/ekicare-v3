import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Créer un client Supabase avec le service role pour bypasser RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

/**
 * Route de secours pour vérifier et activer un professionnel après paiement
 * Utilisée quand le webhook Stripe ne fonctionne pas ou prend trop de temps
 */
export async function POST(request: Request) {
  try {
    console.log('🔍 [VERIFY-PAYMENT] Vérification manuelle du paiement')
    
    const { user_id, session_id } = await request.json()
    
    if (!user_id) {
      return NextResponse.json({ error: 'user_id requis' }, { status: 400 })
    }

    console.log('👤 [VERIFY-PAYMENT] User ID:', user_id)
    console.log('📋 [VERIFY-PAYMENT] Session ID:', session_id)

    // Vérifier l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      console.error('❌ [VERIFY-PAYMENT] User not found:', userError)
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    if (user.role !== 'PRO') {
      console.error('❌ [VERIFY-PAYMENT] User is not a professional')
      return NextResponse.json({ error: 'Utilisateur n\'est pas un professionnel' }, { status: 400 })
    }

    // Récupérer le profil pro (sans .single() pour éviter PGRST116)
    const { data: profiles, error: profileError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('user_id', user_id)

    console.log('📊 [VERIFY-PAYMENT] Profils trouvés:', profiles?.length || 0)

    if (profileError) {
      console.error('❌ [VERIFY-PAYMENT] Erreur recherche profil:', profileError)
      return NextResponse.json({ error: 'Erreur lors de la recherche du profil' }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      console.error('❌ [VERIFY-PAYMENT] Aucun profil trouvé pour user_id:', user_id)
      return NextResponse.json({ error: 'Profil professionnel non trouvé' }, { status: 404 })
    }

    const profile = profiles[0]
    console.log('✅ [VERIFY-PAYMENT] Profil trouvé, ID:', profile.id)

    // Si déjà vérifié, retourner succès
    if (profile.is_verified && profile.is_subscribed) {
      console.log('✅ [VERIFY-PAYMENT] Profile already verified')
      return NextResponse.json({
        verified: true,
        subscribed: true,
        message: 'Profil déjà activé'
      })
    }

    // Si session_id fourni, vérifier avec Stripe
    let stripeVerified = false
    let stripeCustomerId = null
    let stripeSubscriptionId = null

    if (session_id) {
      try {
        console.log('🔍 [VERIFY-PAYMENT] Vérification avec Stripe...')
        const session = await stripe.checkout.sessions.retrieve(session_id)
        
        console.log('📋 [VERIFY-PAYMENT] Stripe session status:', session.payment_status)
        console.log('📋 [VERIFY-PAYMENT] Stripe customer:', session.customer)
        console.log('📋 [VERIFY-PAYMENT] Stripe subscription:', session.subscription)
        
        if (session.payment_status === 'paid') {
          stripeVerified = true
          stripeCustomerId = session.customer
          stripeSubscriptionId = session.subscription
          console.log('✅ [VERIFY-PAYMENT] Paiement vérifié sur Stripe')
        } else {
          console.log('⚠️ [VERIFY-PAYMENT] Paiement non confirmé:', session.payment_status)
          return NextResponse.json({
            verified: false,
            subscribed: false,
            message: 'Paiement non confirmé sur Stripe',
            payment_status: session.payment_status
          })
        }
      } catch (stripeError: any) {
        console.error('❌ [VERIFY-PAYMENT] Erreur Stripe:', stripeError.message)
        // Ne pas bloquer si la session Stripe n'est pas trouvée
        // On peut quand même vérifier s'il y a un abonnement actif
      }
    }

    // Vérifier s'il y a un abonnement actif pour cet utilisateur
    if (!stripeVerified) {
      try {
        console.log('🔍 [VERIFY-PAYMENT] Recherche d\'abonnements actifs...')
        
        // Chercher par email si on a pas de customer_id
        const { data: authUser } = await supabase.auth.admin.getUserById(user_id)
        
        if (authUser.user?.email) {
          const customers = await stripe.customers.list({
            email: authUser.user.email,
            limit: 1
          })

          if (customers.data.length > 0) {
            const customer = customers.data[0]
            console.log('✅ [VERIFY-PAYMENT] Customer Stripe trouvé:', customer.id)
            
            const subscriptions = await stripe.subscriptions.list({
              customer: customer.id,
              status: 'active',
              limit: 1
            })

            if (subscriptions.data.length > 0) {
              stripeVerified = true
              stripeCustomerId = customer.id
              stripeSubscriptionId = subscriptions.data[0].id
              console.log('✅ [VERIFY-PAYMENT] Abonnement actif trouvé')
            }
          }
        }
      } catch (error: any) {
        console.error('❌ [VERIFY-PAYMENT] Erreur recherche abonnement:', error.message)
      }
    }

    // Si le paiement est vérifié, activer le profil
    if (stripeVerified) {
      console.log('🔄 [VERIFY-PAYMENT] Activation du profil...')
      
      const updateData = {
        is_verified: true,
        is_subscribed: true,
        subscription_start: profile.subscription_start || new Date().toISOString(),
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId
      }

      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update(updateData)
        .eq('user_id', user_id)

      if (updateError) {
        console.error('❌ [VERIFY-PAYMENT] Erreur mise à jour:', updateError)
        return NextResponse.json({
          error: 'Erreur lors de la mise à jour du profil',
          details: updateError.message
        }, { status: 500 })
      }

      console.log('✅ [VERIFY-PAYMENT] Profil activé avec succès')
      
      return NextResponse.json({
        verified: true,
        subscribed: true,
        message: 'Profil activé avec succès',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId
      })
    }

    // Aucun paiement trouvé
    console.log('⚠️ [VERIFY-PAYMENT] Aucun paiement vérifié')
    return NextResponse.json({
      verified: false,
      subscribed: false,
      message: 'Aucun paiement vérifié trouvé'
    })

  } catch (error: any) {
    console.error('❌ [VERIFY-PAYMENT] Error:', error)
    return NextResponse.json({
      error: 'Erreur serveur',
      message: error.message
    }, { status: 500 })
  }
}
