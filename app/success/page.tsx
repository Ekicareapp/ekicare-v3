'use client'
import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 overflow-x-hidden">
      <div className="w-full max-w-md">
        {/* Card de confirmation */}
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-4 sm:p-8 text-center">
          {/* Icône de succès */}
          <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Titre */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-4">
            Paiement confirmé 🎉
          </h1>

          {/* Texte explicatif */}
          <p className="text-sm sm:text-base text-[#6b7280] mb-8 leading-relaxed">
            Votre abonnement a bien été activé, vous pouvez dès maintenant accéder à votre espace professionnel.
          </p>

          {/* Bouton de redirection */}
          <Link
            href="/dashboard/pro"
            className="inline-block w-full bg-[#f86f4d] text-white py-3 px-4 min-h-[44px] rounded-lg font-medium hover:bg-[#fa8265] focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:ring-offset-2 transition-all duration-150 text-base"
          >
            Accéder à mon dashboard
          </Link>

          {/* Informations supplémentaires */}
          <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
            <p className="text-xs text-[#9ca3af]">
              Vous recevrez un email de confirmation sous peu.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
