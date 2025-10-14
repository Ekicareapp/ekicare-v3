import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
    if (!token) return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const userId = user.id

    try {
      await admin.storage.from('pro_photo').remove([`${userId}/profile.jpg`])
      await admin.storage.from('pro_justificatifs').remove([`${userId}/justificatif.pdf`])
    } catch {}

    await admin.from('pro_profiles').delete().eq('user_id', userId)
    await admin.from('proprio_profiles').delete().eq('user_id', userId)
    await admin.from('users').delete().eq('id', userId)

    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: error.message || 'Erreur suppression Auth' }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 })
  }
}


