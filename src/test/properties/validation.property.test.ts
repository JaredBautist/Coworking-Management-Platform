import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const nameSchema = z.string().min(2).max(100)

describe('Property 3: Validación de longitud de cadenas en formularios', () => {
  it('acepta strings con longitud entre 2 y 100', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 2, maxLength: 100 }), (value) => {
        const result = nameSchema.safeParse(value)
        expect(result.success).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('rechaza strings con longitud < 2', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 1 }), (value) => {
        const result = nameSchema.safeParse(value)
        expect(result.success).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('rechaza strings con longitud > 100', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 101, maxLength: 200 }), (value) => {
        const result = nameSchema.safeParse(value)
        expect(result.success).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
})

describe('Property 9: Validación del schema de búsqueda', () => {
  const searchSchema = z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      start_time: z.string().regex(/^\d{2}:\d{2}$/),
      end_time: z.string().regex(/^\d{2}:\d{2}$/),
    })
    .refine((d) => d.end_time > d.start_time, {
      message: 'end_time debe ser posterior a start_time',
      path: ['end_time'],
    })
    .refine((d) => new Date(d.date) >= new Date(new Date().toDateString()), {
      message: 'date no puede ser anterior a hoy',
      path: ['date'],
    })

  it('rechaza cuando end_time <= start_time', () => {
    const today = new Date().toISOString().split('T')[0]
    const result = searchSchema.safeParse({
      date: today,
      start_time: '10:00',
      end_time: '09:00',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza cuando date es anterior a hoy', () => {
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0]
    const result = searchSchema.safeParse({
      date: yesterday,
      start_time: '09:00',
      end_time: '10:00',
    })
    expect(result.success).toBe(false)
  })
})
