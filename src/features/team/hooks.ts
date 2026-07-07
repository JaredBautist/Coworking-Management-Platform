import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import type { Profile } from '@/types'

export function useTeamMembers() {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['team-members', profile?.org_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', profile!.org_id)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as Profile[]
    },
    enabled: !!profile?.org_id,
    staleTime: 30_000,
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const currentProfile = useAuthStore((s) => s.profile)

  return useMutation({
    mutationFn: async ({
      memberId,
      newRole,
    }: {
      memberId: string
      newRole: 'office_manager' | 'member'
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error
    },
    onMutate: async ({ memberId, newRole }) => {
      await queryClient.cancelQueries({ queryKey: ['team-members'] })
      const previous = queryClient.getQueryData<Profile[]>([
        'team-members',
        currentProfile?.org_id,
      ])

      queryClient.setQueryData<Profile[]>(
        ['team-members', currentProfile?.org_id],
        (old) =>
          old?.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ['team-members', currentProfile?.org_id],
          context.previous
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}
