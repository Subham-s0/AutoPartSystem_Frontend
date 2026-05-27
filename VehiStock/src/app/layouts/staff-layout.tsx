import { Plus } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import { getNavigationForRole } from '@/app/config/navigation'
import { AppHeader } from '@/components/shared/app-header'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { ROLE_NAMES } from '@/constants/roles'

export function StaffLayout() {
  const navigate = useNavigate()

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
              <button
                className="tb-btn primary"
                type="button"
                onClick={() => navigate('/staff/sales-invoices?tab=create')}
              >
                <Plus size={13} />
                New Sale
              </button>
              <button
                className="tb-btn primary"
                type="button"
                onClick={() => navigate('/staff/service-records?tab=create')}
              >
                <Plus size={13} />
                New Service
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
