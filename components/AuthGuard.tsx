'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        // Vérifier que supabase est initialisé
        if (!supabase) {
          setLoading(false)
          return
        }

        // Vérifier la session actuelle
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erreur lors de la vérification de la session:', error)
          if (mounted) {
            setIsAuthenticated(false)
            setIsLoading(false)
          }
          return
        }

        if (!session) {
          console.log('🔒 Aucune session active')
          if (mounted) {
            setIsAuthenticated(false)
            setIsLoading(false)
          }
          return
        }

        // Vérifier que l'utilisateur a un profil dans la base de données
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (userError || !userRow) {
          console.error('Profil utilisateur non trouvé')
          if (mounted) {
            setIsAuthenticated(false)
            setIsLoading(false)
          }
          return
        }

        console.log('✅ Session valide trouvée:', session.user.email, 'Rôle:', userRow.role)
        if (mounted) {
          setIsAuthenticated(true)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error)
        if (mounted) {
          setIsAuthenticated(false)
          setIsLoading(false)
        }
      }
    }

    // Délai pour laisser le temps à la session de s'établir
    const timeoutId = setTimeout(checkAuth, 100)

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Changement d\'authentification:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ Connexion détectée, mise à jour de l\'état')
        if (mounted) {
          setIsAuthenticated(true)
          setIsLoading(false)
        }
      } else if (event === 'SIGNED_OUT' || !session) {
        console.log('🔒 Déconnexion détectée')
        if (mounted) {
          setIsAuthenticated(false)
          setIsLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [router, pathname])

  // Si on est sur une page publique, ne pas bloquer
  if (pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/success') || pathname.includes('/paiement-requis')) {
    return <>{children}</>
  }

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

  // Si l'utilisateur n'est pas authentifié, rediriger vers login
  if (!isAuthenticated && !isLoading) {
    console.log('🔒 Utilisateur non authentifié, redirection vers /login')
    // Éviter les redirections multiples
    if (pathname !== '/login') {
      router.push('/login')
    }
    return null
  }

  // Si l'utilisateur est authentifié, afficher le contenu
  if (isAuthenticated) {
    console.log('✅ Utilisateur authentifié, accès autorisé')
  }

  return <>{children}</>
}
