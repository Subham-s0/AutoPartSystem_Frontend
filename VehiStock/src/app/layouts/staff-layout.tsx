import { ClipboardList, Plus } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { getNavigationForRole } from '@/app/config/navigation'
import { getPageMeta } from '@/app/config/routes'
import { AppHeader } from '@/components/shared/app-header'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { ROLE_NAMES } from '@/constants/roles'
import { useAuth } from '@/hooks/use-auth'

export function StaffLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const pageMeta = getPageMeta(location.pathname)

  return (
    <div className="layout">
      <AppSidebar
        brandSubtitle="Sales & Service"
        brandTitle="VehiStock"
        profileName={user?.fullName ?? 'Staff User'}
        profileRole={user?.role ?? ROLE_NAMES.staff}
        sections={getNavigationForRole(ROLE_NAMES.staff)}
      />
      <main className="main">
        <AppHeader
          subtitle={pageMeta.subtitle}
          title={pageMeta.title}
          actions={
            <>
              <button className="tb-btn" type="button">
                <ClipboardList size={13} />
                Daily Report
              </button>
              <button className="tb-btn primary" type="button">
                <Plus size={13} />
                New Sale
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
