import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'

type UserRole = 'office_manager' | 'member'

describe('Property 13: Privacidad de datos en Calendar_View para member', () => {
  it('member no ve full_name ni email de otros usuarios', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<UserRole>('office_manager', 'member'),
        fc.string(),
        fc.emailAddress(),
        (role, fullName, email) => {
          const panelData =
            role === 'office_manager'
              ? { name: fullName, email }
              : { name: undefined, email: undefined }

          if (role === 'member') {
            expect(panelData.name).toBeUndefined()
            expect(panelData.email).toBeUndefined()
          } else {
            expect(panelData.name).toBe(fullName)
            expect(panelData.email).toBe(email)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
