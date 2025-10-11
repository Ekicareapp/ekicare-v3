import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['stripe'],
  },
  
  // CRITIQUE : Désactiver le parsing automatique du body pour les webhooks
  api: {
    bodyParser: false,
  },
  
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