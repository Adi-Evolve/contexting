import { supabase } from '@/lib/supabase/client'
import { AuthUser } from '@/types/database.types'
import { AuthError } from '@/lib/errors'

export const authService = {
  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw new AuthError(error.message)
      return user as AuthUser
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw new AuthError(error.message)
    return data
  },

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })

    if (error) throw new AuthError(error.message)
    return data
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    console.log('Auth service: Starting Google OAuth flow...')
    console.log('Redirect URL:', `${window.location.origin}/auth/callback`)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('Google OAuth error:', error)
      throw new AuthError(error.message)
    }
    
    console.log('Google OAuth response:', data)
    return data
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new AuthError(error.message)
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw new AuthError(error.message)
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw new AuthError(error.message)
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event: any, session: any) => {
      const user = session?.user ? {
        id: session.user.id,
        email: session.user.email,
      } as AuthUser : null
      callback(user)
    })
  },
}
