import { clearAuthSession, loadAuthSession, saveAuthSession } from './auth-storage'

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000

export const tokenManager = {
  getSession: loadAuthSession,
  setSession: saveAuthSession,
  clearSession: clearAuthSession,
  getAccessToken: () => loadAuthSession()?.accessToken ?? null,
  getRefreshToken: () => loadAuthSession()?.refreshToken ?? null,
  isAccessTokenExpired: (expiresAtUtc: string) =>
    new Date(expiresAtUtc).getTime() <= Date.now(),
  isRefreshTokenExpired: (expiresAtUtc: string) =>
    new Date(expiresAtUtc).getTime() <= Date.now(),
  shouldRefreshAccessToken: (expiresAtUtc: string) =>
    new Date(expiresAtUtc).getTime() <= Date.now() + ACCESS_TOKEN_REFRESH_BUFFER_MS,
}
