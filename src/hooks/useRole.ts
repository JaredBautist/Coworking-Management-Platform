import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types'

export function useRole() {
  const profile = useAuthStore((state) => state.profile)
  const role = profile?.role ?? null

  return {
    role,
    isOfficeManager: role === 'office_manager',
    isMember: role === 'member',
    hasRole: (r: UserRole) => role === r,
  }
}
