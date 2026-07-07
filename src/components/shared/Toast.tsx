import { useEffect } from 'react'
import { useUIStore, type Toast as ToastType } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

const durationMap: Record<string, number> = {
  success: 4000,
  error: 8000,
  info: 4000,
  warning: 6000,
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
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
    if (toast.type === 'error') return
    const timer = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  const styles = {
    success: 'border-green-500 bg-green-50 text-green-800',
    error: 'border-red-500 bg-red-50 text-red-800',
    info: 'border-blue-500 bg-blue-50 text-blue-800',
    warning: 'border-amber-500 bg-amber-50 text-amber-800',
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 shadow-lg min-w-[300px]',
        styles[toast.type]
      )}
    >
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 hover:opacity-70"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
