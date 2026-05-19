import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { RegisterStaffInput, RegisterUserResult } from '@/features/staff-management/types/staff-management'
import type {
  GoogleLoginInput,
  LoginCredentials,
  RegisterCustomerInput,
} from '@/types/auth'
import type { BackendAuthPayload } from '@/features/auth/types'

export function login(credentials: LoginCredentials) {
  return apiRequest<BackendAuthPayload>(API_ROUTES.auth.login, {
    method: 'POST',
    body: credentials,
    skipAuth: true,
    skipAuthRefresh: true,
  })
}

export function refresh(refreshToken: string) {
  return apiRequest<BackendAuthPayload>(API_ROUTES.auth.refresh, {
    method: 'POST',
    body: { refreshToken },
    skipAuth: true,
    skipAuthRefresh: true,
  })
}

export function logout(refreshToken: string) {
  return apiRequest<string>(API_ROUTES.auth.logout, {
    method: 'POST',
    body: { refreshToken },
    skipAuth: true,
    skipAuthRefresh: true,
  })
}

export function loginWithGoogle(input: GoogleLoginInput) {
  return apiRequest<BackendAuthPayload>(API_ROUTES.auth.googleLogin, {
    method: 'POST',
    body: input,
    skipAuth: true,
    skipAuthRefresh: true,
  })
}

export function registerCustomer(input: RegisterCustomerInput) {
  return apiRequest<RegisterUserResult>(API_ROUTES.auth.customerRegister, {
    method: 'POST',
    body: input,
    skipAuth: true,
    skipAuthRefresh: true,
  })
}

export function registerStaff(input: RegisterStaffInput) {
  return apiRequest(API_ROUTES.auth.staffRegister, {
    method: 'POST',
    body: input,
  })
}

export function forgotPassword(email: string) {
  return apiRequest<void>(API_ROUTES.auth.forgotPassword, {
    method: 'POST',
    body: { email },
    skipAuth: true,
    skipAuthRefresh: true,
  })
}

export function resetPassword(input: { email: string; token: string; newPassword: string }) {
  return apiRequest<void>(API_ROUTES.auth.resetPassword, {
    method: 'POST',
    body: input,
    skipAuth: true,
    skipAuthRefresh: true,
  })
}
