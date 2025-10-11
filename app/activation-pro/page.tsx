'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ActivationProPage() {
  const [currentMessage, setCurrentMessage] = useState(0)
  const router = useRouter()

  const messages = [
    "Configuration de votre compte...",
    "Vérification de votre abonnement...",
    "Finalisation en cours...",
    "Redirection vers votre tableau de bord..."
  ]

  // Rotation des messages toutes les 1.5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // Vérification rapide du statut (max 8 secondes)
  useEffect(() => {
    const checkActivationStatus = async () => {
      try {
        // Récupérer la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error('❌ Session manquante:', sessionError)
          router.push('/login')
          return
        }

        // Vérification rapide du profil (3 tentatives max)
        let attempts = 0
        const maxAttempts = 3

        const checkProfile = async () => {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('pro_profiles')
              .select('is_verified, is_subscribed')
              .eq('user_id', session.user.id)
              .single()

            if (profileError) {
              console.error('❌ Erreur profil:', profileError)
              return false
            }

            return profile.is_verified && profile.is_subscribed
          } catch (error) {
            console.error('❌ Erreur vérification:', error)
            return false
          }
        }

        // Boucle de vérification rapide
        const quickCheck = async () => {
          while (attempts < maxAttempts) {
            const isActive = await checkProfile()
            
            if (isActive) {
              console.log('✅ Compte activé ! Redirection...')
              router.push('/dashboard/pro')
              return
            }
            
            attempts++
            console.log(`🔍 Tentative ${attempts}/${maxAttempts} - Compte pas encore activé`)
            await new Promise(resolve => setTimeout(resolve, 2000)) // 2s entre chaque tentative
          }

          // Si pas activé après 6 secondes, tentative de vérification manuelle
          console.log('🔄 Vérification manuelle avec Stripe...')
          try {
            const response = await fetch('/api/auth/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: session.user.id })
            })

            if (response.ok) {
              const data = await response.json()
              if (data.success) {
                console.log('✅ Paiement confirmé manuellement !')
                router.push('/dashboard/pro')
                return
              }
            }
          } catch (error) {
            console.error('❌ Erreur vérification manuelle:', error)
          }

          // Si le paiement n'est pas confirmé, rediriger vers signup avec popup
          console.log('❌ Paiement non confirmé - Redirection vers signup...')
          router.push('/signup?error=payment_failed')
        }

        // Délai initial de 2 secondes puis vérification
        setTimeout(quickCheck, 2000)

      } catch (error) {
        console.error('❌ Erreur activation:', error)
        router.push('/signup?error=activation_failed')
      }
    }

    checkActivationStatus()
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Logo simple */}
        <div className="w-16 h-16 mx-auto mb-6 bg-[#f86f4d] rounded-lg flex items-center justify-center">
          <span className="text-2xl font-bold text-white">E</span>
        </div>

        {/* Titre */}
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Activation de votre compte
        </h1>

        {/* Message rotatif */}
        <div className="h-12 flex items-center justify-center mb-6">
          <p className="text-gray-600">
            {messages[currentMessage]}
          </p>
        </div>

        {/* Barre de progression simple */}
        <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
          <div className="h-1 bg-[#f86f4d] rounded-full animate-pulse" style={{width: '70%'}}></div>
        </div>

        {/* Point de chargement */}
        <div className="flex justify-center">
          <div className="w-2 h-2 bg-[#f86f4d] rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}