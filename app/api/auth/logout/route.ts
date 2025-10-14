import { NextResponse } from 'next/server'

export async function POST() {
  // Application sans cookies: rien à invalider côté serveur.
  // On retourne simplement un succès pour confirmer la déconnexion côté client.
  return NextResponse.json({ success: true })
}
