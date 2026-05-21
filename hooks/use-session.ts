'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  role: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  created_at: Date
  updated_at: Date
}

interface Nutritionist {
  id: string
  profile_id: string
  business_name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  plan_type: string
  is_active: boolean
}

interface SessionState {
  user: User | null
  profile: Profile | null
  nutritionist: Nutritionist | null
  isLoading: boolean
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    user: null,
    profile: null,
    nutritionist: null,
    isLoading: true,
  })

  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!mounted) return

        if (!user) {
          setState({ user: null, profile: null, nutritionist: null, isLoading: false })
          return
        }

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!mounted) return

        // Fetch nutritionist if applicable
        let nutritionistData: Nutritionist | null = null
        if (profileData?.role === 'nutritionist' || profileData?.role === 'coordinator') {
          const { data: nutData } = await supabase
            .from('nutritionists')
            .select('*')
            .eq('profile_id', user.id)
            .single()

          nutritionistData = nutData ?? null
        }

        if (!mounted) return

        setState({
          user,
          profile: profileData ?? null,
          nutritionist: nutritionistData,
          isLoading: false,
        })
      } catch {
        if (mounted) {
          setState({ user: null, profile: null, nutritionist: null, isLoading: false })
        }
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (!session?.user) {
        setState({ user: null, profile: null, nutritionist: null, isLoading: false })
      } else {
        loadSession()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}
