import type { UserRole } from '@/constants/roles'

export interface AppUser {
  userId: string
  email: string
  fullName: string
  role: UserRole
  customerId?: number | null
  staffMemberId?: number | null
}
