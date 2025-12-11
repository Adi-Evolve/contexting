'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Layout } from '@/components/layout'
import { Button, Input, Alert, ComicPanel } from '@/components/ui'
import { useAuth } from '@/hooks'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'login'
  const router = useRouter()
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isSignup = mode === 'signup'

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (isSignup) {
      if (!formData.displayName) {
        newErrors.displayName = 'Display name is required'
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    try {
      setLoading(true)
      setAlert(null)

      if (isSignup) {
        await signUp(formData.email, formData.password, formData.displayName)
        setAlert({
          type: 'success',
          message: 'Account created! Redirecting to dashboard...',
        })
      } else {
        await signIn(formData.email, formData.password)
        setAlert({
          type: 'success',
          message: 'Logged in successfully! Redirecting...',
        })
      }

      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'An error occurred',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setAlert(null)
      console.log('Initiating Google sign-in...')
      await signInWithGoogle()
      console.log('Google sign-in completed')
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      setAlert({
        type: 'error',
        message: error.message || 'Failed to sign in with Google',
      })
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-void-black bg-[url('/grid.svg')] bg-fixed py-12 px-4">
        <div className="w-full max-w-md relative">
          {/* Decorative elements */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-void-purple/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-void-cyan/20 rounded-full blur-2xl animate-pulse delay-700" />
          
          <ComicPanel 
            variant="default" 
            caption={isSignup ? "NEW OPERATIVE REGISTRATION" : "OPERATIVE LOGIN"}
            className="bg-void-darker border-void-purple shadow-[8px_8px_0px_rgba(124,58,237,0.3)]"
          >
            <div className="p-6 space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-display text-white mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  {isSignup ? 'JOIN THE VOID' : 'WELCOME BACK'}
                </h1>
                <p className="text-void-cyan font-sans uppercase tracking-widest text-sm">
                  {isSignup ? 'Initialize Neural Link' : 'Authenticate Identity'}
                </p>
              </div>

              {alert && (
                <Alert type={alert.type} message={alert.message} />
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <Input
                    label="Codename"
                    placeholder="Enter your display name"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    error={errors.displayName}
                  />
                )}

                <Input
                  label="Neural ID (Email)"
                  type="email"
                  placeholder="operative@void.net"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                />

                <Input
                  label="Access Code"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                />

                {isSignup && (
                  <Input
                    label="Confirm Access Code"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full mt-6 font-display text-xl tracking-wider"
                  variant="primary"
                  isLoading={loading}
                >
                  {isSignup ? 'INITIALIZE SYSTEM' : 'ACCESS SYSTEM'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-void-darker text-gray-400 font-sans uppercase">Or authenticate with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 font-sans font-bold"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                GOOGLE NEURAL LINK
              </Button>

              <div className="text-center mt-6">
                <p className="text-gray-400 font-sans text-sm">
                  {isSignup ? 'Already an operative?' : 'New to the system?'}
                  <Link
                    href={isSignup ? '/login' : '/login?mode=signup'}
                    className="ml-2 text-void-cyan hover:text-void-purple transition-colors font-bold uppercase tracking-wide"
                  >
                    {isSignup ? 'Login' : 'Register'}
                  </Link>
                </p>
              </div>
            </div>
          </ComicPanel>
        </div>
      </div>
    </Layout>
  )
}
