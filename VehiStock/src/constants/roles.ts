export const ROLE_NAMES = {
  admin: 'Admin',
  staff: 'Staff',
  customer: 'Customer',
} as const

export type UserRole = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES]

export const ALL_ROLES = Object.values(ROLE_NAMES)
