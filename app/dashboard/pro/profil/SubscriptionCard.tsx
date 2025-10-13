'use client'

import { ExternalLink } from 'lucide-react'

const STRIPE_PORTAL_URL = 'https://billing.stripe.com/p/login/6oU6oIdjUdUw52A32T5ZC00'

interface SubscriptionCardProps {
  className?: string
}

export default function SubscriptionCard({ className = '' }: SubscriptionCardProps) {
  const handleClick = () => {
    window.open(STRIPE_PORTAL_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5 ${className}`}>
      <h2 className="text-lg font-semibold text-[#111827] mb-2">
        Abonnement
      </h2>
      
      <p className="text-sm text-[#6b7280] mb-4">
        Accédez à votre espace de gestion d'abonnement pour modifier ou résilier votre formule.
      </p>
      
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 text-[#FF5757] font-medium hover:opacity-80 transition-opacity duration-200"
      >
        <span>Gérer mon abonnement</span>
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  )
}

