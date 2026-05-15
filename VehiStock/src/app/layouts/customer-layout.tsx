import { CalendarDays, Wrench } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { getNavigationForRole } from '@/app/config/navigation'
import { AppHeader } from '@/components/shared/app-header'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { ROUTE_PATHS } from '@/app/config/routes'
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
              <Link className="tb-btn" to={ROUTE_PATHS.customer.partRequests}>
                <Wrench size={13} />
                Request Parts
              </Link>
              <Link className="tb-btn primary" to={ROUTE_PATHS.customer.bookAppointment}>
                <CalendarDays size={13} />
                Book Appointment
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
