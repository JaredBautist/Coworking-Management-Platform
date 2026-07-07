import { useEffect } from 'react'
import { supabase } from './client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

export function subscribeToOrgReservations(
  orgId: string,
  onEvent: () => void
) {
  return supabase
    .channel(`org-reservations-${orgId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reservations',
        filter: `org_id=eq.${orgId}`,
      },
      onEvent
    )
    .subscribe()
}

export function useReservationRealtime() {
  const profile = useAuthStore((s) => s.profile)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!profile?.org_id) return

    const channel = subscribeToOrgReservations(profile.org_id, () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['org-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['available-spaces'] })
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.org_id, queryClient])
}
