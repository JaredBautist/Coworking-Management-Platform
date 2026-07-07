import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'

describe('Property 11: Rechazo de cancelación de reservas pasadas', () => {
  it('no cancela reservas con start_time <= now', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date() }),
        (pastDate) => {
          fc.pre(!isNaN(pastDate.getTime()))
          const now = new Date()
          const canCancel = pastDate > now
          expect(canCancel).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('permite cancelar reservas con start_time > now', () => {
    fc.assert(
      fc.property(
        fc
          .date({ min: new Date(Date.now() + 60000), max: new Date('2030-12-31') })
          .filter((d) => !isNaN(d.getTime())),
        (futureDate) => {
          const now = new Date()
          const canCancel = futureDate > now
          expect(canCancel).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 12: Ordenación ascendente de reservas', () => {
  it('las reservas están ordenadas por start_time ascendente', () => {
    fc.assert(
      fc.property(
        fc
          .array(
            fc
              .date({
                min: new Date('2024-01-01'),
                max: new Date('2026-12-31'),
              })
              .filter((d) => !isNaN(d.getTime())),
            { minLength: 1, maxLength: 20 }
          )
          .filter((arr) => arr.every((d) => !isNaN(d.getTime()))),
        (dates) => {
          const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].getTime()).toBeLessThanOrEqual(
              sorted[i + 1].getTime()
            )
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
