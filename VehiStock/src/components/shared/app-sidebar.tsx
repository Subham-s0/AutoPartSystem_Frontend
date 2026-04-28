import { Package } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { NavigationSection } from '@/types/common'

interface AppSidebarProps {
  sections: NavigationSection[]
  brandTitle: string
  brandSubtitle: string
  profileName: string
  profileRole: string
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('')
}

export function AppSidebar({
  sections,
  brandTitle,
  brandSubtitle,
  profileName,
  profileRole,
}: AppSidebarProps) {
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

      <div className="sb-profile">
        <div className="profile-row">
          <div className="avatar">{getInitials(profileName)}</div>
          <div>
            <div className="profile-name">{profileName}</div>
            <div className="profile-role">{profileRole}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
