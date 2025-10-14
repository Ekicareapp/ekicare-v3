'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useDeleteAccount() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const confirm = useCallback(async () => {
    try {
      setIsDeleting(true)
      const { data: { session } } = await supabase!.auth.getSession()
      if (!session) {
        alert('Utilisateur non authentifié')
        return
      }
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (!res.ok) {
        let message = 'Erreur lors de la suppression du compte'
        try {
          const body = await res.json()
          if (body && body.error) message = body.error
        } catch {}
        alert(message)
        return
      }
      await supabase!.auth.signOut()
      window.location.href = '/'
    } catch (e) {
      console.error('Erreur suppression compte:', e)
      alert('Erreur inattendue lors de la suppression du compte')
    } finally {
      setIsDeleting(false)
      setIsOpen(false)
    }
  }, [])

  return { isOpen, isDeleting, open, close, confirm }
}

export function DeleteConfirmModal({ isOpen, onCancel, onConfirm }: { isOpen: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 transition-opacity"
        style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onCancel}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md border border-[#e5e7eb]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
            <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-[#f86f4d] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.42 0l-7.07 12a2 2 0 001.74 3z" />
              </svg>
              <p className="text-sm text-gray-600">
                Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront définitivement perdues.
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={onCancel} className="bg-gray-100 text-gray-700 border border-gray-300 rounded-lg px-4 py-2">Annuler</button>
              <button onClick={onConfirm} className="bg-[#f86f4d] text-white border border-[#f86f4d] rounded-lg px-4 py-2">Confirmer la suppression</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


