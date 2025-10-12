'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const router = useRouter()

  // Vérifier que l'utilisateur a un token valide
  useEffect(() => {
    async function checkSession() {
      if (!supabase) {
        setIsValidToken(false)
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      setIsValidToken(!!session)
    }
    checkSession()
  }, [])

  // Validation du formulaire
  const isFormValid = () => {
    return (
      newPassword.length >= 6 &&
      confirmPassword.length >= 6 &&
      newPassword === confirmPassword
    )
  }

  // Messages de validation
  const getPasswordError = () => {
    if (newPassword.length > 0 && newPassword.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères'
    }
    if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
      return 'Les mots de passe ne correspondent pas'
    }
    return ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!supabase) {
        setError('Erreur de connexion')
        return
      }

      if (!isFormValid()) {
        setError('Veuillez corriger les erreurs ci-dessus')
        return
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)

      // Redirection automatique vers /login après 3 secondes
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Si on vérifie encore la session
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f86f4d] mx-auto"></div>
          <p className="mt-4 text-[#6b7280]">Vérification...</p>
        </div>
      </div>
    )
  }

  // Si le token n'est pas valide
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-[#fee2e2] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#ef4444]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-2">
              Lien invalide ou expiré
            </h2>
            <p className="text-[#6b7280] mb-6">
              Le lien de réinitialisation de mot de passe est invalide ou a expiré.
              Veuillez demander un nouveau lien.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block w-full py-3 px-4 bg-[#f86f4d] text-white rounded-lg font-medium hover:bg-[#fa8265] transition-all duration-150"
            >
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 overflow-x-hidden">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-lg p-4 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#111827] mb-2">
              Définir un nouveau mot de passe
            </h2>
            <p className="text-sm sm:text-base text-[#6b7280]">
              Choisissez un mot de passe sécurisé pour votre compte.
            </p>
          </div>

          {/* Message de succès */}
          {success && (
            <div className="mb-6 p-4 bg-[#d1fae5] border border-[#6ee7b7] rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-[#059669] mr-3 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#065f46]">
                    Mot de passe mis à jour avec succès !
                  </p>
                  <p className="text-sm text-[#047857] mt-1">
                    Redirection vers la page de connexion...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading || success}
                className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base disabled:bg-[#f3f4f6] disabled:cursor-not-allowed"
              />
              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="mt-1 text-xs text-[#ef4444]">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              )}
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading || success}
                className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base disabled:bg-[#f3f4f6] disabled:cursor-not-allowed"
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-[#ef4444]">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            {/* Message d'erreur global */}
            {error && (
              <div className="text-[#ef4444] text-sm bg-[#fee2e2] border border-[#fecaca] rounded-lg p-3 break-words">
                {error}
              </div>
            )}

            {/* Bouton principal */}
            <button
              type="submit"
              disabled={loading || !isFormValid() || success}
              className={`w-full py-3 px-4 min-h-[44px] rounded-lg font-medium transition-all duration-150 text-base ${
                loading || !isFormValid() || success
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#f86f4d] text-white hover:bg-[#fa8265]'
              }`}
            >
              {loading ? 'Mise à jour...' : success ? 'Mot de passe mis à jour' : 'Mettre à jour le mot de passe'}
            </button>

            {/* Lien retour */}
            {!success && (
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
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

