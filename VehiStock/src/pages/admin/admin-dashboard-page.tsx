import { Bell, Boxes, ClipboardList, Users, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder'
import { PageSection } from '@/components/shared/page-section'

const adminModules = [
  {
    title: 'Inventory',
    description: 'Parts, stock movement, and reorder controls will live here.',
    icon: Boxes,
    href: ROUTE_PATHS.admin.inventory,
  },
  {
    title: 'Staff access',
    description: 'Admin-managed staff registration and access control belongs here.',
    icon: Users,
    href: ROUTE_PATHS.admin.staff,
  },
  {
    title: 'Reports',
    description: 'Business, financial, and operational reporting will be surfaced here.',
    icon: ClipboardList,
    href: ROUTE_PATHS.admin.reports,
  },
  {
    title: 'Alerts',
    description: 'Low-stock and overdue-credit notifications are reviewed here.',
    icon: Bell,
    href: ROUTE_PATHS.admin.notifications,
  },
]

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageSection
        description="The admin shell is ready, but this overview is intentionally not showing fake KPIs or sample business activity."
        title="Admin Overview"
      >
        <FeaturePlaceholder
          actions={(
            <Link
              className="inline-flex items-center justify-center rounded-full bg-[var(--vs-green-800)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--vs-green-900)]"
              to={ROUTE_PATHS.admin.notifications}
            >
              Open notifications
            </Link>
          )}
          description="Use this dashboard as the entry point for the admin area. Real inventory, vendor, staff, and reporting summaries can be connected later without redesigning the route structure."
          icon={Wrench}
          notes={[
            'No placeholder counts are shown here.',
            'Each module keeps its own route and can be connected independently later.',
          ]}
          title="Dashboard metrics are intentionally deferred"
        />
      </PageSection>

      <PageSection
        description="These routes are in place now, without pretending they already contain live business totals."
        title="Admin Modules"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {adminModules.map((module) => (
            <Link
              key={module.title}
              className="info-card transition hover:-translate-y-0.5 hover:border-[var(--vs-green-600)]"
              to={module.href}
            >
              <div className="info-card-icon">
                <module.icon />
              </div>
              <div className="info-card-title">{module.title}</div>
              <div className="info-card-desc">{module.description}</div>
            </Link>
          ))}
        </div>
      </PageSection>
    </div>
  )
}
