'use client'

import { ExternalLink } from 'lucide-react'

const STRIPE_PORTAL_URL = 'https://billing.stripe.com/p/login/6oU6oIdjUdUw52A32T5ZC00'

interface ManageSubscriptionLinkProps {
  className?: string
}

export default function ManageSubscriptionLink({ className = '' }: ManageSubscriptionLinkProps) {
  const handleClick = () => {
    window.open(STRIPE_PORTAL_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-[#FF5757] font-medium hover:opacity-80 transition-opacity duration-150 ${className}`}
    >
      <span>Gérer mon abonnement</span>
      <ExternalLink className="w-4 h-4" />
    </button>
  )
}


