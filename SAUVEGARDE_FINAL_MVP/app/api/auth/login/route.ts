import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Créer un client Supabase avec le service role pour les opérations admin
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Fonction pour traiter la réponse de login
async function processLoginResponse(authData: any, userRow: any) {
  // 1. Vérifier is_verified pour les professionnels
  if (userRow.role === 'PRO') {
    const { data: proProfile, error: proError } = await supabase
      .from('pro_profiles')
      .select('is_verified, is_subscribed')
      .eq('user_id', authData.user.id)
      .single()

    if (proError || !proProfile) {
      return NextResponse.json({ error: 'Profil professionnel non trouvé' }, { status: 400 })
    }

    // Si le professionnel n'est pas vérifié, retourner un indicateur spécial
    if (!proProfile.is_verified || !proProfile.is_subscribed) {
      return NextResponse.json({
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: userRow.role,
        },
        session: authData.session,
        requiresPayment: true, // Indicateur pour redirection vers paiement
      })
    }
  }

  // 2. Retourner l'utilisateur + rôle (vérifié ou non-PRO)
  return NextResponse.json({
    user: {
      id: authData.user.id,
      email: authData.user.email,
      role: userRow.role,
    },
    session: authData.session, // pour accéder au token si besoin
  })
}

export async function POST(req: Request) {
  const { email, password } = await req.json()

  // Vérifier que supabase est bien configuré
  if (!supabase) {
    return NextResponse.json({ error: 'Erreur de configuration Supabase' }, { status: 500 })
  }

  // 1. Vérifier d'abord si l'utilisateur existe dans la table users
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (userError || !userRow) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }

  // 2. Essayer l'authentification via Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // 3. Si l'authentification échoue, retourner l'erreur
  if (authError) {
    console.log('❌ Erreur d\'authentification:', authError.message)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  // 4. Traiter la réponse de login
  return await processLoginResponse(authData, userRow)
}
