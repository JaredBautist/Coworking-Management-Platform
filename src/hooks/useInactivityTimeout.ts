import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

const DEFAULT_TIMEOUT_MS = 60 * 60 * 1000

export function useInactivityTimeout(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        supabase.auth.signOut()
      }, timeoutMs)
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll'] as const
    events.forEach((event) => window.addEventListener(event, reset))
    reset()

    return () => {
      clearTimeout(timer)
      events.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [timeoutMs])
}
