import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Edit3, Gauge, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { ROUTE_PATHS } from '@/app/config/routes'
import { PageSection } from '@/components/shared/page-section'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  deleteCustomerVehicle,
  getCustomerVehicles,
} from '@/features/customer-portal/api/customer-portal-api'
import type { CustomerVehicle } from '@/features/customer-portal/types/customer-portal'
import {
  getVehicleImageSrc,
  handleVehicleImageError,
} from '@/features/customer-portal/utils/vehicle-images'
import { ApiError } from '@/types/api'

export function VehiclesPage() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = React.useState<
    Awaited<ReturnType<typeof getCustomerVehicles>>
  >([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [deletingVehicleId, setDeletingVehicleId] = React.useState<number | null>(null)
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

  async function handleDelete(vehicle: CustomerVehicle) {
    const confirmed = window.confirm(
      `Delete vehicle ${vehicle.vehicleNumber}? This cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    setError(null)
    setDeletingVehicleId(vehicle.vehicleId)

    try {
      await deleteCustomerVehicle(vehicle.vehicleId)
      setVehicles((currentVehicles) =>
        currentVehicles.filter((item) => item.vehicleId !== vehicle.vehicleId),
      )
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError || deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete vehicle.',
      )
    } finally {
      setDeletingVehicleId(null)
    }
  }

  return (
    <PageSection
      actions={(
        <Link className="tb-btn primary" to={ROUTE_PATHS.customer.vehicleNew}>
          <Plus size={14} />
          Add Vehicle
        </Link>
      )}
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
        <div className="vehicle-grid">
          {vehicles.map((vehicle) => (
            <article key={vehicle.vehicleId} className="vehicle-card">
              <div className="vehicle-card-media">
                <button
                  className="vehicle-card-image-button"
                  onClick={() => navigate(ROUTE_PATHS.customer.vehicleDetails(vehicle.vehicleId))}
                  type="button"
                >
                  <img
                    alt={`${vehicle.vehicleNumber} vehicle`}
                    className="vehicle-card-image"
                    onError={handleVehicleImageError}
                    src={getVehicleImageSrc(vehicle.vehiclePhotoUrl)}
                  />
                </button>

              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label={`Open actions for ${vehicle.vehicleNumber}`}
                    className="vehicle-card-menu"
                    type="button"
                  >
                    <MoreVertical size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="vehicle-card-dropdown">
                  <DropdownMenuItem
                    onSelect={() =>
                      navigate(`${ROUTE_PATHS.customer.vehicleDetails(vehicle.vehicleId)}?mode=edit`)
                    }
                  >
                    <Edit3 size={14} />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={deletingVehicleId === vehicle.vehicleId}
                    onSelect={() => void handleDelete(vehicle)}
                    variant="destructive"
                  >
                    <Trash2 size={14} />
                    {deletingVehicleId === vehicle.vehicleId ? 'Deleting' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="vehicle-card-body">
                <button
                  className="vehicle-card-title"
                  onClick={() => navigate(ROUTE_PATHS.customer.vehicleDetails(vehicle.vehicleId))}
                  type="button"
                >
                  {vehicle.vehicleNumber}
                </button>
                <div className="vehicle-card-desc">
                  {vehicle.make} {vehicle.model} &bull; {vehicle.manufactureYear}
                </div>
                <div className="vehicle-card-meta">
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
