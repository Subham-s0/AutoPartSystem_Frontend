import { CalendarDays } from 'lucide-react'
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder'
import { PageSection } from '@/components/shared/page-section'

export function AppointmentsPage() {
  return (
    <PageSection
      description="This route supports appointment scheduling and the staff-side workshop queue."
      title="Appointments"
    >
      <FeaturePlaceholder
        description="Customer appointment handling will sit here once the staff-side workflow is connected. For now, the route is reserved without fake service queues."
        icon={CalendarDays}
        notes={[
          'Workshop queue and appointment approval belong here.',
          'No sample customer bookings are shown.',
        ]}
        title="Staff appointment queue is not connected yet"
      />
    </PageSection>
  )
}
