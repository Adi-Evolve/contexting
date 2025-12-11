'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types/database.types'
import { profileService } from '@/services'
import { useAuth } from './useAuth'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await profileService.getOrCreateProfile(user.id, user.email)
      setProfile(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No authenticated user')

    try {
      setLoading(true)
      const updated = await profileService.updateProfile(user.id, updates)
      setProfile(updated)
      setError(null)
      return updated
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('No authenticated user')

    try {
      setLoading(true)
      const avatarUrl = await profileService.uploadAvatar(user.id, file)
      const updated = await profileService.updateProfile(user.id, { avatar_url: avatarUrl })
      setProfile(updated)
      setError(null)
      return avatarUrl
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refresh: loadProfile,
  }
}
