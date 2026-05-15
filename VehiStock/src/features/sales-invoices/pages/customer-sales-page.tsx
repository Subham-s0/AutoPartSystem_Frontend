import { ShoppingCart } from 'lucide-react'
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder'
import { PageSection } from '@/components/shared/page-section'

export function CustomerSalesPage() {
  return (
    <PageSection
      description="This route is meant for counter sales and quick customer-facing order handling."
      title="Customer Sales"
    >
      <FeaturePlaceholder
        description="Customer sales flow is not connected on the frontend yet, so this route avoids fake invoices, fake totals, and sample walk-in orders."
        icon={ShoppingCart}
        notes={[
          'Counter sales forms belong here.',
          'Customer search and quick invoice flow belong here.',
        ]}
        title="Sales desk UI is reserved"
      />
    </PageSection>
  )
}
