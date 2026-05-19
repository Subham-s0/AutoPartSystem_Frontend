export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  errors?: unknown
}

export interface PaginatedResponse<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalRecords: number
  totalPages: number
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  skipAuth?: boolean
  skipAuthRefresh?: boolean
}

export class ApiError extends Error {
  status: number
  errors?: unknown

  constructor(message: string, status = 500, errors?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}
