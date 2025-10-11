'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import confetti from 'canvas-confetti'

export default function SuccessProPage() {
  const [userInfo, setUserInfo] = useState<{ prenom?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('Vérification de votre paiement...')
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

        // Déclencher les confettis immédiatement
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f86f4d', '#ff6b35', '#ffa726', '#66bb6a', '#42a5f5']
          })
        }, 500)

        // Récupérer le session_id de Stripe depuis l'URL
        const urlParams = new URLSearchParams(window.location.search)
        const stripeSessionId = urlParams.get('session_id')
        console.log('📋 Stripe Session ID:', stripeSessionId)

        // POLLING : Vérifier que le webhook a bien mis à jour is_verified et is_subscribed
        const maxAttempts = 30 // 30 tentatives (30 secondes max)
        let attempts = 0
        let isSubscriptionActive = false

        const checkSubscriptionStatus = async (): Promise<boolean> => {
          try {
            if (!supabase) {
              console.error('❌ Supabase client not available')
              return false
            }
            
            const { data: profile, error: profileError } = await supabase
              .from('pro_profiles')
              .select('is_verified, is_subscribed')
              .eq('user_id', session.user.id)
              .single()

            if (profileError) {
              console.error('❌ Erreur lors de la vérification du profil:', profileError)
              return false
            }

            const isActive = profile.is_verified === true && profile.is_subscribed === true
            console.log(`🔍 Tentative ${attempts + 1}/${maxAttempts} - is_verified: ${profile.is_verified}, is_subscribed: ${profile.is_subscribed}`)
            
            return isActive
          } catch (error) {
            console.error('❌ Erreur lors de la vérification:', error)
            return false
          }
        }

        // Fonction de secours : vérification manuelle via API
        const manualVerification = async () => {
          try {
            console.log('🔧 [FALLBACK] Tentative de vérification manuelle...')
            setStatusMessage('Vérification manuelle du paiement...')
            
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
            console.log('🔧 [FALLBACK] Résultat:', result)

            if (result.verified && result.subscribed) {
              console.log('✅ [FALLBACK] Abonnement vérifié manuellement !')
              return true
            }

            return false
          } catch (error) {
            console.error('❌ [FALLBACK] Erreur vérification manuelle:', error)
            return false
          }
        }

        // Boucle de polling avec vérification manuelle en secours
        const pollSubscriptionStatus = async () => {
          while (attempts < maxAttempts && !isSubscriptionActive) {
            isSubscriptionActive = await checkSubscriptionStatus()
            
            if (isSubscriptionActive) {
              console.log('✅ Abonnement activé ! Redirection vers le dashboard...')
              setStatusMessage('Abonnement activé ! Redirection en cours...')
              setTimeout(() => {
                router.push('/dashboard/pro')
              }, 1000)
              return
            }

            attempts++
            
            // Messages de statut progressifs
            if (attempts === 5) {
              setStatusMessage('Finalisation de votre abonnement...')
            } else if (attempts === 10) {
              setStatusMessage('Traitement du paiement en cours...')
            } else if (attempts === 8) {
              // Après 8 secondes, tenter une vérification manuelle (réduit pour meilleure UX)
              console.log('⏰ [FALLBACK] Webhook lent, tentative de vérification manuelle...')
              setStatusMessage('Vérification directe avec Stripe...')
              const manuallyVerified = await manualVerification()
              
              if (manuallyVerified) {
                // Attendre 1 seconde puis vérifier à nouveau
                await new Promise(resolve => setTimeout(resolve, 1000))
                const recheckResult = await checkSubscriptionStatus()
                if (recheckResult) {
                  isSubscriptionActive = true
                  console.log('✅ [FALLBACK] Abonnement activé manuellement !')
                  setStatusMessage('Abonnement activé ! Redirection en cours...')
                  setTimeout(() => {
                    router.push('/dashboard/pro')
                  }, 1000)
                  return
                }
              }
            } else if (attempts === 20) {
              setStatusMessage('Dernières vérifications...')
            }

            // Attendre 1 seconde avant la prochaine tentative
            await new Promise(resolve => setTimeout(resolve, 1000))
          }

          // Si on arrive ici, le timeout est dépassé
          if (!isSubscriptionActive) {
            console.warn('⚠️ Timeout dépassé après toutes les tentatives')
            setStatusMessage('Problème de synchronisation détecté. Actualisation...')
            
            // Dernière tentative de vérification manuelle
            const lastChance = await manualVerification()
            
            if (lastChance) {
              // Attendre et vérifier une dernière fois
              await new Promise(resolve => setTimeout(resolve, 2000))
              const finalCheck = await checkSubscriptionStatus()
              
              if (finalCheck) {
                console.log('✅ [FALLBACK] Abonnement finalement activé !')
                setStatusMessage('Abonnement activé ! Redirection en cours...')
                setTimeout(() => {
                  router.push('/dashboard/pro')
                }, 1000)
                return
              }
            }
            
            // En dernier recours, rediriger vers paiement-requis
            console.error('❌ Impossible de vérifier le paiement')
            setStatusMessage('Redirection vers le paiement...')
            setTimeout(() => {
              router.push('/paiement-requis?error=verification_failed')
            }, 3000)
          }
        }

        // Lancer le polling
        pollSubscriptionStatus()

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

          {/* Message d'information avec statut dynamique */}
          <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-4 h-4 border-2 border-[#f86f4d] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-[#f86f4d] font-medium">
                {statusMessage}
              </p>
            </div>
            <p className="text-xs text-[#9ca3af]">
              Nous vérifions que votre paiement a bien été pris en compte. Vous serez redirigé automatiquement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}