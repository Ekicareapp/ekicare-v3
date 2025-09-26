import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  // Vérifier que supabase est bien configuré
  if (!supabase) {
    return NextResponse.json({ error: 'Erreur de configuration Supabase' }, { status: 500 })
  }

  // 1. Authentification via Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  // 2. Récupérer le rôle depuis la table public.users
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (userError || !userRow) {
    return NextResponse.json({ error: 'Profil non trouvé dans users' }, { status: 400 })
  }

  // 🚧 MODE DÉVELOPPEMENT - DÉSACTIVATION TEMPORAIRE DES VÉRIFICATIONS DE PAIEMENT
  const DEV_MODE = process.env.NODE_ENV === 'development'

  // 3. Vérifier is_verified pour les professionnels
  if (userRow.role === 'PRO' && !DEV_MODE) {
    const { data: proProfile, error: proError } = await supabase
      .from('pro_profiles')
      .select('is_verified')
      .eq('user_id', authData.user.id)
      .single()

    if (proError || !proProfile) {
      return NextResponse.json({ error: 'Profil professionnel non trouvé' }, { status: 400 })
    }

    // Si le professionnel n'est pas vérifié, retourner un indicateur spécial
    if (!proProfile.is_verified) {
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

  // 🚧 MODE DÉVELOPPEMENT - BYPASS DES VÉRIFICATIONS
  if (DEV_MODE && userRow.role === 'PRO') {
    console.log('🚧 MODE DÉVELOPPEMENT: Vérifications de paiement désactivées pour les professionnels')
  }

  // 4. Retourner l'utilisateur + rôle (vérifié ou non-PRO)
  return NextResponse.json({
    user: {
      id: authData.user.id,
      email: authData.user.email,
      role: userRow.role,
    },
    session: authData.session, // pour accéder au token si besoin
  })
}
