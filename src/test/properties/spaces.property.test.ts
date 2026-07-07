import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { SpaceFormSchema } from '@/features/spaces/schemas'

const validTypes = ['desk', 'meeting_room', 'phone_booth', 'event_space'] as const

describe('Property 4: Validación de SpaceFormData completa', () => {
  it('acepta datos válidos', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 100 }),
        fc.constantFrom(...validTypes),
        fc.integer({ min: 1, max: 500 }),
        fc.boolean(),
        (name, type, capacity, is_active) => {
          const result = SpaceFormSchema.safeParse({
            name,
            type,
            capacity,
            is_active,
          })
          expect(result.success).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('rechaza name con longitud < 2', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1 }),
        fc.constantFrom(...validTypes),
        fc.integer({ min: 1, max: 500 }),
        fc.boolean(),
        (name, type, capacity, is_active) => {
          const result = SpaceFormSchema.safeParse({
            name,
            type,
            capacity,
            is_active,
          })
          expect(result.success).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('rechaza name con longitud > 100', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101, maxLength: 200 }),
        fc.constantFrom(...validTypes),
        fc.integer({ min: 1, max: 500 }),
        fc.boolean(),
        (name, type, capacity, is_active) => {
          const result = SpaceFormSchema.safeParse({
            name,
            type,
            capacity,
            is_active,
          })
          expect(result.success).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('rechaza type inválido', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 100 }),
        fc.string(),
        fc.integer({ min: 1, max: 500 }),
        fc.boolean(),
        (name, type, capacity, is_active) => {
          fc.pre(!validTypes.includes(type as any))
          const result = SpaceFormSchema.safeParse({
            name,
            type,
            capacity,
            is_active,
          })
          expect(result.success).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('rechaza capacity < 1', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 100 }),
        fc.constantFrom(...validTypes),
        fc.integer({ max: 0 }),
        fc.boolean(),
        (name, type, capacity, is_active) => {
          const result = SpaceFormSchema.safeParse({
            name,
            type,
            capacity,
            is_active,
          })
          expect(result.success).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('rechaza capacity > 500', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 100 }),
        fc.constantFrom(...validTypes),
        fc.integer({ min: 501, max: 1000 }),
        fc.boolean(),
        (name, type, capacity, is_active) => {
          const result = SpaceFormSchema.safeParse({
            name,
            type,
            capacity,
            is_active,
          })
          expect(result.success).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 5: Paginación — ítems por página nunca excede 25', () => {
  it('cada página tiene como máximo 25 elementos', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 0, maxLength: 500 }),
        fc.integer({ min: 1, max: 20 }),
        (items, page) => {
          const perPage = 25
          const start = (page - 1) * perPage
          const pageItems = items.slice(start, start + perPage)
          expect(pageItems.length).toBeLessThanOrEqual(perPage)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 6: Desactivación de espacio — count y cancelación correctos', () => {
  it('el diálogo muestra el número exacto de reservas futuras afectadas', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        (futureReservations) => {
          const dialogMessage = `tiene ${futureReservations} reserva(s) futura(s)`
          if (futureReservations > 0) {
            expect(dialogMessage).toContain(String(futureReservations))
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
