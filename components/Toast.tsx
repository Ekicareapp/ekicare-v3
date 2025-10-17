"use client"

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle, X, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: number
  message: string
  type?: ToastType
}

type ToastContextValue = {
  show: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    const next: Toast = { id, ...toast }
    setToasts((prev) => [...prev, next])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  const getIcon = (type: ToastType = 'success') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <X className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-8 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="fixed z-50 transform transition-all duration-300 ease-out opacity-100 translate-y-0 top-8 left-1/2 -translate-x-1/2 w-[90%] sm:left-auto sm:translate-x-0 sm:right-4 sm:w-auto sm:top-8"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 w-full bg-white border border-gray-200 shadow-lg rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                {getIcon(t.type)}
                <span className="text-sm font-medium text-gray-800 break-words">
                  {t.message}
                </span>
              </div>
              <button
                onClick={() => {
                  setToasts((prev) => prev.filter((toast) => toast.id !== t.id))
                }}
                className="ml-4 flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Fermer la notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}


