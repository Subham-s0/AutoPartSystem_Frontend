import * as React from 'react'
import { LogOut, Package } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
import { useAuth } from '@/hooks/use-auth'
import type { NavigationSection } from '@/types/common'

interface AppSidebarProps {
  sections: NavigationSection[]
  brandTitle: string
  brandSubtitle: string
}

export function AppSidebar({
  sections,
  brandTitle,
  brandSubtitle,
}: AppSidebarProps) {
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

  function shouldUseExactMatch(path: string) {
    return (
      path === ROUTE_PATHS.admin.dashboard ||
      path === ROUTE_PATHS.staff.dashboard ||
      path === ROUTE_PATHS.customer.dashboard
    )
  }

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="mark">
          <Package />
        </div>
        <div>
          <div className="logo-text">{brandTitle}</div>
          <div className="logo-sub">{brandSubtitle}</div>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <div className="sb-section">{section.title}</div>
          <ul className="sb-nav">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                  end={shouldUseExactMatch(item.to)}
                  to={item.to}
                >
                  <item.icon />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="sb-footer">
        <button
          className="sb-logout"
          disabled={isSigningOut}
          onClick={() => void handleLogout()}
          type="button"
        >
          <LogOut size={15} />
          {isSigningOut ? 'Signing out...' : 'Logout'}
        </button>
      </div>
    </aside>
  )
}
