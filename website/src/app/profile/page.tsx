'use client'

import React, { useState } from 'react'
import { Layout, ProtectedRoute } from '@/components/layout'
import { Card, Button, Input, Textarea, LoadingSpinner, Alert } from '@/components/ui'
import { useAuth, useProfile } from '@/hooks'
import { getInitials } from '@/lib/utils'

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}

function ProfileContent() {
  const { user } = useAuth()
  const { profile, loading, updateProfile, uploadAvatar } = useProfile()
  
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  React.useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
      })
    }
  }, [profile])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setAlert(null)
      await updateProfile(formData)
      setIsEditing(false)
      setAlert({ type: 'success', message: 'Profile updated successfully!' })
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to update profile' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'error', message: 'File size must be less than 5MB' })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAlert({ type: 'error', message: 'File must be an image' })
      return
    }

    try {
      setIsSaving(true)
      setAlert(null)
      await uploadAvatar(file)
      setAlert({ type: 'success', message: 'Avatar updated successfully!' })
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to upload avatar' })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Profile</h1>

          {alert && (
            <div className="mb-6">
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            </div>
          )}

          {/* Avatar Section */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-void-primary"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-void-primary to-void-secondary flex items-center justify-center text-3xl font-bold border-4 border-void-primary">
                    {getInitials(profile?.display_name || user?.email || 'U')}
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-10 h-10 bg-void-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-void-primary/80 transition-colors"
                >
                  <span className="text-xl">📷</span>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isSaving}
                  />
                </label>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-1">
                  {profile?.display_name || 'No name set'}
                </h2>
                <p className="text-gray-400 mb-2">{user?.email}</p>
                <p className="text-sm text-gray-500">
                  Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Profile Information */}
          <Card title="Profile Information">
            <div className="space-y-4">
              <Input
                label="Display Name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                disabled={!isEditing || isSaving}
                placeholder="Enter your display name"
              />

              <Textarea
                label="Bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing || isSaving}
                placeholder="Tell us about yourself..."
                rows={4}
              />

              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      isLoading={isSaving}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          display_name: profile?.display_name || '',
                          bio: profile?.bio || '',
                        })
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Account Information */}
          <Card title="Account Information" className="mt-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Email</span>
                <span className="text-white">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">User ID</span>
                <span className="text-white font-mono text-xs">{user?.id}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Account Status</span>
                <span className="text-green-400">Active</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
