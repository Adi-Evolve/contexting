import { supabase } from '@/lib/supabase/client'
import { Profile } from '@/types/database.types'
import { NotFoundError } from '@/lib/errors'

export const profileService = {
  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data
  },

  /**
   * Create a new user profile
   */
  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile as any)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      // @ts-ignore - Supabase types not properly inferred
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Profile not found')
      }
      throw error
    }

    return data
  },

  /**
   * Get or create profile for a user
   */
  async getOrCreateProfile(userId: string, email?: string, defaultData?: Partial<Profile>): Promise<Profile> {
    let profile = await this.getUserProfile(userId)

    if (!profile) {
      if (!email) throw new Error('Email is required to create a profile')
      
      profile = await this.createProfile({
        id: userId,
        email: email,
        display_name: defaultData?.display_name || null,
        avatar_url: defaultData?.avatar_url || null,
        bio: defaultData?.bio || null,
      })
    }

    return profile
  },

  /**
   * Upload avatar image
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error
  },
}
