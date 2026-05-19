import { CalendarDays, CarFront, History, Star, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
import { PageSection } from '@/components/shared/page-section'

const customerRoutes = [
  {
    title: 'My vehicles',
    description: 'Review the vehicles linked to your account.',
    icon: CarFront,
    href: ROUTE_PATHS.customer.vehicles,
  },
  {
    title: 'Book appointment',
    description: 'Schedule your next workshop visit.',
    icon: CalendarDays,
    href: ROUTE_PATHS.customer.bookAppointment,
  },
  {
    title: 'Part requests',
    description: 'Request parts that are not currently available.',
    icon: Wrench,
    href: ROUTE_PATHS.customer.partRequests,
  },
  {
    title: 'History',
    description: 'View purchase and service records in one place.',
    icon: History,
    href: ROUTE_PATHS.customer.history,
  },
  {
    title: 'Reviews',
    description: 'Submit feedback for completed services.',
    icon: Star,
    href: ROUTE_PATHS.customer.reviews,
  },
]

export function CustomerDashboardPage() {
  return (
    <PageSection
      description="This dashboard stays focused on self-service navigation instead of showing fake customer counts."
      title="Customer Overview"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {customerRoutes.map((route) => (
          <Link
            key={route.title}
            className="info-card transition hover:-translate-y-0.5 hover:border-[var(--vs-green-600)]"
            to={route.href}
          >
            <div className="info-card-icon">
              <route.icon />
            </div>
            <div className="info-card-title">{route.title}</div>
            <div className="info-card-desc">{route.description}</div>
          </Link>
        ))}
      </div>
    </PageSection>
  )
}
