import type { UserRole } from '@/constants/roles'

export interface BackendAuthPayload {
  succeeded?: boolean
  userId?: string | null
  email?: string | null
  fullName?: string | null
  role?: UserRole | string | null
  customerId?: number | null
  staffMemberId?: number | null
  accessToken?: string | null
  accessTokenExpiresAtUtc?: string | null
  refreshToken?: string | null
  refreshTokenExpiresAtUtc?: string | null
  errors?: string[]
}
