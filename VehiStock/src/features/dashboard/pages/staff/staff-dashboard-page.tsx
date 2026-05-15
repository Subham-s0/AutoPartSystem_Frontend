import { CalendarDays, ClipboardList, ShoppingCart, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
import { PageSection } from '@/components/shared/page-section'

const staffModules = [
  {
    title: 'Customer sales',
    description: 'Counter sales and walk-in order handling.',
    icon: ShoppingCart,
    href: ROUTE_PATHS.staff.customerSales,
  },
  {
    title: 'Appointments',
    description: 'Workshop scheduling and service queue handling.',
    icon: CalendarDays,
    href: ROUTE_PATHS.staff.appointments,
  },
  {
    title: 'Sales invoices',
    description: 'Invoice creation and payment workflow.',
    icon: ClipboardList,
    href: ROUTE_PATHS.staff.salesInvoices,
  },
  {
    title: 'Customer reports',
    description: 'Regular buyers, high spenders, and pending credits.',
    icon: Users,
    href: ROUTE_PATHS.staff.customerReports,
  },
]

export function StaffDashboardPage() {
  return (
    <PageSection
      description="The staff area keeps its route structure without showing fake counters or sample daily activity."
      title="Staff Overview"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {staffModules.map((module) => (
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
  )
}
