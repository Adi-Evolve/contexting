'use client'

import { useState, useEffect } from 'react'
import { Issue } from '@/types/database.types'
import { IssueCreatePayload, IssueUpdatePayload, IssueFilters } from '@/types/api.types'
import { issueService } from '@/services'
import { useAuth } from './useAuth'

export function useIssues(filters?: IssueFilters) {
  const { user } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadIssues()
  }, [filters?.userId, filters?.status, filters?.search]) // Fixed: Use specific filter properties instead of the entire object

  const loadIssues = async () => {
    try {
      setLoading(true)
      const data = await issueService.getIssues(filters)
      setIssues(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load issues:', err)
      // Set empty array on error to prevent infinite loading
      setIssues([])
    } finally {
      setLoading(false)
    }
  }

  const createIssue = async (payload: IssueCreatePayload) => {
    if (!user) throw new Error('No authenticated user')

    try {
      const newIssue = await issueService.createIssue(user.id, payload)
      setIssues((prev) => [newIssue, ...prev])
      return newIssue
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const updateIssue = async (issueId: string, payload: IssueUpdatePayload) => {
    if (!user) throw new Error('No authenticated user')

    try {
      const updated = await issueService.updateIssue(issueId, user.id, payload)
      setIssues((prev) =>
        prev.map((issue) => (issue.id === issueId ? updated : issue))
      )
      return updated
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const deleteIssue = async (issueId: string) => {
    if (!user) throw new Error('No authenticated user')

    try {
      await issueService.deleteIssue(issueId, user.id)
      setIssues((prev) => prev.filter((issue) => issue.id !== issueId))
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  return {
    issues,
    loading,
    error,
    createIssue,
    updateIssue,
    deleteIssue,
    refresh: loadIssues,
  }
}
