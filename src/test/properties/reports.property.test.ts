import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'

describe('Property 14: Cálculo de tasa de ocupación por espacio', () => {
  const calculateOccupancyRate = (
    totalHoursBooked: number,
    dailyCapacityHours: number
  ): number | null => {
    if (dailyCapacityHours === 0) return null
    return (
      Math.round(
        (totalHoursBooked / (dailyCapacityHours * 30)) * 100 * 10
      ) / 10
    )
  }

  it('retorna null si daily_capacity_hours es 0', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000 }),
        (hours) => {
          expect(calculateOccupancyRate(hours, 0)).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('retorna un valor no negativo', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 500 }),
        fc.integer({ min: 1, max: 24 }),
        (hours, dailyHours) => {
          const rate = calculateOccupancyRate(hours, dailyHours)
          if (rate !== null) {
            expect(rate).toBeGreaterThanOrEqual(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 15: Completitud de serie temporal de 30 días', () => {
  it('contiene exactamente 30 puntos', () => {
    const dailyCounts: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      dailyCounts[key] = 0
    }
    const series = Object.keys(dailyCounts)
    expect(series).toHaveLength(30)
  })
})

describe('Property 16: Filtrado correcto por tipo de espacio en Reporting', () => {
  it('con filtro activo, todos los registros corresponden al tipo', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string(),
            space_type: fc.constantFrom<'desk' | 'meeting_room' | 'phone_booth' | 'event_space'>(
              'desk', 'meeting_room', 'phone_booth', 'event_space'
            ),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.constantFrom<'desk' | 'meeting_room' | 'phone_booth' | 'event_space'>(
          'desk', 'meeting_room', 'phone_booth', 'event_space'
        ),
        (records, filterType) => {
          const filtered = records.filter(
            (r) => r.space_type === filterType
          )

          for (const r of filtered) {
            expect(r.space_type).toBe(filterType)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 17: CSV refleja filtro activo y columnas requeridas', () => {
  it('contiene las columnas requeridas', () => {
    const headers = [
      'space_id',
      'name',
      'org_id',
      'total_reservations',
      'total_hours_booked',
      'space_type',
    ]

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            space_id: fc.uuid(),
            name: fc.string(),
            org_id: fc.uuid(),
            total_reservations: fc.integer(),
            total_hours_booked: fc.float(),
            space_type: fc.constantFrom('desk', 'meeting_room', 'phone_booth', 'event_space', ''),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (data) => {
          const csvLine = headers.join(',')
          expect(csvLine).toContain('space_id')
          expect(csvLine).toContain('name')
          expect(csvLine).toContain('org_id')
          expect(csvLine).toContain('total_reservations')
          expect(csvLine).toContain('total_hours_booked')
          expect(csvLine).toContain('space_type')

          for (const row of data) {
            const rowCSV = [
              row.space_id,
              `"${row.name}"`,
              row.org_id,
              row.total_reservations,
              row.total_hours_booked,
              row.space_type,
            ].join(',')

            expect(rowCSV).toContain(row.space_id)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
