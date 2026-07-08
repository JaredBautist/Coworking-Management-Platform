import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { toUtcISOString } from '@/lib/utils'
import type { Reservation, Space, Profile } from '@/types'
import type { ReservationSearchValues } from './schemas'

export type AttendeeProfile = Pick<Profile, 'id' | 'full_name' | 'email'>

export function useAvailableSpaces(params: ReservationSearchValues | null) {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['available-spaces', profile?.org_id, params],
    queryFn: async () => {
      if (!params) return []
      const startISO = toUtcISOString(params.date, params.start_time)
      const endISO = toUtcISOString(params.date, params.end_time)

      const { data: occupied } = await supabase
        .from('reservations')
        .select('space_id')
        .eq('status', 'confirmed')
        .lt('start_time', endISO)
        .gt('end_time', startISO)

      const occupiedIds = occupied?.map((r) => r.space_id) ?? []

      // Coworking compartido: todos los espacios activos, sin filtrar por empresa.
      let query = supabase
        .from('spaces')
        .select('*')
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

export interface AlternativeSlot {
  date: string
  start_time: string
  end_time: string
}

/**
 * Suggests up to 3 alternative time windows within ±24h of the requested one
 * (same duration, business hours 08:00–20:00) where at least one active space
 * of the requested type is free. Used when a search returns no availability
 * (Req 5.4).
 */
export function useAlternativeSlots(
  params: ReservationSearchValues | null,
  enabled: boolean
) {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['alternative-slots', profile?.org_id, params],
    queryFn: async (): Promise<AlternativeSlot[]> => {
      if (!params || !profile?.org_id) return []

      const reqStart = new Date(`${params.date}T${params.start_time}`)
      const reqEnd = new Date(`${params.date}T${params.end_time}`)
      const durationMs = reqEnd.getTime() - reqStart.getTime()
      if (durationMs <= 0) return []

      const DAY_MS = 24 * 60 * 60 * 1000
      const windowStart = new Date(reqStart.getTime() - DAY_MS)
      const windowEnd = new Date(reqEnd.getTime() + DAY_MS)

      // Active spaces of the requested type (coworking-wide)
      let spacesQuery = supabase
        .from('spaces')
        .select('id')
        .eq('is_active', true)
      if (params.space_type) spacesQuery = spacesQuery.eq('type', params.space_type)
      const { data: spaces } = await spacesQuery
      const spaceIds = spaces?.map((s) => s.id) ?? []
      if (spaceIds.length === 0) return []

      // Confirmed reservations intersecting the ±24h window (coworking-wide)
      const { data: res } = await supabase
        .from('reservations')
        .select('space_id, start_time, end_time')
        .eq('status', 'confirmed')
        .lt('start_time', windowEnd.toISOString())
        .gt('end_time', windowStart.toISOString())
      const reservations = res ?? []

      const now = Date.now()
      const pad = (n: number) => String(n).padStart(2, '0')
      const candidates: Array<AlternativeSlot & { startMs: number }> = []

      for (let dayOffset = -1; dayOffset <= 1; dayOffset++) {
        for (let hour = 8; hour <= 20; hour++) {
          const cStart = new Date(reqStart)
          cStart.setDate(cStart.getDate() + dayOffset)
          cStart.setHours(hour, 0, 0, 0)
          const cEnd = new Date(cStart.getTime() + durationMs)

          const endLimit = new Date(cStart)
          endLimit.setHours(20, 0, 0, 0)
          if (cEnd > endLimit) continue
          if (Math.abs(cStart.getTime() - reqStart.getTime()) > DAY_MS) continue
          if (cStart.getTime() === reqStart.getTime()) continue
          if (cStart.getTime() <= now) continue

          const cStartISO = cStart.toISOString()
          const cEndISO = cEnd.toISOString()
          const hasFreeSpace = spaceIds.some(
            (id) =>
              !reservations.some(
                (r) =>
                  r.space_id === id &&
                  r.start_time < cEndISO &&
                  r.end_time > cStartISO
              )
          )
          if (!hasFreeSpace) continue

          candidates.push({
            date: `${cStart.getFullYear()}-${pad(cStart.getMonth() + 1)}-${pad(cStart.getDate())}`,
            start_time: `${pad(cStart.getHours())}:${pad(cStart.getMinutes())}`,
            end_time: `${pad(cEnd.getHours())}:${pad(cEnd.getMinutes())}`,
            startMs: cStart.getTime(),
          })
        }
      }

      candidates.sort(
        (a, b) =>
          Math.abs(a.startMs - reqStart.getTime()) -
          Math.abs(b.startMs - reqStart.getTime())
      )

      return candidates.slice(0, 3).map(({ date, start_time, end_time }) => ({
        date,
        start_time,
        end_time,
      }))
    },
    enabled: enabled && !!params && !!profile?.org_id,
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
        .select('*, space:spaces(id, name, type, capacity), profile:profiles!reservations_user_id_fkey(id, full_name, email)')
        .eq('org_id', profile!.org_id)
        .order('start_time', { ascending: true })

      if (error) throw error
      return data as Reservation[]
    },
    enabled: !!profile?.org_id,
  })
}

