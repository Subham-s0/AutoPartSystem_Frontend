import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDownUp, Edit3, Gauge, MoreVertical, Plus, Search, Trash2 } from 'lucide-react'
import { ROUTE_PATHS } from '@/app/config/routes'
import { PageSection } from '@/components/shared/page-section'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  deleteCustomerVehicle,
  getCustomerVehicles,
} from '@/features/vehicles/api/vehicles-api'
import type { CustomerVehicle } from '@/features/vehicles/types/vehicles'
import {
  getVehicleImageSrc,
  handleVehicleImageError,
} from '@/features/vehicles/utils/vehicle-images'
import { ApiError, type SortRequest } from '@/types/api'

type VehicleSortKey = 'mileageDesc' | 'mileageAsc' | 'yearDesc' | 'yearAsc'

const VEHICLE_SORT_OPTIONS: { label: string; key: VehicleSortKey; sorts: SortRequest[] }[] = [
  { label: 'Highest mileage', key: 'mileageDesc', sorts: [{ sortBy: 'mileageKm', sortDirection: 'Desc' }] },
  { label: 'Lowest mileage', key: 'mileageAsc', sorts: [{ sortBy: 'mileageKm', sortDirection: 'Asc' }] },
  { label: 'Newest model year', key: 'yearDesc', sorts: [{ sortBy: 'manufactureYear', sortDirection: 'Desc' }] },
  { label: 'Oldest model year', key: 'yearAsc', sorts: [{ sortBy: 'manufactureYear', sortDirection: 'Asc' }] },
]

function getVehicleSortLabel(key: VehicleSortKey) {
  return VEHICLE_SORT_OPTIONS.find((option) => option.key === key)?.label ?? 'Highest mileage'
}

function getVehicleSorts(key: VehicleSortKey): SortRequest[] {
  return VEHICLE_SORT_OPTIONS.find((option) => option.key === key)?.sorts ?? [
    { sortBy: 'mileageKm', sortDirection: 'Desc' },
  ]
}

export function VehiclesPage() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = React.useState<
    Awaited<ReturnType<typeof getCustomerVehicles>>
  >([])
  const [searchText, setSearchText] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [sortKey, setSortKey] = React.useState<VehicleSortKey>('mileageDesc')
  const [reloadKey, setReloadKey] = React.useState(0)

  const [isLoading, setIsLoading] = React.useState(true)
  const [isFetching, setIsFetching] = React.useState(false)
  const [deletingVehicleId, setDeletingVehicleId] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const vehiclesRef = React.useRef(vehicles)
  React.useEffect(() => {
    vehiclesRef.current = vehicles
  }, [vehicles])

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300)
    return () => clearTimeout(timer)
  }, [searchText])

  React.useEffect(() => {
    let isMounted = true

    async function loadVehicles() {
      const showFullSpinner = vehiclesRef.current.length === 0

      try {
        if (showFullSpinner) {
          setIsLoading(true)
        } else {
          setIsFetching(true)
        }

        setError(null)
        const nextVehicles = await getCustomerVehicles({
          searchText: debouncedSearch.trim() || undefined,
          sorts: getVehicleSorts(sortKey),
        })

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
          if (showFullSpinner) {
            setIsLoading(false)
          } else {
            setIsFetching(false)
          }
        }
      }
    }

    void loadVehicles()

    return () => {
      isMounted = false
    }
  }, [debouncedSearch, sortKey, reloadKey])

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
      setReloadKey((k) => k + 1)
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

  const hasFilters = Boolean(debouncedSearch.trim())
  const showInitialLoading = isLoading && vehicles.length === 0
  const showEmptyMessage = !isLoading && !isFetching && vehicles.length === 0

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

      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <label className="flex min-h-[38px] w-full min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--vs-border)] bg-[var(--vs-bg)] px-3 text-[var(--vs-muted)] sm:max-w-md">
          <Search size={16} />
          <input
            aria-label="Search vehicles"
            className="w-full min-w-0 border-0 bg-transparent text-[13px] text-[var(--vs-text)] outline-none placeholder:text-[var(--vs-faint)]"
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Plate, make, model, year, notes…"
            type="search"
            value={searchText}
          />
        </label>

        <div className="flex shrink-0 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex min-h-[38px] max-w-[240px] cursor-pointer items-center justify-center gap-[7px] rounded-full border border-[var(--vs-border)] bg-white px-3.5 text-xs font-bold text-[var(--vs-green-800)] hover:bg-[var(--vs-green-100)] data-[state=open]:bg-[var(--vs-green-100)]"
                type="button"
              >
                <ArrowDownUp size={15} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {getVehicleSortLabel(sortKey)}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!min-w-[200px]">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                onValueChange={(value) => setSortKey(value as VehicleSortKey)}
                value={sortKey}
              >
                {VEHICLE_SORT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem
                    className="gap-2 py-[7px] pl-2.5 pr-7 text-xs"
                    key={option.key}
                    value={option.key}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showInitialLoading ? (
        <div className="rounded-2xl border border-dashed border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-6 text-sm text-[var(--vs-muted)]">
          Loading vehicles...
        </div>
      ) : showEmptyMessage ? (
        <div className="rounded-2xl border border-dashed border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-6 text-sm text-[var(--vs-muted)]">
          {hasFilters ? 'No vehicles match your search.' : 'No vehicles are registered yet.'}
        </div>
      ) : (
        <div
          className={`vehicle-grid transition-opacity duration-200 ${isFetching ? 'pointer-events-none opacity-50' : 'opacity-100'}`}
        >
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
