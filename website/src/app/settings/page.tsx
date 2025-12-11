'use client'

import React, { useState } from 'react'
import { Layout, ProtectedRoute } from '@/components/layout'
import { Card, Button, Input, Alert } from '@/components/ui'
import { useAuth } from '@/hooks'
import { authService } from '@/services'

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const { user } = useAuth()
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Password change state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match' })
      return
    }

    if (passwordData.newPassword.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters' })
      return
    }

    try {
      setIsChangingPassword(true)
      setAlert(null)
      await authService.updatePassword(passwordData.newPassword)
      setAlert({ type: 'success', message: 'Password updated successfully!' })
      setPasswordData({ newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to update password' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Settings</h1>

          {alert && (
            <div className="mb-6">
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            </div>
          )}

          {/* Account Settings */}
          <Card title="Account Settings" className="mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <p className="text-white bg-void-dark px-4 py-2 rounded-lg border border-gray-800">
                  {user?.email}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Email cannot be changed at this time
                </p>
              </div>
            </div>
          </Card>

          {/* Password Settings */}
          <Card title="Change Password" className="mb-6">
            <div className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
                disabled={isChangingPassword}
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                disabled={isChangingPassword}
              />

              <Button
                variant="primary"
                onClick={handlePasswordChange}
                isLoading={isChangingPassword}
              >
                Update Password
              </Button>
            </div>
          </Card>

          {/* Preferences */}
          <Card title="Preferences" className="mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <h4 className="font-medium text-white">Email Notifications</h4>
                  <p className="text-sm text-gray-400">Receive updates about your issues</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-void-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-void-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <h4 className="font-medium text-white">Dark Mode</h4>
                  <p className="text-sm text-gray-400">Always enabled for VOID</p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                  <input type="checkbox" className="sr-only peer" checked disabled />
                  <div className="w-11 h-6 bg-void-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="font-medium text-white">3D Effects</h4>
                  <p className="text-sm text-gray-400">Enable 3D comic book animations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-void-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-void-primary"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card title="Danger Zone" className="border-red-500/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="font-medium text-red-400">Delete Account</h4>
                  <p className="text-sm text-gray-400">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
