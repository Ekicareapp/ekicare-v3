import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurée' : '❌ Manquante',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurée' : '❌ Manquante',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurée' : '❌ Manquante',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ? '✅ Configurée' : '❌ Manquante',
    // Ne pas exposer les vraies clés pour des raisons de sécurité
    urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
  })
}
