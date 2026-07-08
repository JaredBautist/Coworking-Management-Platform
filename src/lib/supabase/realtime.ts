import { useEffect } from 'react'
import { supabase } from './client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

// Coworking compartido: escuchar los cambios de reservas de TODAS las empresas
// para que la disponibilidad y el calendario se actualicen en tiempo real.
export function subscribeToAllReservations(onEvent: () => void) {
  return supabase
    .channel('coworking-reservations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reservations',
      },
      onEvent
    )
    .subscribe()
}

export function useReservationRealtime() {
  const profile = useAuthStore((s) => s.profile)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!profile?.id) return

    const channel = subscribeToAllReservations(() => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['org-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['day-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['available-spaces'] })
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient])
}
