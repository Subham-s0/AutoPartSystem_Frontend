import { Boxes } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder'
import { PageSection } from '@/components/shared/page-section'

export function InventoryPage() {
  return (
    <PageSection
      description="This page is reserved for real inventory lists, stock thresholds, and part-level actions."
      title="Inventory"
    >
      <FeaturePlaceholder
        actions={(
          <Link
            className="inline-flex items-center justify-center rounded-full border border-[var(--vs-border)] px-4 py-2 text-sm font-medium text-[var(--vs-text)] transition hover:border-[var(--vs-green-600)] hover:text-[var(--vs-green-800)]"
            to={ROUTE_PATHS.admin.notifications}
          >
            Review notifications
          </Link>
        )}
        description="Inventory data is not wired on the frontend yet, so this page stays clean instead of showing fake stock rows or pretend KPI totals."
        icon={Boxes}
        notes={[
          'Part CRUD and stock tables can be connected later.',
          'Low-stock monitoring should surface from real backend data only.',
        ]}
        title="Inventory module is staged"
      />
    </PageSection>
  )
}
