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
    // Vérifier le statut de paiement et rediriger quand c'est prêt
    const checkPaymentStatusAndRedirect = async () => {
      try {
        if (!supabase) {
          router.push('/login')
          return
        }
        
        // Vérifier la session Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error('❌ Aucune session active, redirection vers login')
          router.push('/login')
          return
        }

        console.log('✅ Session active trouvée:', session.user.email)
        console.log('🎉 Paiement validé par Stripe - Vérification du statut en cours...')

        // Récupérer les informations du profil
        const response = await fetch('/api/profile')
        const data = await response.json()
        
        if (data.profile) {
          setUserInfo({
            prenom: data.profile.prenom || 'Professionnel'
          })
        }

        // Afficher la page de succès
        setLoading(false)

        // Déclencher les confettis
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f86f4d', '#ff6b35', '#ffa726', '#66bb6a', '#42a5f5']
          })
        }, 500)

        // Vérifier le statut de paiement avec retry
        await waitForPaymentConfirmation()

      } catch (error) {
        console.error('❌ Erreur lors de la vérification du statut:', error)
        setLoading(false)
      }
    }

    // Fonction pour attendre la confirmation de paiement
    const waitForPaymentConfirmation = async (retryCount = 0) => {
      const maxRetries = 15 // 15 tentatives = 30 secondes max
      
      try {
        console.log(`🔍 Vérification du statut de paiement (tentative ${retryCount + 1}/${maxRetries + 1})`)
        
        const response = await fetch('/api/profile')
        const data = await response.json()
        
        if (data.profile) {
          const isVerified = data.profile.is_verified === true
          const isSubscribed = data.profile.is_subscribed === true
          
          console.log('📊 Statut actuel:', { isVerified, isSubscribed })
          
          if (isVerified && isSubscribed) {
            console.log('✅ Paiement confirmé ! Redirection vers le dashboard')
            router.push('/dashboard/pro')
            return
          }
        }
        
        if (retryCount < maxRetries) {
          console.log(`⏳ Paiement pas encore confirmé, retry dans 2 secondes... (${retryCount + 1}/${maxRetries})`)
          setTimeout(() => waitForPaymentConfirmation(retryCount + 1), 2000)
        } else {
          console.log('❌ Timeout: Le paiement n\'a pas été confirmé dans les temps')
          // Optionnel: rediriger vers le dashboard quand même, ou afficher un message d'erreur
          console.log('🔄 Redirection vers le dashboard (le webhook pourrait être en retard)')
          router.push('/dashboard/pro')
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error)
        if (retryCount < maxRetries) {
          setTimeout(() => waitForPaymentConfirmation(retryCount + 1), 2000)
        } else {
          router.push('/dashboard/pro')
        }
      }
    }

    checkPaymentStatusAndRedirect()
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
            Votre abonnement professionnel est maintenant actif et validé.
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
              Votre paiement a été validé par Stripe. Nous vérifions votre abonnement...
            </p>
            <p className="text-xs text-[#f86f4d] font-medium">
              Vérification en cours... Redirection automatique dès confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
