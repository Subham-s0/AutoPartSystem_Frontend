import { ClipboardList, Plus } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { getNavigationForRole } from '@/app/config/navigation'
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
