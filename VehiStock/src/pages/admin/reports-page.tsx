import { BarChart3 } from 'lucide-react'
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder'
import { PageSection } from '@/components/shared/page-section'

export function ReportsPage() {
  return (
    <PageSection
      description="This route will host admin reporting once the related backend modules are ready to support it."
      title="Business Reports"
    >
      <FeaturePlaceholder
        description="Admin reports should be driven by actual invoice, stock, and customer datasets. Until that is connected, this page avoids sample charts and fake totals."
        icon={BarChart3}
        notes={[
          'Inventory performance belongs here.',
          'Financial summaries belong here.',
          'Cross-cutting admin reports belong here.',
        ]}
        title="Reporting UI is reserved, not simulated"
      />
    </PageSection>
  )
}
