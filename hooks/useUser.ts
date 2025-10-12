'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  role: string
  profile: any
}

interface UseUserReturn {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Récupérer l'utilisateur authentifié
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw userError
      }

      if (!user) {
        setUser(null)
        setProfile(null)
        return
      }

      setUser(user)

      // Récupérer le profil complet via l'API
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const profileData = await response.json()
      setProfile(profileData)

    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfile()
        }
      }
    ) || { data: { subscription: { unsubscribe: () => {} } } }

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    profile,
    loading,
    error,
    refetch: fetchProfile
  }
}
