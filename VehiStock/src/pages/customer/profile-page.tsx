import { PageSection } from '@/components/shared/page-section'
import { useAuth } from '@/hooks/use-auth'

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <PageSection
      description="Profile completion and customer account editing can be added here without touching route wiring."
      title="My Profile"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <article className="info-card">
          <div className="info-card-desc">Full name</div>
          <div className="info-card-title" style={{ marginTop: '8px' }}>
            {user?.fullName ?? 'Customer User'}
          </div>
        </article>
        <article className="info-card">
          <div className="info-card-desc">Email</div>
          <div className="info-card-title" style={{ marginTop: '8px' }}>
            {user?.email ?? 'customer@vehistock.com'}
          </div>
        </article>
      </div>
    </PageSection>
  )
}
