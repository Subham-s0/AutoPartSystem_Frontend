import { ClipboardList } from 'lucide-react'
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder'
import { PageSection } from '@/components/shared/page-section'

export function CustomerReportsPage() {
  return (
    <PageSection
      description="This page is reserved for staff-facing customer reports."
      title="Customer Reports"
    >
      <FeaturePlaceholder
        description="Regular customers, high spenders, and pending-credit reports should appear only when the real staff reporting flow is intentionally connected."
        icon={ClipboardList}
        notes={[
          'Regular customer reporting belongs here.',
          'High spender reporting belongs here.',
          'Pending credit reporting belongs here.',
        ]}
        title="Customer report output is deferred"
      />
    </PageSection>
  )
}
