import { ReceiptText } from 'lucide-react'
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder'
import { PageSection } from '@/components/shared/page-section'

export function SalesInvoicesPage() {
  return (
    <PageSection
      description="Use this area to connect the future sales invoice forms and item builders."
      title="Sales Invoices"
    >
      <FeaturePlaceholder
        description="This page will eventually host the invoice builder and payment flow. Until then, it stays empty instead of showing made-up invoice rows."
        icon={ReceiptText}
        notes={[
          'Invoice creation belongs here.',
          'Payment status handling belongs here.',
        ]}
        title="Invoice UI is not connected yet"
      />
    </PageSection>
  )
}
