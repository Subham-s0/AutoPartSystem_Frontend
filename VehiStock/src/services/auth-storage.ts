import { APP_CONFIG } from '@/constants/app-config'
import type { AuthSession } from '@/types/auth'

const AUTH_SESSION_EVENT = 'vehistock:auth-session-changed'

function isBrowser() {
  return typeof window !== 'undefined'
}

function dispatchSessionChange(session: AuthSession | null) {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(
    new CustomEvent<AuthSession | null>(AUTH_SESSION_EVENT, {
      detail: session,
    }),
  )
}

export function loadAuthSession() {
  if (!isBrowser()) {
    return null
  }

  const raw = window.localStorage.getItem(APP_CONFIG.authStorageKey)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    window.localStorage.removeItem(APP_CONFIG.authStorageKey)
    return null
  }
}

export function saveAuthSession(session: AuthSession) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(
    APP_CONFIG.authStorageKey,
    JSON.stringify(session),
  )
  dispatchSessionChange(session)
}

export function clearAuthSession() {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(APP_CONFIG.authStorageKey)
  dispatchSessionChange(null)
}

export function onAuthSessionChange(
  listener: (session: AuthSession | null) => void,
) {
  if (!isBrowser()) {
    return () => undefined
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === APP_CONFIG.authStorageKey) {
      listener(loadAuthSession())
    }
  }

  const handleCustomEvent = (event: Event) => {
    listener((event as CustomEvent<AuthSession | null>).detail ?? null)
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(AUTH_SESSION_EVENT, handleCustomEvent)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(AUTH_SESSION_EVENT, handleCustomEvent)
  }
}
