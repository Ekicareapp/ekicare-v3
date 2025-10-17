'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabaseClient'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { show } = useToast()

  useEffect(() => {
    if (!isOpen) {
      setRating(null)
      setHover(null)
      setMessage('')
      setSubmitting(false)
      setSuccess(false)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const submitFeedback = async () => {
    try {
      setSubmitting(true)
      setError(null)

      if (!supabase) throw new Error('Supabase non initialisé')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('Utilisateur non connecté')

      // Déterminer le type d'utilisateur (pro ou proprio)
      let userType: 'pro' | 'proprio' = 'proprio'
      const { data: proRow } = await supabase
        .from('pro_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (proRow) userType = 'pro'

      const { error: insertError } = await supabase
        .from('feedback')
        .insert([{ user_id: session.user.id, user_type: userType, rating, message }])
      if (insertError) throw insertError

      setSuccess(true)
      show({
        type: 'success',
        message: 'Merci pour votre avis ! Votre retour nous aide à améliorer Ekicare.'
      })
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de l\'envoi du feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const Star = ({ index }: { index: number }) => {
    const filled = (hover ?? rating ?? 0) >= index
    return (
      <button
        type="button"
        onMouseEnter={() => setHover(index)}
        onMouseLeave={() => setHover(null)}
        onClick={() => setRating(index)}
        className="p-1"
        aria-label={`Note ${index}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-7 h-7"
          fill={filled ? '#F86F4D' : 'none'}
          stroke={filled ? '#F86F4D' : '#9ca3af'}
          strokeWidth="2"
        >
          <path strokeLinecap="butt" strokeLinejoin="miter" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.89a1 1 0 00-.364 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.89a1 1 0 00-1.176 0l-3.976 2.89c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.976-2.89c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.518-4.674z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 modal-backdrop transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-md transform overflow-hidden rounded-xl modal-content transition-all duration-200"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb]">
          <h2 className="text-lg font-semibold text-[#111827]">Aidez nous à améliorer Ekicare !</h2>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#111827]" aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-center gap-1">
            {[1,2,3,4,5].map((i) => (
              <Star key={i} index={i} />
            ))}
          </div>
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              placeholder="Partagez votre avis (500 caractères max)"
              className="w-full h-28 px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:border-[#f86f4d] text-[#111827]"
              maxLength={500}
            />
            <div className="text-right text-xs text-[#9ca3af] mt-1">{message.length}/500</div>
          </div>
          {error && (
            <div className="text-sm text-[#ef4444] bg-[#fee2e2] border border-[#fecaca] rounded-md p-2">{error}</div>
          )}
          {/* success handled by toast */}
        </div>
        <div className="p-4 border-t border-[#e5e7eb] flex justify-end">
          <button
            onClick={submitFeedback}
            disabled={submitting || !rating}
            className={`px-4 py-2 rounded-md font-medium ${
              submitting || !rating ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'text-white'
            }`}
            style={{ backgroundColor: submitting || !rating ? undefined : '#F86F4D' }}
          >
            {submitting ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}


