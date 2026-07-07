import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import type { Reservation, Space } from '@/types'
import type { ReservationSearchValues } from './schemas'

export function useAvailableSpaces(params: ReservationSearchValues | null) {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['available-spaces', profile?.org_id, params],
    queryFn: async () => {
      if (!params) return []
      const startISO = `${params.date}T${params.start_time}:00`
      const endISO = `${params.date}T${params.end_time}:00`

      const { data: occupied } = await supabase
        .from('reservations')
        .select('space_id')
        .eq('status', 'confirmed')
        .lt('start_time', endISO)
        .gt('end_time', startISO)

      const occupiedIds = occupied?.map((r) => r.space_id) ?? []

      let query = supabase
        .from('spaces')
        .select('*')
        .eq('org_id', profile!.org_id)
        .eq('is_active', true)

      if (occupiedIds.length > 0) {
        query = query.not('id', 'in', `(${occupiedIds.join(',')})`)
      }

      if (params.space_type) {
        query = query.eq('type', params.space_type)
      }

      if (
        params.min_capacity !== undefined &&
        params.min_capacity >= 1 &&
        params.min_capacity <= 999
      ) {
        query = query.gte('capacity', params.min_capacity)
      }

      const { data, error } = await query.order('name')

      if (error) throw error
      return data as Space[]
    },
    enabled:
      !!profile?.org_id && !!params?.date && !!params?.start_time && !!params?.end_time,
  })
}

export function useMyReservations() {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['my-reservations', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, space:spaces(id, name, type, capacity)')
        .eq('user_id', profile!.id)
        .order('start_time', { ascending: true })

      if (error) throw error
      return data as Reservation[]
    },
    enabled: !!profile?.id,
    staleTime: 15_000,
  })
}

export function useOrgReservations() {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['org-reservations', profile?.org_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, space:spaces(id, name, type, capacity), profile:profiles(id, full_name, email)')
        .eq('org_id', profile!.org_id)
        .order('start_time', { ascending: true })

      if (error) throw error
      return data as Reservation[]
    },
    enabled: !!profile?.org_id,
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()
  const profile = useAuthStore((s) => s.profile)

  return useMutation({
    mutationFn: async ({
      spaceId,
      date,
      startTime,
      endTime,
      summary,
    }: {
      spaceId: string
      date: string
      startTime: string
      endTime: string
      summary?: string
    }) => {
      const startISO = `${date}T${startTime}:00`
      const endISO = `${date}T${endTime}:00`

      const { data: conflict } = await supabase
        .from('reservations')
        .select('id')
        .eq('space_id', spaceId)
        .eq('status', 'confirmed')
        .lt('start_time', endISO)
        .gt('end_time', startISO)

      if (conflict && conflict.length > 0) {
        throw new Error('El espacio ya no está disponible')
      }

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          org_id: profile!.org_id,
          space_id: spaceId,
          user_id: profile!.id,
          start_time: startISO,
          end_time: endISO,
          status: 'confirmed',
          ...(summary ? { summary } : {}),
        })
        .select()
        .single()

      if (error) throw error
      return data as Reservation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['org-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['available-spaces'] })
    },
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['org-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['available-spaces'] })
    },
  })
}
