import { API_ROUTES } from '@/constants/api-routes'
import { APP_CONFIG } from '@/constants/app-config'
import { mapAuthResponseToSession } from '@/features/auth/utils/session-mapper'
import { ApiError, type ApiRequestOptions, type ApiResponse } from '@/types/api'
import type { AuthSession } from '@/types/auth'
import { clearAuthSession, loadAuthSession } from './auth-storage'
import { tokenManager } from './token-manager'

function buildApiUrl(path: string) {
  return path.startsWith('http') ? path : `${APP_CONFIG.apiBaseUrl}${path}`
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    !!value &&
    typeof value === 'object' &&
    'success' in value &&
    'message' in value
  )
}

async function parseResponseBody<T>(response: Response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  return JSON.parse(text) as ApiResponse<T> | T
}

function getBodyErrorMessage(body: unknown, fallbackMessage: string) {
  if (isApiResponse(body) && body.message) {
    return body.message
  }

  return fallbackMessage
}

function createRequestBody(body: unknown) {
  if (body === undefined || body === null) {
    return undefined
  }

  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    typeof body === 'string'
  ) {
    return body
  }

  return JSON.stringify(body)
}

async function refreshStoredSession() {
  const session = loadAuthSession()
  if (!session?.refreshToken) {
    clearAuthSession()
    return null
  }

  if (tokenManager.isRefreshTokenExpired(session.refreshTokenExpiresAtUtc)) {
    clearAuthSession()
    return null
  }

  const response = await fetch(buildApiUrl(API_ROUTES.auth.refresh), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken: session.refreshToken,
    }),
  })

  const payload = await parseResponseBody(response)
  if (!response.ok || !payload) {
    clearAuthSession()
    return null
  }

  const data = isApiResponse(payload) ? payload.data : payload
  if (!data) {
    clearAuthSession()
    return null
  }

  const nextSession = mapAuthResponseToSession(data)
  tokenManager.setSession(nextSession)
  return nextSession
}

async function performRequest(
  path: string,
  options: ApiRequestOptions,
  session: AuthSession | null,
) {
  const headers = new Headers(options.headers)
  const requestBody = createRequestBody(options.body)

  if (requestBody && !(requestBody instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!options.skipAuth && session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  return fetch(buildApiUrl(path), {
    ...options,
    headers,
    body: requestBody,
  })
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  let session = loadAuthSession()

  if (
    !options.skipAuth &&
    session &&
    tokenManager.shouldRefreshAccessToken(session.accessTokenExpiresAtUtc) &&
    !options.skipAuthRefresh
  ) {
    session = await refreshStoredSession()
  }

  let response = await performRequest(path, options, session)
  let body = await parseResponseBody<T>(response)

  if (
    response.status === 401 &&
    !options.skipAuth &&
    !options.skipAuthRefresh &&
    tokenManager.getRefreshToken()
  ) {
    session = await refreshStoredSession()
    if (session) {
      response = await performRequest(path, options, session)
      body = await parseResponseBody<T>(response)
    }
  }

  if (!response.ok || (isApiResponse<T>(body) && !body.success)) {
    throw new ApiError(
      getBodyErrorMessage(body, response.statusText || 'Request failed.'),
      response.status,
      isApiResponse(body) ? body.errors : body,
    )
  }

  if (isApiResponse<T>(body)) {
    return body.data as T
  }

  return body as T
}
