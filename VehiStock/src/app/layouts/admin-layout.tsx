import { Download, Plus } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { getNavigationForRole } from '@/app/config/navigation'
import { getPageMeta } from '@/app/config/routes'
import { AppHeader } from '@/components/shared/app-header'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { ROLE_NAMES } from '@/constants/roles'
import { useAuth } from '@/hooks/use-auth'

export function AdminLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const pageMeta = getPageMeta(location.pathname)

  return (
    <div className="layout">
      <AppSidebar
        brandSubtitle="Operations Hub"
        brandTitle="VehiStock"
        profileName={user?.fullName ?? 'Admin User'}
        profileRole={user?.role ?? ROLE_NAMES.admin}
        sections={getNavigationForRole(ROLE_NAMES.admin)}
      />
      <main className="main">
        <AppHeader
          subtitle={pageMeta.subtitle}
          title={pageMeta.title}
          actions={
            <>
              <button className="tb-btn" type="button">
                <Download size={13} />
                Export
              </button>
              <button className="tb-btn primary" type="button">
                <Plus size={13} />
                Add Part
              </button>
            </>
          }
        />
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
