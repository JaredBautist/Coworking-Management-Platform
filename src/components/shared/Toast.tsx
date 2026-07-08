import { useEffect } from 'react'
import { useUIStore, type Toast as ToastType } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react'

const durationMap: Record<string, number> = {
  success: 4000,
  error: 8000,
  info: 4000,
  warning: 6000,
}

const config = {
  success: { icon: CheckCircle2, accent: 'border-l-success text-success' },
  error: { icon: XCircle, accent: 'border-l-destructive text-destructive' },
  info: { icon: Info, accent: 'border-l-info text-info' },
  warning: { icon: AlertTriangle, accent: 'border-l-warning text-warning' },
} as const

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastType
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    const duration = durationMap[toast.type] ?? 4000
    const timer = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  const { icon: Icon, accent } = config[toast.type]

  return (
    <div
      role="alert"
      className={cn(
        'flex min-w-[300px] max-w-sm items-start gap-3 rounded-lg border border-border border-l-4 bg-card px-4 py-3 shadow-elevated animate-slide-in-right',
        accent
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm text-card-foreground">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
