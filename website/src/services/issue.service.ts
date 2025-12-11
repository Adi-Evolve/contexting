import { supabase } from '@/lib/supabase/client'
import { Issue, IssueStatus } from '@/types/database.types'
import { IssueCreatePayload, IssueUpdatePayload, IssueFilters } from '@/types/api.types'
import { NotFoundError, ForbiddenError } from '@/lib/errors'

export const issueService = {
  /**
   * Create a new issue
   */
  async createIssue(userId: string, payload: IssueCreatePayload): Promise<Issue> {
    const { data, error } = await supabase
      .from('issues')
      .insert({
        user_id: userId,
        title: payload.title,
        body: payload.body,
        status: 'open' as IssueStatus,
      } as any)
      .select(`
        *,
        profile:profiles(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get all issues with optional filters
   */
  async getIssues(filters?: IssueFilters): Promise<Issue[]> {
    let query = supabase
      .from('issues')
      .select(`
        *,
        profile:profiles(*)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,body.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      // If table doesn't exist (404), return empty array instead of throwing
      if (error.code === 'PGRST116' || error.message.includes('404')) {
        console.warn('Issues table not found in database. Please set up the database schema.')
        return []
      }
      throw error
    }
    return data || []
  },

  /**
   * Get a single issue by ID
   */
  async getIssueById(issueId: string): Promise<Issue> {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('id', issueId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Issue not found')
      }
      throw error
    }

    return data
  },

  /**
   * Get issues for current user
   */
  async getUserIssues(userId: string): Promise<Issue[]> {
    return this.getIssues({ userId })
  },

  /**
   * Update an issue
   */
  async updateIssue(
    issueId: string,
    userId: string,
    payload: IssueUpdatePayload
  ): Promise<Issue> {
    // First check if user owns this issue
    const issue = await this.getIssueById(issueId)
    
    if (issue.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to update this issue')
    }

    const { data, error } = await supabase
      .from('issues')
      // @ts-ignore - Supabase types not properly inferred
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', issueId)
      .select(`
        *,
        profile:profiles(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete an issue
   */
  async deleteIssue(issueId: string, userId: string): Promise<void> {
    // First check if user owns this issue
    const issue = await this.getIssueById(issueId)
    
    if (issue.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to delete this issue')
    }

    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId)

    if (error) throw error
  },

  /**
   * Update issue status (admin only in production)
   */
  async updateIssueStatus(issueId: string, status: IssueStatus): Promise<Issue> {
    const { data, error } = await supabase
      .from('issues')
      // @ts-ignore - Supabase types not properly inferred
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', issueId)
      .select(`
        *,
        profile:profiles(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get issue statistics
   */
  async getIssueStats(): Promise<{
    total: number
    open: number
    inProgress: number
    resolved: number
    closed: number
  }> {
    const { data: allIssues, error } = await supabase
      .from('issues')
      .select('status')

    if (error) throw error

    const stats = {
      total: allIssues?.length || 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    }

    allIssues?.forEach((issue: any) => {
      switch (issue.status) {
        case 'open':
          stats.open++
          break
        case 'in-progress':
          stats.inProgress++
          break
        case 'resolved':
          stats.resolved++
          break
        case 'closed':
          stats.closed++
          break
      }
    })

    return stats
  },
}
