import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    // Authentification
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un professionnel
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .limit(1)

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    if (users[0].role !== 'PRO') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Mettre à jour le profil professionnel avec is_verified = true
    const { error: updateError } = await supabase
      .from('pro_profiles')
      .update({ is_verified: true })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating pro_profiles:', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
