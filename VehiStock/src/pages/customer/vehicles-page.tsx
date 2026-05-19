import * as React from 'react'
import { CarFront, Gauge } from 'lucide-react'
import { PageSection } from '@/components/shared/page-section'
import { getCustomerVehicles } from '@/features/customer-portal/api/customer-portal-api'
import { ApiError } from '@/types/api'

export function VehiclesPage() {
  const [vehicles, setVehicles] = React.useState<
    Awaited<ReturnType<typeof getCustomerVehicles>>
  >([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    async function loadVehicles() {
      try {
        setError(null)
        const nextVehicles = await getCustomerVehicles()

        if (isMounted) {
          setVehicles(nextVehicles)
        }
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load vehicles.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadVehicles()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <PageSection
      description="Use these registered vehicles when booking services and viewing invoice or service history."
      title="My Vehicles"
    >
      {error ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
          {error}
        </div>
      ) : null}

      {vehicles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-6 text-sm text-[var(--vs-muted)]">
          {isLoading ? 'Loading vehicles...' : 'No vehicles are registered yet.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.map((vehicle) => (
            <article key={vehicle.vehicleId} className="info-card">
              <div className="info-card-icon">
                <CarFront />
              </div>
              <div className="info-card-title">{vehicle.vehicleNumber}</div>
              <div className="info-card-desc">
                {vehicle.make} {vehicle.model} • {vehicle.manufactureYear}
              </div>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <Gauge size={14} />
                  {vehicle.mileageKm.toLocaleString()} km recorded
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageSection>
  )
}
