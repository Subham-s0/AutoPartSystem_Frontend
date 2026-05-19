import { Download, Plus } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { getNavigationForRole } from '@/app/config/navigation'
import { AppHeader } from '@/components/shared/app-header'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { ROLE_NAMES } from '@/constants/roles'

export function AdminLayout() {
  return (
    <div className="layout">
      <AppSidebar
        brandSubtitle="Operations Hub"
        brandTitle="VehiStock"
        sections={getNavigationForRole(ROLE_NAMES.admin)}
      />
      <main className="main">
        <AppHeader
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
