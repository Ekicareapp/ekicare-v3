'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import confetti from 'canvas-confetti'

export default function SuccessProPage() {
  const [userInfo, setUserInfo] = useState<{ prenom?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Déclencher les confettis au montage de la page
    const triggerConfetti = () => {
      // Premier burst de confettis
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f86f4d', '#ff6b35', '#ffa726', '#66bb6a', '#42a5f5']
      })

      // Deuxième burst après un délai
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#f86f4d', '#ff6b35', '#ffa726', '#66bb6a', '#42a5f5']
        })
      }, 300)
    }

    // Délai pour s'assurer que la page est bien montée
    const timer = setTimeout(triggerConfetti, 500)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Vérifier la session et récupérer les informations du professionnel connecté
    const fetchUserInfo = async () => {
      try {
        // Vérifier d'abord la session Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error('❌ Aucune session active, redirection vers login')
          router.push('/login')
          return
        }

        console.log('✅ Session active trouvée:', session.user.email)

        const response = await fetch('/api/profile')
        const data = await response.json()
        
        if (data.profile) {
          setUserInfo({
            prenom: data.profile.prenom || 'Professionnel'
          })
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error)
        setUserInfo({ prenom: 'Professionnel' })
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()

    // Redirection automatique vers le dashboard après 5 secondes
    const redirectTimer = setTimeout(() => {
      console.log('🔄 Redirection automatique vers le dashboard pro')
      router.push('/dashboard/pro')
    }, 5000)

    return () => clearTimeout(redirectTimer)
  }, [router])

  const handleGoToDashboard = () => {
    router.push('/dashboard/pro')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#f86f4d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-8 overflow-x-hidden">
      <div className="w-full max-w-md sm:max-w-lg">
        {/* Card de succès */}
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-6 sm:p-8 text-center shadow-sm">
          {/* Icône de succès */}
          <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Titre principal */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-4">
            Bienvenue sur Ekicare ! 🎉
          </h1>

          {/* Texte secondaire */}
          <p className="text-sm sm:text-base text-[#6b7280] mb-8 leading-relaxed">
            Votre inscription est validée et votre abonnement activé.
          </p>

          {/* Bouton CTA */}
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-[#f86f4d] text-white py-3 px-4 min-h-[44px] rounded-lg font-medium hover:bg-[#fa8265] focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:ring-offset-2 transition-all duration-150 text-base"
          >
            Accéder à mon tableau de bord Pro
          </button>

          {/* Message d'information */}
          <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
            <p className="text-xs text-[#9ca3af] mb-2">
              Votre abonnement professionnel est maintenant actif. Vous pouvez commencer à utiliser toutes les fonctionnalités.
            </p>
            <p className="text-xs text-[#f86f4d] font-medium">
              Redirection automatique vers votre tableau de bord dans 5 secondes...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
