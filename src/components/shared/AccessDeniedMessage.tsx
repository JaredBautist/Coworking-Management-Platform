import { useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

export function AccessDeniedMessage() {
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    addToast({
      type: 'error',
      message: 'No tienes permisos para acceder a esta sección.',
    })
  }, [addToast])

  return null
}
