import type { AppUser } from '@/types/user'

export interface AuthTokens {
  accessToken: string
  accessTokenExpiresAtUtc: string
  refreshToken: string
  refreshTokenExpiresAtUtc: string
}

export interface AuthSession extends AuthTokens {
  user: AppUser
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface GoogleLoginInput {
  idToken: string
  address?: string
}

export interface RegisterCustomerInput {
  fullName: string
  email: string
  password: string
  phoneNumber?: string
  address: string
  profilePhotoUrl?: string
}

export interface AuthContextValue {
  session: AuthSession | null
  user: AppUser | null
  isAuthenticated: boolean
  isHydrating: boolean
  signIn: (credentials: LoginCredentials) => Promise<AuthSession>
  signInWithGoogle: (input: GoogleLoginInput) => Promise<AuthSession>
  registerCustomer: (input: RegisterCustomerInput) => Promise<AuthSession>
  signOut: () => Promise<void>
  refreshSession: () => Promise<AuthSession | null>
}
