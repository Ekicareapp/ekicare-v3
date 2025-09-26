import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
  // Authentification
  if (!supabase) {
    return NextResponse.json(
      { error: 'Internal server error: supabase client not initialized' },
      { status: 500 }
    )
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Récupérer le user dans la table users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .limit(1)
  if (usersError || !users || users.length === 0) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }
  const userRow = users[0]
  let profile = null
  if (userRow.role === 'PROPRIETAIRE') {
    const { data: proprio, error: proprioError } = await supabase
      .from('proprio_profiles')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
    if (proprioError || !proprio || proprio.length === 0) {
      return NextResponse.json({ error: 'Profil propriétaire non trouvé' }, { status: 404 })
    }
    profile = proprio[0]
  } else if (userRow.role === 'PRO') {
    const { data: pro, error: proError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
    if (proError || !pro || pro.length === 0) {
      return NextResponse.json({ error: 'Profil pro non trouvé' }, { status: 404 })
    }
    profile = pro[0]
  }
  return NextResponse.json({
    id: userRow.id,
    email: userRow.email,
    role: userRow.role,
    profile,
  })
}

export async function PATCH(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Internal server error: supabase client not initialized' },
      { status: 500 }
    )
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Récupérer le user dans la table users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .limit(1)
  if (usersError || !users || users.length === 0) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }
  const role = users[0].role
  const body = await request.json()
  let allowedFields: string[] = []
  let table = ''
  if (role === 'PROPRIETAIRE') {
    allowedFields = ['prenom', 'nom', 'telephone', 'adresse']
    table = 'proprio_profiles'
  } else if (role === 'PRO') {
    allowedFields = [
      'prenom',
      'nom',
      'telephone',
      'profession',
      'ville_nom',
      'ville_lat',
      'ville_lng',
      'rayon_km',
      'siret',
      'photo_url',
      'bio',
      'experience_years',
      'price_range',
      'payment_methods',
    ]
    table = 'pro_profiles'
    if ('justificatif_url' in body) {
      return NextResponse.json(
        { error: 'Modification du justificatif non autorisée' },
        { status: 403 }
      )
    }
  } else {
    return NextResponse.json({ error: 'Rôle inconnu' }, { status: 400 })
  }
  // Filtrer les champs autorisés
  const updateData: any = {}
  for (const key of allowedFields) {
    if (key in body) updateData[key] = body[key]
  }
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from(table)
    .update(updateData)
    .eq('user_id', user.id)
    .select('*')
    .limit(1)
  if (error || !data || data.length === 0) {
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
  return NextResponse.json({ success: true, profile: data[0] })
}
