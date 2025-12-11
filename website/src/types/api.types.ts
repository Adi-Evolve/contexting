export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface IssueFilters {
  status?: string
  userId?: string
  search?: string
}

export interface IssueCreatePayload {
  title: string
  body: string
}

export interface IssueUpdatePayload {
  title?: string
  body?: string
  status?: string
}
