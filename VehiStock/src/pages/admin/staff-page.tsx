import { ShieldCheck } from 'lucide-react'
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder'
import { PageSection } from '@/components/shared/page-section'

export function StaffPage() {
  return (
    <PageSection
      description="This page is where admin-side staff registration and role management screens will live."
      title="Staff Access"
    >
      <FeaturePlaceholder
        description="Staff registration is already controlled from the backend auth flow. This screen is reserved for the admin-facing management UI, without sample users or pretend role tables."
        icon={ShieldCheck}
        notes={[
          'Admin-created staff accounts will be surfaced here later.',
          'Role updates and staff status controls will belong here.',
        ]}
        title="Staff management UI is deferred"
      />
    </PageSection>
  )
}
