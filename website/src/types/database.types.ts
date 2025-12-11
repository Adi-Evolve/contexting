export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      issues: {
        Row: Issue
        Insert: Omit<Issue, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Issue, 'id' | 'user_id' | 'created_at'>>
      }
    }
  }
}

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'closed'

export interface Issue {
  id: string
  user_id: string
  title: string
  body: string
  status: IssueStatus
  created_at: string
  updated_at: string
  // Joined data
  profile?: Profile
}

export interface AuthUser {
  id: string
  email?: string
  profile?: Profile
}

export interface SessionData {
  user: AuthUser | null
  loading: boolean
  error: Error | null
}
