'use client'
import Link from 'next/link'
import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function CancelContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const status = searchParams.get('payment')
    console.log('❌ Page d\'annulation chargée avec le statut:', status)
  }, [searchParams])
  
  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 overflow-x-hidden">
      <div className="w-full max-w-md">
        {/* Card d'annulation */}
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-4 sm:p-8 text-center">
          {/* Icône d'annulation */}
          <div className="w-16 h-16 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Titre */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-4">
            Paiement annulé
          </h1>

          {/* Texte explicatif */}
          <p className="text-sm sm:text-base text-[#6b7280] mb-8 leading-relaxed">
            Le paiement a été annulé. Vous pouvez réessayer à tout moment.
          </p>

          {/* Bouton de redirection */}
          <Link
            href="/signup"
            className="inline-block w-full bg-[#f86f4d] text-white py-3 px-4 min-h-[44px] rounded-lg font-medium hover:bg-[#fa8265] focus:outline-none focus:border-[#ff6b35] transition-all duration-150 text-base"
          >
            Retour à l'inscription
          </Link>

          {/* Informations supplémentaires */}
          <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
            <p className="text-xs text-[#9ca3af]">
              Aucun montant n'a été débité de votre compte.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <CancelContent />
    </Suspense>
  )
}