export function useReservationAttendees(reservationId: string | null) {
  return useQuery({
    queryKey: ['reservation-attendees', reservationId],
    queryFn: async (): Promise<AttendeeProfile[]> => {
      const { data, error } = await supabase
        .from('reservation_attendees')
        .select('profile:profiles(id, full_name, email)')
        .eq('reservation_id', reservationId!)

      if (error) throw error
      const rows = (data ?? []) as unknown as Array<{
        profile: AttendeeProfile | AttendeeProfile[] | null
      }>
      return rows
        .map((r) => (Array.isArray(r.profile) ? r.profile[0] : r.profile))
        .filter((p): p is AttendeeProfile => !!p)
    },
    enabled: !!reservationId,
  })
}

export function useDayReservations(
  date: string | null,
  spaceType?: string
) {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['day-reservations', date, spaceType ?? null],
    queryFn: async () => {
      if (!date) return []
      const dayStart = new Date(`${date}T00:00`)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const { data, error } = await supabase
        .from('reservations')
        .select('*, space:spaces(id, name, type, capacity), profile:profiles!reservations_user_id_fkey(id, full_name, email)')
        .eq('status', 'confirmed')
        .gte('start_time', dayStart.toISOString())
        .lt('start_time', dayEnd.toISOString())
        .order('start_time', { ascending: true })

      if (error) throw error
      const rows = data as Reservation[]
      return spaceType ? rows.filter((r) => r.space?.type === spaceType) : rows
    },
    enabled: !!date && !!profile?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

// Find Spaces: sin fecha → trae TODAS las reservas del coworking; con fecha
// (y/o tipo) filtra. Fecha y tipo son filtros opcionales.
export function useSearchReservations(
  params: { date?: string; spaceType?: string } | null
) {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['search-reservations', params?.date ?? null, params?.spaceType ?? null],
    queryFn: async () => {
      let query = supabase
        .from('reservations')
        .select('*, space:spaces(id, name, type, capacity), profile:profiles!reservations_user_id_fkey(id, full_name, email)')
        .eq('status', 'confirmed')
        .order('start_time', { ascending: true })

      if (params?.date) {
        const dayStart = new Date(`${params.date}T00:00`)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)
        query = query
          .gte('start_time', dayStart.toISOString())
          .lt('start_time', dayEnd.toISOString())
      }

      const { data, error } = await query
      if (error) throw error
      const rows = data as Reservation[]
      return params?.spaceType
        ? rows.filter((r) => r.space?.type === params.spaceType)
        : rows
    },
    enabled: !!params && !!profile?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useAllReservations() {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['all-reservations'],
    queryFn: async () => {
      // Coworking compartido: todas las reservas de todas las empresas.
      const { data, error } = await supabase
        .from('reservations')
        .select('*, space:spaces(id, name, type, capacity), profile:profiles!reservations_user_id_fkey(id, full_name, email)')
        .order('start_time', { ascending: true })

      if (error) throw error
      return data as Reservation[]
    },
    enabled: !!profile?.id,
    staleTime: 0,
    refetchOnMount: 'always',
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
      attendeeIds,
    }: {
      spaceId: string
      date: string
      startTime: string
      endTime: string
      summary?: string
      attendeeIds?: string[]
    }) => {
      if (!profile) throw new Error('El espacio ya no está disponible')

      const startISO = toUtcISOString(date, startTime)
      const endISO = toUtcISOString(date, endTime)

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
          org_id: profile.org_id,
          space_id: spaceId,
          user_id: profile.id,
          start_time: startISO,
          end_time: endISO,
          status: 'confirmed',
          ...(summary ? { summary } : {}),
        })
        .select()
        .single()

      if (error) {
        // The DB EXCLUDE constraint (23P01) is the atomic guard against a
        // concurrent overlap the pre-check missed — surface it as the same
        // "space unavailable" message the UI already handles.
        if (error.code === '23P01') {
          throw new Error('El espacio ya no está disponible')
        }
        throw error
      }

      // Best-effort: attach attendees so invited members can see the meeting.
      if (attendeeIds && attendeeIds.length > 0 && data?.id) {
        await supabase.from('reservation_attendees').insert(
          attendeeIds.map((uid) => ({ reservation_id: data.id, user_id: uid }))
        )
      }

      return data as Reservation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['org-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['day-reservations'] })
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
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['day-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['available-spaces'] })
    },
  })
}
