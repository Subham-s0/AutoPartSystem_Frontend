import { Navigate, Outlet } from 'react-router-dom'
import { getDefaultPathForRole, ROUTE_PATHS } from '@/app/config/routes'
import type { UserRole } from '@/constants/roles'
import { useAuth } from '@/hooks/use-auth'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate replace to={ROUTE_PATHS.login} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to={getDefaultPathForRole(user.role)} />
  }

  return <Outlet />
}
