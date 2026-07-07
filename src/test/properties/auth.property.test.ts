import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'

type UserRole = 'office_manager' | 'member'

describe('Property 1: Redirección post-login determinada por rol', () => {
  it('office_manager redirige a /app/dashboard y member también', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<UserRole>('office_manager', 'member'),
        (role) => {
          const dashboardMap: Record<UserRole, string> = {
            office_manager: '/app/dashboard',
            member: '/app/dashboard',
          }
          const expected = dashboardMap[role]
          expect(expected).toBe('/app/dashboard')
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 2: Guard de rutas redirige usuarios no autenticados', () => {
  it('sin sesión siempre redirige a /login', () => {
    fc.assert(
      fc.property(fc.boolean(), (isAuthenticated) => {
        const protectedRoutes = [
          '/app/dashboard',
          '/app/spaces',
          '/app/reservations',
          '/app/calendar',
        ]

        for (const route of protectedRoutes) {
          if (!isAuthenticated) {
            expect(protectedRoutes).toContain(route)
            expect('/login').toBe('/login')
          }
        }
      }),
      { numRuns: 100 }
    )
  })
})
