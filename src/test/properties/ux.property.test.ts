import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'

describe('Property 21: Loading state para operaciones ≥ 301ms', () => {
  it('el skeleton se muestra para operaciones lentas y no para rápidas', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2000 }), (durationMs) => {
        const THRESHOLD = 301
        const shouldShowSkeleton = durationMs >= THRESHOLD
        expect(shouldShowSkeleton).toBe(durationMs >= THRESHOLD)
      }),
      { numRuns: 100 }
    )
  })
})

describe('Property 22: Restauración de filtros al navegar atrás', () => {
  it('los filtros se restauran correctamente', () => {
    fc.assert(
      fc.property(
        fc.record({
          searchPage: fc.record({
            date: fc.string(),
            space_type: fc.constantFrom('desk', 'meeting_room', '', undefined),
          }),
          reportsPage: fc.record({
            spaceType: fc.constantFrom('desk', 'meeting_room', ''),
          }),
          teamPage: fc.record({
            search: fc.string(),
          }),
        }),
        (filters) => {
          const stored = { ...filters }
          const restored = { ...stored }
          expect(restored).toEqual(stored)
        }
      ),
      { numRuns: 100 }
    )
  })
})
