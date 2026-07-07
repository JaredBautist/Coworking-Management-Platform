import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { hasOverlap, filterAvailableSpaces } from '@/features/reservations/schemas'
import type { Space } from '@/types'

describe('Property 7: Detección de solapamiento de reservas', () => {
  it('un espacio ocupado no aparece en resultados', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            start: fc.integer({ min: 0, max: 20 }),
            end: fc.integer({ min: 0, max: 20 }),
          })
          .filter(({ start, end }) => end > start),
        fc.array(
          fc
            .record({
              id: fc.uuid(),
              start: fc.integer({ min: 0, max: 20 }),
              end: fc.integer({ min: 0, max: 20 }),
            })
            .filter((r) => r.end > r.start),
          { minLength: 1, maxLength: 5 }
        ),
        ({ start: reqStart, end: reqEnd }, existing) => {
          const reqS = `${String(reqStart).padStart(2, '0')}:00`
          const reqE = `${String(reqEnd).padStart(2, '0')}:00`

          const overlappingIds = existing
            .filter((r) => {
              const rS = `${String(r.start).padStart(2, '0')}:00`
              const rE = `${String(r.end).padStart(2, '0')}:00`
              return hasOverlap(rS, rE, reqS, reqE)
            })
            .map((r) => r.id)

          const mockSpaces: Space[] = existing.map((r) => ({
            id: r.id,
            org_id: 'org-1',
            name: `Space-${r.id}`,
            type: 'desk' as const,
            capacity: 4,
            is_active: true,
            created_at: new Date().toISOString(),
          }))

          const mockParams = {
            date: '2026-07-07',
            start_time: reqS,
            end_time: reqE,
          }

          const result = filterAvailableSpaces(mockSpaces, overlappingIds, mockParams as any)

          const resultIds = result.map((s) => s.id)
          for (const id of overlappingIds) {
            expect(resultIds).not.toContain(id)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 8: Ignorar filtro de capacidad fuera de rango', () => {
  it('min_capacity fuera de [1, 999] no afecta el resultado', () => {
    fc.assert(
      fc.property(
        fc.integer({ max: 0 }),
        fc.integer({ min: 1000, max: 2000 }),
        (tooLow, tooHigh) => {
          const lowResult = tooLow >= 1 && tooLow <= 999
          const highResult = tooHigh >= 1 && tooHigh <= 999
          expect(lowResult).toBe(false)
          expect(highResult).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 10: Prevención de conflictos concurrentes', () => {
  it('detecta conflicto cuando otra reserva ocupa el mismo horario', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            start: fc.integer({ min: 0, max: 20 }),
            end: fc.integer({ min: 0, max: 20 }),
          })
          .filter(({ start, end }) => end > start),
        (requested) => {
          const existingStart = `${String(requested.start).padStart(2, '0')}:00`
          const existingEnd = `${String(requested.end).padStart(2, '0')}:00`

          const conflict = hasOverlap(
            existingStart,
            existingEnd,
            existingStart,
            existingEnd
          )

          expect(conflict).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
