import { CalendarDays, Wrench } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { getNavigationForRole } from '@/app/config/navigation'
import { getPageMeta } from '@/app/config/routes'
import { AppHeader } from '@/components/shared/app-header'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { ROLE_NAMES } from '@/constants/roles'
import { useAuth } from '@/hooks/use-auth'

export function CustomerLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const pageMeta = getPageMeta(location.pathname)

  return (
    <div className="layout">
      <AppSidebar
        brandSubtitle="Customer Self Service"
        brandTitle="VehiStock"
        profileName={user?.fullName ?? 'Customer User'}
        profileRole={user?.role ?? ROLE_NAMES.customer}
        sections={getNavigationForRole(ROLE_NAMES.customer)}
      />
      <main className="main">
        <AppHeader
          subtitle={pageMeta.subtitle}
          title={pageMeta.title}
          actions={
            <>
              <button className="tb-btn" type="button">
                <Wrench size={13} />
                Request Part
              </button>
              <button className="tb-btn primary" type="button">
                <CalendarDays size={13} />
                Book Service
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
