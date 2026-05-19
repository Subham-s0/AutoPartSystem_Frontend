import { ClipboardList, Plus } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { getNavigationForRole } from '@/app/config/navigation'
import { ROUTE_PATHS } from '@/app/config/routes'
import { AppHeader } from '@/components/shared/app-header'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { ROLE_NAMES } from '@/constants/roles'

export function StaffLayout() {
  return (
    <div className="layout">
      <AppSidebar
        brandSubtitle="Sales & Service"
        brandTitle="VehiStock"
        sections={getNavigationForRole(ROLE_NAMES.staff)}
      />
      <main className="main">
        <AppHeader
          actions={
            <>
              <button className="tb-btn" type="button">
                <ClipboardList size={13} />
                Daily Report
              </button>
              <Link className="tb-btn primary" to={ROUTE_PATHS.staff.sellParts}>
                <Plus size={13} />
                New Sale
              </Link>
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
