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
  const [statusMessage, setStatusMessage] = useState('')
  const router = useRouter()

  const messages = [
    "🎉 Félicitations ! Votre paiement a été validé",
    "🔧 On prépare votre compte professionnel...",
    "✨ Configuration de votre profil...",
    "🚀 Vous allez adorer Ekicare !",
    "💫 Finalisation des derniers réglages...",
    "🎯 Votre tableau de bord est presque prêt !",
    "🌟 Bienvenue dans l'écosystème Ekicare !"
  ]

  // Rotation des messages toutes les 2 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Vérification du statut d'activation
  useEffect(() => {
    const checkActivationStatus = async () => {
      try {
        // Récupérer la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error('❌ Session manquante:', sessionError)
          setStatusMessage('Redirection vers la connexion...')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        setStatusMessage('Vérification de votre abonnement...')

        // Vérifier le profil professionnel
        const { data: profile, error: profileError } = await supabase
          .from('pro_profiles')
          .select('is_verified, is_subscribed')
          .eq('user_id', session.user.id)
          .single()

        if (profileError) {
          console.error('❌ Erreur profil:', profileError)
          setStatusMessage('Erreur lors de la vérification...')
          setTimeout(() => router.push('/signup'), 3000)
          return
        }

        if (profile.is_verified && profile.is_subscribed) {
          setStatusMessage('🎉 Activation réussie ! Redirection...')
          setTimeout(() => router.push('/dashboard/pro'), 2000)
        } else {
          // Tentative de vérification manuelle
          setStatusMessage('Vérification avec Stripe...')
          
          const verificationResponse = await fetch('/api/auth/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: session.user.id })
          })

          if (verificationResponse.ok) {
            const verificationData = await verificationResponse.json()
            if (verificationData.success) {
              setStatusMessage('✅ Paiement confirmé ! Activation...')
              setTimeout(() => router.push('/dashboard/pro'), 2000)
              return
            }
          }

          // Si tout échoue, rediriger vers le tableau de bord quand même
          setStatusMessage('Redirection vers votre tableau de bord...')
          setTimeout(() => router.push('/dashboard/pro'), 3000)
        }
      } catch (error) {
        console.error('❌ Erreur activation:', error)
        setStatusMessage('Redirection automatique...')
        setTimeout(() => router.push('/dashboard/pro'), 2000)
      }
    }

    // Délai avant de commencer la vérification
    setTimeout(checkActivationStatus, 3000)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f86f4d] via-[#fa8265] to-[#f86f4d] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Card principale */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center shadow-2xl">
          {/* Logo Ekicare animé */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-[#f86f4d] to-[#fa8265] rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-2xl font-bold text-white">E</span>
          </div>

          {/* Message principal */}
          <h1 className="text-2xl font-bold text-[#111827] mb-4">
            Activation en cours
          </h1>

          {/* Message rotatif */}
          <div className="h-16 flex items-center justify-center mb-6">
            <p className="text-lg text-[#6b7280] animate-fade-in">
              {messages[currentMessage]}
            </p>
          </div>

          {/* Barre de progression animée */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#f86f4d] to-[#fa8265] rounded-full animate-progress"></div>
          </div>

          {/* Points de chargement */}
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-[#f86f4d] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#f86f4d] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-[#f86f4d] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>

          {/* Message de statut */}
          {statusMessage && (
            <p className="text-sm text-[#6b7280] animate-fade-in">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Messages d'encouragement en bas */}
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm">
            Merci de votre patience pendant l'activation
          </p>
          <p className="text-white/60 text-xs mt-2">
            Votre expérience professionnelle commence maintenant !
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
        
        .animate-progress {
          animation: progress 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
