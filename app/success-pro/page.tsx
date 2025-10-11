'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import confetti from 'canvas-confetti'

export default function SuccessProPage() {
  const [userInfo, setUserInfo] = useState<{ prenom?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('Vérification de votre paiement...')
  const [isBackendReady, setIsBackendReady] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Afficher la page de succès et vérifier que le webhook a bien mis à jour les données
    const showSuccessPage = async () => {
      try {
        // Vérifier que supabase est initialisé
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
        console.log('🎉 Paiement validé par Stripe - Vérification du statut en cours')

        // Récupérer les informations du profil
        const response = await fetch('/api/profile')
        const data = await response.json()
        
        if (data.profile) {
          setUserInfo({
            prenom: data.profile.prenom || 'Professionnel'
          })
        }

        // Afficher immédiatement la page de succès
        setLoading(false)

        // Récupérer le session_id de Stripe depuis l'URL
        const urlParams = new URLSearchParams(window.location.search)
        const stripeSessionId = urlParams.get('session_id')
        console.log('📋 Stripe Session ID:', stripeSessionId)

        // 🧭 SYSTÈME DE VÉRIFICATION HYBRIDE : WEBHOOK + FALLBACK
        
        // D'abord, vérifier si le webhook a déjà fait le travail
        const checkWebhookStatus = async () => {
          try {
            console.log('🛰️ [CHECK] Vérification si le webhook a déjà mis à jour le profil...')
            
            if (!supabase) {
              console.error('❌ [CHECK] Supabase client non initialisé')
              return false
            }
            
            const { data: proProfile, error } = await supabase
              .from('pro_profiles')
              .select('is_verified, is_subscribed')
              .eq('user_id', session.user.id)
              .single()
            
            if (!error && proProfile) {
              console.log('📊 [CHECK] Statut profil:', proProfile)
              if (proProfile.is_verified && proProfile.is_subscribed) {
                console.log('✅ [CHECK] Webhook a déjà activé le profil !')
                return true
              }
            }
            
            return false
          } catch (error) {
            console.error('⚠️ [CHECK] Erreur vérification webhook:', error)
            return false
          }
        }
        
        // Fonction de polling intelligent (donne priorité au webhook)
        const smartPolling = async () => {
          const maxAttempts = 10 // 10 secondes max
          let attempts = 0
          
          while (attempts < maxAttempts) {
            attempts++
            console.log(`🔄 [POLLING] Tentative ${attempts}/${maxAttempts}`)
            
            // Vérifier si le webhook a fait son travail
            const webhookDone = await checkWebhookStatus()
            
            if (webhookDone) {
              console.log('✅ [POLLING] Webhook a réussi ! Profil activé.')
              setStatusMessage('Abonnement activé ! Vous pouvez maintenant accéder à votre dashboard.')
              setIsBackendReady(true)
              setShowConfetti(true)
              
              setTimeout(() => {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#f86f4d', '#ff6b35', '#ffa726', '#66bb6a', '#42a5f5']
                })
              }, 200)
              
              return true
            }
            
            // Après 3 secondes, activer le fallback manuel
            if (attempts === 3) {
              console.log('🧭 [FALLBACK] Webhook lent, activation du fallback manuel...')
              setStatusMessage('Vérification directe avec Stripe...')
              
              try {
                const response = await fetch('/api/auth/verify-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    user_id: session.user.id,
                    session_id: stripeSessionId
                  })
                })

                const result = await response.json()
                console.log('🧭 [FALLBACK] Résultat:', result)

                if (result.verified && result.subscribed) {
                  console.log('✅ [FALLBACK] Profil activé via fallback !')
                  setStatusMessage('Abonnement activé ! Vous pouvez maintenant accéder à votre dashboard.')
                  setIsBackendReady(true)
                  setShowConfetti(true)
                  
                  setTimeout(() => {
                    confetti({
                      particleCount: 100,
                      spread: 70,
                      origin: { y: 0.6 },
                      colors: ['#f86f4d', '#ff6b35', '#ffa726', '#66bb6a', '#42a5f5']
                    })
                  }, 200)
                  
                  return true
                }
              } catch (error) {
                console.error('❌ [FALLBACK] Erreur fallback:', error)
              }
            }
            
            // Attendre 1 seconde avant la prochaine tentative
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
          return false
        }

        // Lancer le polling intelligent
        const success = await smartPolling()
        
        if (!success) {
          // En cas d'échec complet, rediriger vers signup
          console.error('❌ Impossible de vérifier le paiement après toutes les tentatives')
          setStatusMessage('Erreur lors de l\'activation...')
          setTimeout(() => {
            router.push('/signup?error=verification_failed')
          }, 2000)
        }

      } catch (error) {
        console.error('❌ Erreur lors de l\'affichage de la page de succès:', error)
        setLoading(false)
        // En cas d'erreur, rediriger quand même après quelques secondes
        setTimeout(() => {
          router.push('/dashboard/pro')
        }, 3000)
      }
    }

    showSuccessPage()
  }, [router])

  const handleGoToDashboard = () => {
    if (isBackendReady) {
      router.push('/dashboard/pro')
    }
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
            disabled={!isBackendReady}
            className={`w-full py-3 px-4 min-h-[44px] rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 text-base ${
              isBackendReady
                ? 'bg-[#f86f4d] text-white hover:bg-[#fa8265] focus:ring-[#f86f4d] cursor-pointer'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {isBackendReady ? 'Accéder à mon tableau de bord Pro' : 'Vérification en cours...'}
          </button>

          {/* Message d'information avec statut dynamique */}
          <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
            <div className="flex items-center justify-center space-x-2 mb-3">
              {!isBackendReady ? (
                <div className="w-4 h-4 border-2 border-[#f86f4d] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <p className={`text-sm font-medium ${isBackendReady ? 'text-green-600' : 'text-[#f86f4d]'}`}>
                {statusMessage}
              </p>
            </div>
            <p className="text-xs text-[#9ca3af]">
              {isBackendReady 
                ? 'Tout est prêt ! Vous pouvez maintenant accéder à votre dashboard.'
                : 'Nous vérifions que votre paiement a bien été pris en compte.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}