import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint deletes the authenticated user: DB rows + storage + Auth user
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
    if (!token) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    // Authenticated client (to get user id from the token)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    const userId = user.id

    // Service role client for privileged operations
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Best-effort: remove storage folders
    try {
      await admin.storage.from('pro_photo').remove([`${userId}/profile.jpg`])
      await admin.storage.from('pro_justificatifs').remove([`${userId}/justificatif.pdf`])
    } catch {}

    // Delete profile rows first (FKs refer to user_id)
    await admin.from('pro_profiles').delete().eq('user_id', userId)
    await admin.from('proprio_profiles').delete().eq('user_id', userId)

    // Delete from public.users mirror table
    await admin.from('users').delete().eq('id', userId)

    // Finally delete Auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(userId)
    if (delErr) {
      return NextResponse.json({ error: delErr.message || 'Erreur suppression Auth' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 })
  }
}



