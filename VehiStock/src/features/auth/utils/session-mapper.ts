import { ALL_ROLES } from '@/constants/roles'
import type { AuthSession } from '@/types/auth'
import type { AppUser } from '@/types/user'
import type { BackendAuthPayload } from '@/features/auth/types'

function normalizeRole(role: string | null | undefined) {
  const matchedRole = ALL_ROLES.find(
    (candidate) => candidate.toLowerCase() === role?.toLowerCase(),
  )

  if (!matchedRole) {
    throw new Error('The server returned an unsupported user role.')
  }

  return matchedRole
}

export function mapAuthResponseToSession(payload: BackendAuthPayload) {
  if (
    !payload.userId ||
    !payload.email ||
    !payload.fullName ||
    !payload.role ||
    !payload.accessToken ||
    !payload.accessTokenExpiresAtUtc ||
    !payload.refreshToken ||
    !payload.refreshTokenExpiresAtUtc
  ) {
    throw new Error('The authentication response is incomplete.')
  }

  const user: AppUser = {
    userId: payload.userId,
    email: payload.email,
    fullName: payload.fullName,
    role: normalizeRole(payload.role),
    customerId: payload.customerId ?? null,
    staffMemberId: payload.staffMemberId ?? null,
  }

  const session: AuthSession = {
    user,
    accessToken: payload.accessToken,
    accessTokenExpiresAtUtc: payload.accessTokenExpiresAtUtc,
    refreshToken: payload.refreshToken,
    refreshTokenExpiresAtUtc: payload.refreshTokenExpiresAtUtc,
  }

  return session
}
