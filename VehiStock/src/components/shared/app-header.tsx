import * as React from 'react'
import { Bell, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
import { useAuth } from '@/hooks/use-auth'
import type { PropsWithChildren, ReactNode } from 'react'

interface AppHeaderProps {
  title: string
  subtitle: string
  actions?: ReactNode
}

export function AppHeader({ title, subtitle, actions }: PropsWithChildren<AppHeaderProps>) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  async function handleLogout() {
    setIsSigningOut(true)

    try {
      await signOut()
      navigate(ROUTE_PATHS.home, { replace: true })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="topbar">
      <div>
        <div className="page-title">{title}</div>
        <div className="page-sub">{subtitle}</div>
      </div>
      <div className="topbar-right">
        {actions}
        <button
          className="tb-btn"
          disabled={isSigningOut}
          onClick={() => void handleLogout()}
          type="button"
        >
          <LogOut size={13} />
          {isSigningOut ? 'Signing out...' : 'Logout'}
        </button>
        <button
          className="notif"
          type="button"
          aria-label="Open notifications"
        >
          <Bell size={14} />
          <span className="notif-dot" />
        </button>
      </div>
    </header>
  )
}
