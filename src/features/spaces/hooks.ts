import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import type { Space } from '@/types'
import type { SpaceFormValues } from './schemas'

export function useSpaces() {
  const profile = useAuthStore((s) => s.profile)

  return useQuery({
    queryKey: ['spaces', profile?.org_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('org_id', profile!.org_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Space[]
    },
    enabled: !!profile?.org_id,
    staleTime: 30_000,
  })
}

export function useCreateSpace() {
  const queryClient = useQueryClient()
  const profile = useAuthStore((s) => s.profile)

  return useMutation({
    mutationFn: async (values: SpaceFormValues) => {
      const { data, error } = await supabase
        .from('spaces')
        .insert({
          org_id: profile!.org_id,
          name: values.name,
          type: values.type,
          capacity: values.capacity,
          is_active: values.is_active,
        })
        .select()
        .single()

      if (error) throw error
      return data as Space
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}

export function useUpdateSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: SpaceFormValues
    }) => {
      const { data, error } = await supabase
        .from('spaces')
        .update({
          name: values.name,
          type: values.type,
          capacity: values.capacity,
          is_active: values.is_active,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Space
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}
