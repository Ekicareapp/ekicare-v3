'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PaiementRequisPage() {
  const [userInfo, setUserInfo] = useState<{ prenom?: string; email?: string; id?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Récupérer les informations du professionnel
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/profile')
        const data = await response.json()
        
        if (data.profile) {
          setUserInfo({
            prenom: data.profile.prenom || 'Professionnel',
            email: data.email,
            id: data.id
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
  }, [])

  const handleGoToPayment = async () => {
    try {
      console.log('💳 Début du processus de paiement pour user:', userInfo?.id)
      
      const response = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userInfo?.id
        })
      })
      
      const data = await response.json()
      
      if (data.url) {
        console.log('✅ URL Stripe reçue, redirection...')
        window.location.href = data.url
      } else {
        console.error('❌ Erreur Stripe:', data.error)
        
        // Messages d'erreur plus détaillés
        let errorMessage = 'Erreur lors de la redirection vers Stripe'
        if (data.error) {
          if (data.error.includes('Configuration Stripe manquante')) {
            errorMessage = 'Configuration Stripe manquante. Veuillez contacter le support.'
          } else if (data.error.includes('User ID requis')) {
            errorMessage = 'Erreur de session. Veuillez vous reconnecter.'
          } else {
            errorMessage = data.error
          }
        }
        
        alert(errorMessage)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de la session de paiement:', error)
      alert('Erreur de connexion. Vérifiez votre connexion internet et réessayez.')
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      if (response.ok) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      router.push('/login')
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
        {/* Card de paiement requis */}
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-6 sm:p-8 text-center shadow-sm">
          {/* Icône d'information */}
          <div className="w-16 h-16 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Titre principal */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-4">
            Paiement requis
          </h1>

          {/* Texte secondaire */}
          <p className="text-sm sm:text-base text-[#6b7280] mb-8 leading-relaxed">
            Bonjour {userInfo?.prenom}, votre compte professionnel nécessite une vérification et un abonnement pour accéder au tableau de bord.
          </p>

          {/* Informations sur l'abonnement */}
          <div className="bg-[#f9fafb] rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-[#111827] mb-2">Votre abonnement professionnel inclut :</h3>
            <ul className="text-sm text-[#6b7280] space-y-1">
              <li>• Accès complet au tableau de bord</li>
              <li>• Gestion de vos rendez-vous</li>
              <li>• Profil professionnel visible</li>
              <li>• Support client prioritaire</li>
            </ul>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <button
              onClick={handleGoToPayment}
              className="w-full bg-[#f86f4d] text-white py-3 px-4 min-h-[44px] rounded-lg font-medium hover:bg-[#fa8265] focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:ring-offset-2 transition-all duration-150 text-base"
            >
              Procéder au paiement
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 min-h-[44px] rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-150 text-base"
            >
              Se déconnecter
            </button>
          </div>

          {/* Message d'information */}
          <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
            <p className="text-xs text-[#9ca3af]">
              Une fois le paiement effectué, vous recevrez un email de confirmation et pourrez accéder à votre tableau de bord.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
