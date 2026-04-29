import { CalendarDays, Wrench } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { getNavigationForRole } from '@/app/config/navigation'
import { AppHeader } from '@/components/shared/app-header'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { ROLE_NAMES } from '@/constants/roles'

export function CustomerLayout() {
  return (
    <div className="layout">
      <AppSidebar
        brandSubtitle="Customer Self Service"
        brandTitle="VehiStock"
        sections={getNavigationForRole(ROLE_NAMES.customer)}
      />
      <main className="main">
        <AppHeader
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
