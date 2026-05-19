import * as React from 'react'
import {
  login,
  loginWithGoogle,
  logout,
  refresh,
  registerCustomer as registerCustomerRequest,
} from '@/features/auth/api/auth-api'
import { mapAuthResponseToSession } from '@/features/auth/utils/session-mapper'
import { clearAuthSession, loadAuthSession, onAuthSessionChange } from '@/services/auth-storage'
import { tokenManager } from '@/services/token-manager'
import { isDateExpired } from '@/lib/date'
import type {
  GoogleLoginInput,
  AuthSession,
  LoginCredentials,
  RegisterCustomerInput,
} from '@/types/auth'
import type { AuthContextValue } from '@/types/auth'
import { AuthContext } from './auth-context'

async function restoreSession() {
  const storedSession = loadAuthSession()

  if (!storedSession) {
    return null
  }

  if (!isDateExpired(storedSession.accessTokenExpiresAtUtc)) {
    return storedSession
  }

  if (isDateExpired(storedSession.refreshTokenExpiresAtUtc)) {
    clearAuthSession()
    return null
  }

  const nextSession = mapAuthResponseToSession(
    await refresh(storedSession.refreshToken),
  )
  tokenManager.setSession(nextSession)
  return nextSession
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = React.useState<AuthSession | null>(null)
  const [isHydrating, setIsHydrating] = React.useState(true)

  React.useEffect(() => {
    let isMounted = true

    restoreSession()
      .then((restoredSession) => {
        if (isMounted) {
          setSession(restoredSession)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsHydrating(false)
        }
      })

    const unsubscribe = onAuthSessionChange((nextSession) => {
      if (isMounted) {
        setSession(nextSession)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const signIn = React.useCallback(async (credentials: LoginCredentials) => {
    const nextSession = mapAuthResponseToSession(await login(credentials))
    tokenManager.setSession(nextSession)
    setSession(nextSession)
    return nextSession
  }, [])

  const signInWithGoogle = React.useCallback(
    async (input: GoogleLoginInput) => {
      const nextSession = mapAuthResponseToSession(await loginWithGoogle(input))
      tokenManager.setSession(nextSession)
      setSession(nextSession)
      return nextSession
    },
    [],
  )

  const registerCustomer = React.useCallback(
    async (input: RegisterCustomerInput) => {
      await registerCustomerRequest(input)

      const nextSession = mapAuthResponseToSession(
        await login({
          email: input.email,
          password: input.password,
        }),
      )

      tokenManager.setSession(nextSession)
      setSession(nextSession)
      return nextSession
    },
    [],
  )

  const refreshSession = React.useCallback(async () => {
    const currentSession = loadAuthSession()
    if (!currentSession?.refreshToken) {
      clearAuthSession()
      setSession(null)
      return null
    }

    const nextSession = mapAuthResponseToSession(
      await refresh(currentSession.refreshToken),
    )
    tokenManager.setSession(nextSession)
    setSession(nextSession)
    return nextSession
  }, [])

  const signOut = React.useCallback(async () => {
    const currentRefreshToken = tokenManager.getRefreshToken()
    if (currentRefreshToken) {
      try {
        await logout(currentRefreshToken)
      } catch {
        // Intentionally ignored so local logout always succeeds.
      }
    }

    tokenManager.clearSession()
    setSession(null)
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session?.accessToken,
      isHydrating,
      signIn,
      signInWithGoogle,
      registerCustomer,
      signOut,
      refreshSession,
    }),
    [
      isHydrating,
      refreshSession,
      registerCustomer,
      session,
      signIn,
      signInWithGoogle,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
