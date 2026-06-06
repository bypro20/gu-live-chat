'use client'

import { createContext, useCallback, useContext, useState, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'error' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-border bg-card text-foreground',
  success: 'border-success/30 bg-success-light text-foreground',
  error: 'border-destructive/30 bg-destructive-light text-foreground',
  info: 'border-primary/30 bg-primary-light text-foreground',
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="w-4 h-4 text-muted-foreground shrink-0" />,
  success: <CheckCircle2 className="w-4 h-4 text-success shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-destructive shrink-0" />,
  info: <Info className="w-4 h-4 text-primary shrink-0" />,
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const variant = toast.variant || 'default'

  useEffect(() => {
    const ms = toast.duration ?? 4000
    const t = setTimeout(onDismiss, ms)
    return () => clearTimeout(t)
  }, [toast.duration, onDismiss])

  return (
    <div className={cn('toast-enter flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full', variantStyles[variant])}>
      {variantIcons[variant]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>}
      </div>
      <button onClick={onDismiss} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
