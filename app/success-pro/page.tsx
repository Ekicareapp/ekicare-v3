'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SuccessProPage() {
  const router = useRouter()

  useEffect(() => {
    // Rediriger immédiatement vers la page d'activation
    console.log('🚀 Redirection vers la page d\'activation...')
    router.push('/activation-pro')
  }, [router])

  // Cette page ne devrait jamais s'afficher car on redirige immédiatement
  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-8">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#f86f4d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#6b7280]">Redirection en cours...</p>
      </div>
    </div>
  )
}