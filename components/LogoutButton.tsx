"use client"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { LogOut } from "lucide-react"

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    if (!supabase) {
      router.push("/login")
      return
    }
    
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
      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-200"
    >
      <LogOut className="h-4 w-4" />
      <span>Déconnexion</span>
    </button>
  )
}
