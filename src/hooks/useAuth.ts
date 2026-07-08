import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { session, profile, isLoading, setSession, setProfile, clear } =
    useAuthStore()

  useEffect(() => {
    const loadProfile = (userId: string) => {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data)
        })
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id)
      useAuthStore.setState({ isLoading: false })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        // Defer the Supabase call: calling it synchronously inside the
        // auth callback can deadlock the client.
        setTimeout(() => loadProfile(session.user.id), 0)
      } else {
        clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession, setProfile, clear])

  return { session, profile, isLoading }
}
