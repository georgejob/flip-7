import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Returns the auth.uid() of the local anonymous user, or null while loading.
export function useCurrentUserId() {
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        console.error('useCurrentUserId: getUser failed', error)
        return
      }
      setUserId(data?.user?.id ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setUserId(session?.user?.id ?? null)
    })
    return () => {
      cancelled = true
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  return userId
}
