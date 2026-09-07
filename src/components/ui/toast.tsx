'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CheckIcon, XIcon } from '@/components/ui/icons'

type ToastTone = 'success' | 'error'
type Toast = { id: string; message: string; tone: ToastTone }
type ToastContextValue = { notify: (message: string, tone?: ToastTone) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

function ToastMessage({ toast, dismiss }: { toast: Toast; dismiss: (id: string) => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => dismiss(toast.id), toast.tone === 'error' ? 5000 : 3500)
    return () => window.clearTimeout(timeout)
  }, [dismiss, toast.id, toast.tone])

  return (
    <div className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
      <span className="toast-icon">
        {toast.tone === 'success' ? <CheckIcon size={14} /> : <XIcon size={14} />}
      </span>
      <span className="toast-message">{toast.message}</span>
      <button
        type="button"
        className="toast-dismiss"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        title="Dismiss notification"
      >
        <XIcon size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: string) => setToasts((current) => current.filter((toast) => toast.id !== id)), [])
  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current.slice(-3), { id, message, tone }])
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => <ToastMessage key={toast.id} toast={toast} dismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
