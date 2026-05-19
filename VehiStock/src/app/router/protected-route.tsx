import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
import { useAuth } from '@/hooks/use-auth'

export function ProtectedRoute() {
  const { isAuthenticated, isHydrating } = useAuth()
  const location = useLocation()

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--vs-muted)]">
        Restoring your session...
      </div>
    )
  }

  if (!isAuthenticated) {
    const loginPath = location.pathname.startsWith('/admin')
      ? ROUTE_PATHS.adminLogin
      : ROUTE_PATHS.login

    return (
      <Navigate
        replace
        state={{ from: location.pathname }}
        to={loginPath}
      />
    )
  }

  return <Outlet />
}
