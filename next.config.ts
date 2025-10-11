import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Configuration moderne Next.js 15
  serverExternalPackages: ['stripe'],
  
  // Configuration pour les webhooks Stripe
  async headers() {
    return [
      {
        source: '/api/stripe/webhook',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'stripe-signature, content-type',
          },
        ],
      },
    ]
  },
  
}

export default nextConfig