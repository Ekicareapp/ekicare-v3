'use client'
import Link from 'next/link'

export default function PaiementRequisPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 overflow-x-hidden">
      <div className="w-full max-w-md">
        {/* Card de paiement requis */}
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-4 sm:p-8 text-center">
          {/* Icône d'information */}
          <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Titre */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-4">
            Paiement requis
          </h1>

          {/* Texte explicatif */}
          <p className="text-sm sm:text-base text-[#6b7280] mb-8 leading-relaxed">
            Votre compte est créé mais vous devez finaliser le paiement pour accéder à vos fonctionnalités pro.
          </p>

          {/* Bouton de redirection */}
          <Link
            href="/signup"
            className="inline-block w-full bg-[#f86f4d] text-white py-3 px-4 min-h-[44px] rounded-lg font-medium hover:bg-[#fa8265] focus:outline-none focus:border-[#ff6b35] transition-all duration-150 text-base"
          >
            Finaliser le paiement
          </Link>

          {/* Informations supplémentaires */}
          <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
            <p className="text-xs text-[#9ca3af]">
              Contactez le support si vous avez des questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
