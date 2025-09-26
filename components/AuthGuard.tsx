'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface AuthGuardProps {
  children: React.ReactNode
}

// 🚧 MODE DÉVELOPPEMENT - DÉSACTIVATION TEMPORAIRE DE L'AUTHENTIFICATION
const DEV_MODE = process.env.NODE_ENV === 'development'

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 🚧 MODE DÉVELOPPEMENT - BYPASS DE L'AUTHENTIFICATION
    if (DEV_MODE) {
      console.log('🚧 MODE DÉVELOPPEMENT: AuthGuard désactivé - Accès libre aux dashboards')
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }

    const checkAuth = async () => {
      try {
        // Vérifier la session actuelle
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erreur lors de la vérification de la session:', error)
          router.push('/login')
          return
        }

        if (!session) {
          console.log('🔒 Aucune session active, redirection vers /login')
          router.push('/login')
          return
        }

        console.log('✅ Session valide trouvée:', session.user.email)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        console.log('🔒 Déconnexion détectée, redirection vers /login')
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#f86f4d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Le composant sera redirigé vers /login
  }

  return <>{children}</>
}
