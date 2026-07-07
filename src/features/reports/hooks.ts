import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import type { SpaceUtilization } from '@/types'

export function calculateOccupancyRate(
  totalHoursBooked: number,
  dailyCapacityHours: number
): number | null {
  if (
    !Number.isFinite(totalHoursBooked) ||
    !Number.isFinite(dailyCapacityHours) ||
    dailyCapacityHours <= 0
  ) {
    return null
  }
  return Math.round((totalHoursBooked / (dailyCapacityHours * 30)) * 100 * 10) / 10
}

export function useSpaceUtilization(spaceType?: string) {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['space-utilization', profile?.org_id, spaceType],
    queryFn: async () => {
      let query = supabase
        .from('space_utilization')
        .select('*')
        .eq('org_id', profile!.org_id)

      if (spaceType) {
        query = query.eq('space_type', spaceType)
      }

      const { data, error } = await query

      if (error) throw error
      return data as SpaceUtilization[]
    },
    enabled: !!profile?.org_id,
  })
}

export function useDailyReservations(spaceType?: string) {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['daily-reservations', profile?.org_id, spaceType],
    queryFn: async () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      let query = supabase
        .from('reservations')
        .select('start_time, space:spaces!inner(type)')
        .eq('org_id', profile!.org_id)
        .gte('start_time', thirtyDaysAgo.toISOString())

      if (spaceType) {
        query = query.eq('space.type', spaceType)
      }

      const { data, error } = await query

      if (error) throw error

      const dailyCounts: Record<string, number> = {}
      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const key = date.toISOString().split('T')[0]
        dailyCounts[key] = 0
      }

      for (const r of data) {
        const key = r.start_time.split('T')[0]
        if (dailyCounts[key] !== undefined) {
          dailyCounts[key]++
        }
      }

      return Object.entries(dailyCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }))
    },
    enabled: !!profile?.org_id,
  })
}

export function exportToCSV(
  data: SpaceUtilization[],
  filename = 'reporte-utilizacion.csv'
) {
  const headers = [
    'space_id',
    'name',
    'org_id',
    'total_reservations',
    'total_hours_booked',
    'space_type',
  ]

  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      [
        row.space_id,
        `"${row.name}"`,
        row.org_id,
        row.total_reservations,
        row.total_hours_booked,
        row.space_type ?? '',
      ].join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
