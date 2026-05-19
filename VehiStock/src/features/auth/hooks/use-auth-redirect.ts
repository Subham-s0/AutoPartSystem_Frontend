import { getDefaultPathForRole } from '@/app/config/routes'
import { useAuth } from '@/hooks/use-auth'

export function useAuthRedirect() {
  const { user } = useAuth()

  return user ? getDefaultPathForRole(user.role) : null
}
