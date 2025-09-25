'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Redirection vers le dashboard
        window.location.href = '/dashboard/proprietaire'
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 overflow-x-hidden">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-4 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#111827] mb-2">
              Connexion
            </h2>
            <p className="text-sm sm:text-base text-[#6b7280]">
              Connectez-vous à votre compte EkiCare
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2 break-words">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:border-[#f86f4d] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2 break-words">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:border-[#f86f4d] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
              />
            </div>

            {error && (
              <div className="text-[#ef4444] text-sm bg-[#fee2e2] border border-[#fecaca] rounded-lg p-3 break-words">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Link
                href="#"
                className="text-sm text-[#6b7280] hover:text-[#111827] hover:underline transition-colors duration-150"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f86f4d] text-white py-3 px-4 min-h-[44px] rounded-lg font-medium hover:bg-[#fa8265] focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div className="text-center mt-6">
              <p className="text-[#6b7280] text-sm sm:text-base break-words">
                Pas encore de compte ?{' '}
                <Link
                  href="/signup"
                  className="text-[#f86f4d] hover:text-[#fa8265] hover:underline font-medium transition-colors duration-150"
                >
                  S'inscrire
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
