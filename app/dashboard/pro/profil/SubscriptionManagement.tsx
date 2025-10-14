'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { supabase } from '@/lib/supabaseClient'
import { ExternalLink, CreditCard, AlertCircle, Loader2 } from 'lucide-react'

const STRIPE_PORTAL_URL = 'https://billing.stripe.com/p/login/6oU6oIdjUdUw52A32T5ZC00'

interface SubscriptionManagementProps {
  className?: string
}

export default function SubscriptionManagement({ className = '' }: SubscriptionManagementProps) {
  const { user, profile, loading: userLoading } = useUser()
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Vérifier le statut d'abonnement
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user || !profile?.profile) {
        setHasActiveSubscription(null)
        return
      }

      try {
        setError(null)

        // Vérifier d'abord si la colonne has_active_subscription existe
        // Sinon utiliser stripe_customer_id comme fallback
        const proProfile = profile.profile

        // Logique temporaire : si stripe_customer_id existe, on considère qu'il y a un abonnement
        // TODO: Remplacer par has_active_subscription une fois la colonne ajoutée
        const hasSubscription = proProfile.stripe_customer_id && proProfile.stripe_customer_id.trim() !== ''

        setHasActiveSubscription(hasSubscription)

      } catch (err) {
        console.error('Error checking subscription status:', err)
        setError('Erreur lors de la vérification du statut d\'abonnement')
        setHasActiveSubscription(false)
      }
    }

    if (!userLoading && user && profile) {
      checkSubscriptionStatus()
    }
  }, [user, profile, userLoading])

  const handleManageSubscription = async () => {
    try {
      setSubscriptionLoading(true)
      setError(null)

      // Ouvrir le portail Stripe dans un nouvel onglet
      window.open(STRIPE_PORTAL_URL, '_blank', 'noopener,noreferrer')

    } catch (err) {
      console.error('Error opening Stripe portal:', err)
      setError('Erreur lors de l\'ouverture du portail Stripe')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  // Loading state
  if (userLoading || hasActiveSubscription === null) {
    return (
      <div className={`bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF5757]" />
          <span className="ml-3 text-[#6b7280]">Vérification du statut d'abonnement...</span>
        </div>
      </div>
    )
  }

  // Erreur
  if (error) {
    return (
      <div className={`bg-white rounded-xl border border-[#fee2e2] shadow-sm p-6 ${className}`}>
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-[#fee2e2] rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#111827] mb-2">Erreur</h3>
            <p className="text-[#6b7280] mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-[#FF5757] hover:text-[#e04a4a] transition-colors duration-150"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Pas d'abonnement actif
  if (!hasActiveSubscription) {
    return (
      <div className={`bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 ${className}`}>
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-[#fef3c7] rounded-lg flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-[#f59e0b]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#111827] mb-2">
              Abonnement
            </h3>
            <p className="text-[#6b7280] mb-4">
              Vous n'avez pas encore d'abonnement actif.
            </p>
            <a
              href="/abonnement"
              className="inline-flex items-center px-4 py-2 bg-[#FF5757] text-white text-sm font-medium rounded-lg hover:bg-[#e04a4a] transition-colors duration-150"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Choisir un abonnement
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Abonnement actif
  return (
    <div className={`bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 bg-[#dcfce7] rounded-lg flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-[#16a34a]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            Gérer votre abonnement
          </h3>
          <p className="text-[#6b7280] mb-4">
            Gérez vos informations de facturation, téléchargez vos factures et modifiez votre plan d'abonnement.
          </p>
          <button
            onClick={handleManageSubscription}
            disabled={subscriptionLoading}
            className="inline-flex items-center px-6 py-3 bg-[#FF5757] text-white text-base font-medium rounded-lg hover:bg-[#e04a4a] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {subscriptionLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ouverture...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Gérer mon abonnement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}




