import { NextRequest, NextResponse } from 'next/server'

// Version de test ultra-simple pour identifier le problème
export async function POST(request: NextRequest) {
  console.log('🚀 [WEBHOOK-TEST] Début de la fonction')
  
  try {
    console.log('🚀 [WEBHOOK-TEST] Fonction démarrée')
    
    // Test 1: Vérifier les headers
    const userAgent = request.headers.get('user-agent')
    console.log('🚀 [WEBHOOK-TEST] User-Agent:', userAgent)
    
    // Test 2: Vérifier la signature
    const signature = request.headers.get('stripe-signature')
    console.log('🚀 [WEBHOOK-TEST] Signature présente:', !!signature)
    
    // Test 3: Récupérer le body
    const body = await request.text()
    console.log('🚀 [WEBHOOK-TEST] Body length:', body.length)
    console.log('🚀 [WEBHOOK-TEST] Body preview:', body.substring(0, 100))
    
    // Test 4: Vérifier les variables d'environnement
    console.log('🚀 [WEBHOOK-TEST] STRIPE_WEBHOOK_SECRET présent:', !!process.env.STRIPE_WEBHOOK_SECRET)
    console.log('🚀 [WEBHOOK-TEST] SUPABASE_SERVICE_ROLE_KEY présent:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook test réussi',
      bodyLength: body.length,
      hasSignature: !!signature,
      userAgent: userAgent
    })
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK-TEST] Erreur:', error.message)
    return NextResponse.json({ 
      error: 'Test failed',
      message: error.message 
    }, { status: 500 })
  }
}
