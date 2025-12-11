'use client'

import React, { useState } from 'react'
import { Layout, ProtectedRoute } from '@/components/layout'
import { Card, Button, Input, Textarea, LoadingSpinner, Alert } from '@/components/ui'
import { useAuth, useIssues } from '@/hooks'
import { formatRelativeTime } from '@/lib/utils'

export default function ReportIssuePage() {
  return (
    <ProtectedRoute>
      <ReportIssueContent />
    </ProtectedRoute>
  )
}

function ReportIssueContent() {
  const { user } = useAuth()
  const { issues, loading, createIssue, deleteIssue } = useIssues({ userId: user?.id })
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters'
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Description is required'
    } else if (formData.body.length < 10) {
      newErrors.body = 'Description must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    try {
      setIsSubmitting(true)
      setAlert(null)
      await createIssue(formData)
      setFormData({ title: '', body: '' })
      setAlert({ type: 'success', message: 'Issue reported successfully!' })
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to create issue' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (issueId: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) return

    try {
      await deleteIssue(issueId)
      setAlert({ type: 'success', message: 'Issue deleted successfully!' })
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to delete issue' })
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Report an Issue</h1>
          <p className="text-gray-400 text-lg mb-8">
            Share feedback, report bugs, or suggest new features
          </p>

          {alert && (
            <div className="mb-6">
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Create Issue Form */}
            <Card title="Submit New Issue">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  error={errors.title}
                  placeholder="Brief description of the issue"
                  disabled={isSubmitting}
                />

                <Textarea
                  label="Description"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  error={errors.body}
                  placeholder="Provide detailed information about the issue..."
                  rows={6}
                  disabled={isSubmitting}
                />

                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Submit Issue
                </Button>
              </form>
            </Card>

            {/* Issues List */}
            <Card title="Your Issues">
              {loading ? (
                <div className="py-12">
                  <LoadingSpinner />
                </div>
              ) : issues.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">No issues yet</p>
                  <p className="text-sm text-gray-500">
                    Submit your first issue using the form
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {issues.map((issue) => (
                    <ComicIssueCard
                      key={issue.id}
                      issue={issue}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Comic-styled issue card component
function ComicIssueCard({ issue, onDelete }: { issue: any; onDelete: (id: string) => void }) {
  return (
    <div className="relative p-4 bg-gradient-to-br from-void-dark to-void-darker border-2 border-gray-700 rounded-lg hover:border-void-primary transition-all group">
      {/* Comic book style border effect */}
      <div className="absolute top-0 left-0 w-full h-full border-2 border-void-primary/20 rounded-lg transform translate-x-1 translate-y-1 -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-bold text-white text-lg leading-tight flex-1">
          {issue.title}
        </h4>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
            issue.status === 'open' ? 'bg-void-primary/20 text-void-primary border border-void-primary' :
            issue.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400' :
            issue.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-400' :
            'bg-gray-700 text-gray-300 border border-gray-600'
          }`}>
            {issue.status}
          </span>
          <button
            onClick={() => onDelete(issue.id)}
            className="text-red-400 hover:text-red-300 transition-colors"
            title="Delete issue"
          >
            🗑️
          </button>
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
        {issue.body}
      </p>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>📅</span>
        <span>{formatRelativeTime(issue.created_at)}</span>
      </div>

      {/* Comic book style speech bubble tail */}
      <div className="absolute -bottom-2 left-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-700 opacity-50" />
    </div>
  )
}
