"use client"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Erreur de déconnexion:", error.message)
      return
    }
    router.push("/login")
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
    >
      Déconnexion
    </button>
  )
}
