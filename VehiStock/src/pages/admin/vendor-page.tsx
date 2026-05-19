import { Building2 } from 'lucide-react'
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder'
import { PageSection } from '@/components/shared/page-section'

export function VendorPage() {
  return (
    <PageSection
      description="Supplier records, contact handling, and procurement relationships belong here."
      title="Vendor Management"
    >
      <FeaturePlaceholder
        description="Vendor lists, procurement contacts, and purchase relationships are intentionally not mocked here."
        icon={Building2}
        notes={[
          'Real vendor records can be connected later.',
          'Purchase invoice workflows can attach here when ready.',
        ]}
        title="Vendor management is staged"
      />
    </PageSection>
  )
}
