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
          actions={null}
        />
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
