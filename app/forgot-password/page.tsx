'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Validation basique de l'email
  const isEmailValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      if (!supabase) {
        setError('Erreur de connexion')
        return
      }

      if (!isEmailValid()) {
        setError('Veuillez entrer une adresse email valide')
        return
      }

      // Envoyer l'email de réinitialisation
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.ekicare.com/reset-password',
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess(true)
      setEmail('') // Vider le champ après succès
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 overflow-x-hidden">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-lg p-4 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#111827] mb-2">
              Réinitialiser votre mot de passe
            </h2>
            <p className="text-sm sm:text-base text-[#6b7280]">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          {/* Message de succès */}
          {success && (
            <div className="mb-6 p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-[#10b981] rounded-full mr-3 flex-shrink-0"></div>
                <p className="text-sm text-[#374151]">
                  Email envoyé. Vérifiez votre boîte de réception.
                </p>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                disabled={loading || success}
                className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base disabled:bg-[#f3f4f6] disabled:cursor-not-allowed"
              />
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="text-[#ef4444] text-sm bg-[#fee2e2] border border-[#fecaca] rounded-lg p-3 break-words">
                {error}
              </div>
            )}

            {/* Bouton principal */}
            <button
              type="submit"
              disabled={loading || !isEmailValid() || success}
              className={`w-full py-3 px-4 min-h-[44px] rounded-lg font-medium transition-all duration-150 text-base ${
                loading || !isEmailValid() || success
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#f86f4d] text-white hover:bg-[#fa8265]'
              }`}
            >
              {loading ? 'Envoi en cours...' : success ? 'Email envoyé' : 'Envoyer le lien'}
            </button>

            {/* Bouton retour */}
            <div className="text-center mt-6">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-[#6b7280] hover:text-[#111827] transition-colors duration-150"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Retour à la connexion
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

