import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { DataTable } from '@/components/shared/data-table'
import { DatePickerField } from '@/components/shared/date-picker-field'
import { PageSection } from '@/components/shared/page-section'
import { SearchableCombobox } from '@/components/shared/searchable-combobox'
import {
  bookAppointment,
  cancelAppointment,
  getAppointmentDetail,
  getAppointments,
} from '@/features/appointments/api/appointments-api'
import type { Appointment } from '@/features/appointments/types/appointments'
import {
  getCustomerVehicles,
  DEFAULT_VEHICLE_LIST_SORTS,
} from '@/features/vehicles/api/vehicles-api'
import type { CustomerVehicle } from '@/features/vehicles/types/vehicles'
import {
  buildCustomerVehicleComboboxOptions,
  mergeSelectedVehicleForCombobox,
} from '@/features/vehicles/utils/vehicle-combobox-options'
import {
  getVehicleImageSrc,
  handleVehicleImageError,
} from '@/features/vehicles/utils/vehicle-images'
import { usePagination } from '@/hooks/use-pagination'
import { formatDateOnly, formatDateTime } from '@/utils/date'
import { ApiError, type PaginatedResponse, type SortRequest } from '@/types/api'
import { ArrowDownUp, Eye, Filter, MoreVertical, Plus, Search, XCircle } from 'lucide-react'

const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

type AppointmentSortKey = 'newest' | 'oldest' | 'preferredDateAsc' | 'preferredDateDesc'

const APPOINTMENT_SORT_OPTIONS: { label: string; key: AppointmentSortKey; sorts: SortRequest[] }[] = [
  { label: 'Newest first', key: 'newest', sorts: [{ sortBy: 'bookedAt', sortDirection: 'Desc' }] },
  { label: 'Oldest first', key: 'oldest', sorts: [{ sortBy: 'bookedAt', sortDirection: 'Asc' }] },
  { label: 'Preferred date earliest', key: 'preferredDateAsc', sorts: [{ sortBy: 'preferredDate', sortDirection: 'Asc' }] },
  { label: 'Preferred date latest', key: 'preferredDateDesc', sorts: [{ sortBy: 'preferredDate', sortDirection: 'Desc' }] },
]

function getAppointmentBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'completed':
      return 'bg'
    case 'cancelled':
      return 'br'
    default:
      return 'ba'
  }
}

function getSortLabel(key: AppointmentSortKey) {
  return APPOINTMENT_SORT_OPTIONS.find((option) => option.key === key)?.label ?? 'Newest first'
}

function getSorts(key: AppointmentSortKey): SortRequest[] {
  return APPOINTMENT_SORT_OPTIONS.find((option) => option.key === key)?.sorts ?? [{ sortBy: 'bookedAt', sortDirection: 'Desc' }]
}

function canCancelAppointment(appointment: Appointment) {
  return appointment.status.toLowerCase() === 'pending'
}

export function BookAppointmentPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pagination = usePagination(1, 5)
  const [vehicles, setVehicles] = React.useState<
    Awaited<ReturnType<typeof getCustomerVehicles>>
  >([])
  const [selectedVehicleSnapshot, setSelectedVehicleSnapshot] =
    React.useState<CustomerVehicle | null>(null)
  const [vehicleComboSearch, setVehicleComboSearch] = React.useState('')
  const [debouncedVehicleComboSearch, setDebouncedVehicleComboSearch] = React.useState('')
  const [appointmentsResult, setAppointmentsResult] =
    React.useState<PaginatedResponse<Appointment> | null>(null)
  const [vehicleId, setVehicleId] = React.useState('')
  const [preferredDate, setPreferredDate] = React.useState('')
  const [serviceType, setServiceType] = React.useState('')
  const [problemDescription, setProblemDescription] = React.useState('')
  const [searchText, setSearchText] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [sortKey, setSortKey] = React.useState<AppointmentSortKey>('newest')
  const [appointmentReloadKey, setAppointmentReloadKey] = React.useState(0)
  const [isVehiclesLoading, setIsVehiclesLoading] = React.useState(true)
  const [isAppointmentsLoading, setIsAppointmentsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isCancelling, setIsCancelling] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedAppointment, setSelectedAppointment] =
    React.useState<Appointment | null>(null)
  const [appointmentToCancel, setAppointmentToCancel] =
    React.useState<Appointment | null>(null)
  const linkedAppointmentIdParam = searchParams.get('appointmentId')
  const handledAppointmentLinkRef = React.useRef<string | null>(null)

  const vehiclesForAppointmentCombobox = React.useMemo(
    () => mergeSelectedVehicleForCombobox(vehicles, selectedVehicleSnapshot),
    [vehicles, selectedVehicleSnapshot],
  )

  const vehicleComboboxOptions = React.useMemo(
    () =>
      buildCustomerVehicleComboboxOptions(vehiclesForAppointmentCombobox, {
        includeGeneric: false,
      }),
    [vehiclesForAppointmentCombobox],
  )

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedVehicleComboSearch(vehicleComboSearch), 300)
    return () => clearTimeout(timer)
  }, [vehicleComboSearch])

  React.useEffect(() => {
    let isMounted = true

    async function loadVehicles() {
      try {
        setIsVehiclesLoading(true)
        const nextVehicles = await getCustomerVehicles({
          searchText: debouncedVehicleComboSearch.trim() || undefined,
          sorts: DEFAULT_VEHICLE_LIST_SORTS,
        })

        if (!isMounted) {
          return
        }

        setError(null)
        setVehicles(nextVehicles)
        setVehicleId((currentVehicleId) =>
          currentVehicleId || (nextVehicles[0] ? String(nextVehicles[0].vehicleId) : ''),
        )
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
          setIsVehiclesLoading(false)
        }
      }
    }

    void loadVehicles()

    return () => {
      isMounted = false
    }
  }, [debouncedVehicleComboSearch])

  React.useEffect(() => {
    const id = Number(vehicleId)
    if (!id) {
      return
    }

    const found = vehicles.find((v) => v.vehicleId === id)
    if (found) {
      setSelectedVehicleSnapshot(found)
    }
  }, [vehicles, vehicleId])

  function handleVehicleComboboxChange(nextId: string) {
    setVehicleId(nextId)
    const num = Number(nextId)
    if (!num) {
      setSelectedVehicleSnapshot(null)
      return
    }

    const merged = mergeSelectedVehicleForCombobox(vehicles, selectedVehicleSnapshot)
    const found = merged.find((v) => v.vehicleId === num)
    setSelectedVehicleSnapshot(found ?? null)
  }

  React.useEffect(() => {
    if (isDialogOpen) {
      setVehicleComboSearch('')
    }
  }, [isDialogOpen])

  React.useEffect(() => {
    let isMounted = true

    async function loadAppointments() {
      try {
        setIsAppointmentsLoading(true)
        const nextAppointments = await getAppointments({
          pageNumber: pagination.page,
          pageSize: pagination.pageSize,
          searchText: searchText.trim() || undefined,
          status: statusFilter || undefined,
          sorts: getSorts(sortKey),
        })

        if (!isMounted) {
          return
        }

        setAppointmentsResult(nextAppointments)
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setAppointmentsResult(null)
        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load appointments.',
        )
      } finally {
        if (isMounted) {
          setIsAppointmentsLoading(false)
        }
      }
    }

    void loadAppointments()

    return () => {
      isMounted = false
    }
  }, [
    appointmentReloadKey,
    pagination.page,
    pagination.pageSize,
    searchText,
    sortKey,
    statusFilter,
  ])

  React.useEffect(() => {
    if (!linkedAppointmentIdParam) {
      handledAppointmentLinkRef.current = null
      return
    }

    if (handledAppointmentLinkRef.current === linkedAppointmentIdParam) {
      return
    }

    const appointmentId = Number(linkedAppointmentIdParam)
    if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
      return
    }

    const currentAppointment = appointmentsResult?.items.find(
      (item) => item.appointmentId === appointmentId,
    )

    if (currentAppointment) {
      setSelectedAppointment(currentAppointment)
      handledAppointmentLinkRef.current = linkedAppointmentIdParam
      return
    }

    let isMounted = true
    handledAppointmentLinkRef.current = linkedAppointmentIdParam

    async function loadLinkedAppointment() {
      try {
        setError(null)
        const linkedAppointment = await getAppointmentDetail(appointmentId)

        if (!isMounted) {
          return
        }

        setSelectedAppointment(linkedAppointment)
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to open the selected appointment.',
        )
      }
    }

    void loadLinkedAppointment()

    return () => {
      isMounted = false
    }
  }, [appointmentsResult, linkedAppointmentIdParam])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      await bookAppointment({
        vehicleId: Number(vehicleId),
        preferredDate,
        serviceType,
        problemDescription,
      })

      setServiceType('')
      setProblemDescription('')
      setPreferredDate('')
      setSuccessMessage('Appointment booked successfully.')
      setIsDialogOpen(false)
      pagination.setPage(1)
      setAppointmentReloadKey((currentKey) => currentKey + 1)
    } catch (submitError) {
      setError(
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Unable to book appointment.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetToFirstPage() {
    pagination.setPage(1)
  }

  function closeAppointmentDetails() {
    setSelectedAppointment(null)

    if (linkedAppointmentIdParam) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('appointmentId')
      setSearchParams(nextParams, { replace: true })
    }
  }

  async function handleCancelAppointment() {
    if (!appointmentToCancel) {
      return
    }

    setError(null)
    setSuccessMessage(null)
    setIsCancelling(true)

    try {
      await cancelAppointment(appointmentToCancel.appointmentId)
      setAppointmentToCancel(null)
      setSuccessMessage('Appointment cancelled successfully.')
      setAppointmentReloadKey((currentKey) => currentKey + 1)
    } catch (cancelError) {
      setError(
        cancelError instanceof ApiError || cancelError instanceof Error
          ? cancelError.message
          : 'Unable to cancel appointment.',
      )
    } finally {
      setIsCancelling(false)
    }
  }

  const appointments = appointmentsResult?.items ?? []
  const totalRecords = appointmentsResult?.totalRecords ?? 0
  const totalPages =
    appointmentsResult && appointmentsResult.totalPages > 0
      ? appointmentsResult.totalPages
      : 1
  const startRecord =
    totalRecords === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const endRecord =
    totalRecords === 0
      ? 0
      : Math.min(startRecord + appointments.length - 1, totalRecords)
  const hasFilters = Boolean(searchText.trim() || statusFilter)
  const vehicleImageById = React.useMemo(() => {
    return new Map(vehicles.map((vehicle) => [vehicle.vehicleId, vehicle.vehiclePhotoUrl]))
  }, [vehicles])

  return (
    <PageSection
      actions={(
        <button
          className="tb-btn primary"
          disabled={isVehiclesLoading || vehicles.length === 0}
          onClick={() => {
            setError(null)
            setSuccessMessage(null)
            setIsDialogOpen(true)
          }}
          type="button"
        >
          <Plus size={15} />
          New appointment
        </button>
      )}
      description="Review submitted appointments and request a new workshop visit when needed."
      title="Appointments"
    >
      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-green-600)]/15 bg-[var(--vs-green-100)] px-4 py-3 text-sm text-[var(--vs-green-900)]">
          {successMessage}
        </div>
      ) : null}

      {vehicles.length === 0 && !isVehiclesLoading ? (
        <div className="mb-4 rounded-2xl border border-dashed border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm text-[var(--vs-muted)]">
          Register at least one vehicle first before booking an appointment.
        </div>
      ) : null}

      {error && !isDialogOpen ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 max-md:flex-col max-md:items-stretch">
          <label className="flex min-h-[38px] w-[min(440px,100%)] items-center gap-2 rounded-full border border-[var(--vs-border)] bg-[var(--vs-bg)] px-3 text-[var(--vs-muted)] max-md:w-full">
            <Search size={16} />
            <input
              aria-label="Search appointments"
              className="w-full min-w-0 border-0 bg-transparent text-[13px] text-[var(--vs-text)] outline-none placeholder:text-[var(--vs-faint)]"
              onChange={(event) => {
                resetToFirstPage()
                setSearchText(event.target.value)
              }}
              placeholder="Vehicle number or service type"
              type="search"
              value={searchText}
            />
          </label>

          <div className="flex items-center justify-end gap-2 max-md:w-full max-md:flex-wrap max-md:justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex min-h-[38px] max-w-[220px] cursor-pointer items-center justify-center gap-[7px] rounded-full border border-[var(--vs-border)] bg-white px-3.5 text-xs font-bold text-[var(--vs-green-800)] hover:bg-[var(--vs-green-100)] data-[state=open]:bg-[var(--vs-green-100)]"
                  type="button"
                >
                  <Filter size={15} />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {statusFilter || 'All statuses'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="!w-[190px] !min-w-[190px]">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  onValueChange={(value) => {
                    resetToFirstPage()
                    setStatusFilter(value === 'all' ? '' : value)
                  }}
                  value={statusFilter || 'all'}
                >
                  <DropdownMenuRadioItem className="gap-2 py-[7px] pl-2.5 pr-7 text-xs" value="all">
                    All statuses
                  </DropdownMenuRadioItem>
                  {APPOINTMENT_STATUSES.map((status) => (
                    <DropdownMenuRadioItem
                      className="gap-2 py-[7px] pl-2.5 pr-7 text-xs"
                      key={status}
                      value={status}
                    >
                      {status}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex min-h-[38px] max-w-[220px] cursor-pointer items-center justify-center gap-[7px] rounded-full border border-[var(--vs-border)] bg-white px-3.5 text-xs font-bold text-[var(--vs-green-800)] hover:bg-[var(--vs-green-100)] data-[state=open]:bg-[var(--vs-green-100)]"
                  type="button"
                >
                  <ArrowDownUp size={15} />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {getSortLabel(sortKey)}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="!w-[210px] !min-w-[210px]">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  onValueChange={(value) => {
                    resetToFirstPage()
                    setSortKey(value as AppointmentSortKey)
                  }}
                  value={sortKey}
                >
                  {APPOINTMENT_SORT_OPTIONS.map((option) => (
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

        <DataTable
          columns={[
            {
              key: 'vehicle',
              header: 'Vehicle',
              className: 'w-[17%]',
              render: (item) => (
                <div className="flex min-w-0 items-center gap-[9px]">
                  <img
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full border border-[var(--vs-border)] bg-[var(--vs-bg)] object-cover"
                    onError={handleVehicleImageError}
                    src={getVehicleImageSrc(vehicleImageById.get(item.vehicleId))}
                  />
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-bold text-[var(--vs-text)]">
                    {item.vehicleNumber}
                  </span>
                </div>
              ),
            },
            {
              key: 'date',
              header: 'Preferred Date',
              className: 'w-32',
              render: (item) => formatDateOnly(item.preferredDate),
            },
            {
              key: 'serviceType',
              header: 'Service Type',
              className: 'w-[24%]',
              render: (item) => item.serviceType,
            },
            {
              key: 'status',
              header: 'Status',
              className: 'w-[104px]',
              render: (item) => (
                <span className={`badge ${getAppointmentBadge(item.status)}`}>
                  {item.status}
                </span>
              ),
            },
            {
              key: 'bookedAt',
              header: 'Booked At',
              className: 'w-[150px]',
              render: (item) => formatDateTime(item.bookedAt),
            },
            {
              key: 'actions',
              header: '',
              className: '!w-9 !min-w-9 !max-w-9 !px-1 !text-center whitespace-nowrap',
              render: (item) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={`Actions for appointment ${item.appointmentId}`}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[var(--vs-muted)] hover:bg-[var(--vs-green-100)] hover:text-[var(--vs-green-800)] data-[state=open]:bg-[var(--vs-green-100)] data-[state=open]:text-[var(--vs-green-800)]"
                      type="button"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="!w-[170px] !min-w-[170px]">
                    <DropdownMenuItem
                      className="gap-2 px-2.5 py-2 text-xs"
                      onSelect={() => setSelectedAppointment(item)}
                    >
                      <Eye size={15} />
                      View details
                    </DropdownMenuItem>
                    {canCancelAppointment(item) ? (
                      <DropdownMenuItem
                        className="gap-2 px-2.5 py-2 text-xs !text-[var(--vs-red)]"
                        onSelect={() => setAppointmentToCancel(item)}
                      >
                        <XCircle size={15} />
                        Cancel appointment
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ]}
          emptyMessage={
            isAppointmentsLoading
              ? 'Loading appointments...'
              : hasFilters
                ? 'No appointments match these filters.'
                : 'No appointments booked yet.'
          }
          rows={appointments}
        />

        <div className="flex items-center justify-between gap-3 border-t border-[var(--vs-soft-border)] pt-3.5 text-xs text-[var(--vs-muted)] max-md:flex-col max-md:items-start">
          <div>
            {totalRecords === 0
              ? 'No records available.'
              : `Showing ${startRecord}-${endRecord} of ${totalRecords}`}
          </div>
          <div className="flex items-center gap-2">
            <span>
              Page {pagination.page} of {totalPages}
            </span>
            <button
              className="tb-btn"
              disabled={isAppointmentsLoading || pagination.page <= 1}
              onClick={() => pagination.setPage((currentPage) => Math.max(1, currentPage - 1))}
              type="button"
            >
              Previous
            </button>
            <button
              className="tb-btn"
              disabled={
                isAppointmentsLoading ||
                totalRecords === 0 ||
                pagination.page >= totalPages
              }
              onClick={() => pagination.setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New appointment</DialogTitle>
            <DialogDescription>
              Choose a registered vehicle, preferred date, and service details.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="form-label">
              Vehicle
              <SearchableCombobox
                disabled={isVehiclesLoading && vehiclesForAppointmentCombobox.length === 0}
                emptyText={
                  vehiclesForAppointmentCombobox.length === 0
                    ? 'No vehicles registered.'
                    : 'No matches.'
                }
                formSelectTrigger
                onChange={handleVehicleComboboxChange}
                onSearchChange={setVehicleComboSearch}
                options={vehicleComboboxOptions}
                placeholder={
                  isVehiclesLoading && vehiclesForAppointmentCombobox.length === 0
                    ? 'Loading vehicles…'
                    : vehiclesForAppointmentCombobox.length === 0
                      ? 'No vehicles available'
                      : 'Select a vehicle'
                }
                searchLoading={isVehiclesLoading}
                searchPlaceholder="Search by plate, make, or model…"
                serverSearch
                value={vehicleId}
              />
            </label>

            <label className="form-label">
              Preferred date
              <DatePickerField
                onChange={setPreferredDate}
                placeholder="Select preferred date"
                required
                value={preferredDate}
              />
            </label>

            <label className="form-label md:col-span-2">
              Service type
              <input
                className="form-input"
                onChange={(event) => setServiceType(event.target.value)}
                placeholder="Brake inspection"
                required
                type="text"
                value={serviceType}
              />
            </label>

            <label className="form-label md:col-span-2">
              Problem description
              <textarea
                className="form-textarea"
                onChange={(event) => setProblemDescription(event.target.value)}
                placeholder="Describe the issue you want checked..."
                required
                value={problemDescription}
              />
            </label>

            {error && isDialogOpen ? (
              <div className="md:col-span-2 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
                {error}
              </div>
            ) : null}

            <DialogFooter className="md:col-span-2">
              <button
                className="tb-btn"
                onClick={() => {
                  setIsDialogOpen(false)
                  setError(null)
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="tb-btn primary"
                disabled={
                  isSubmitting ||
                  isVehiclesLoading ||
                  vehiclesForAppointmentCombobox.length === 0
                }
                type="submit"
              >
                {isSubmitting ? 'Requesting...' : 'Request appointment'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            closeAppointmentDetails()
          }
        }}
        open={Boolean(selectedAppointment)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment details</DialogTitle>
            <DialogDescription>
              Full information for the selected appointment.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Vehicle</div>
                <div className="mt-1.5 text-[13px] leading-6 text-[var(--vs-text)] [overflow-wrap:anywhere]">
                  {selectedAppointment.vehicleNumber}
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Status</div>
                <div className="mt-1.5 text-[13px] leading-6 text-[var(--vs-text)] [overflow-wrap:anywhere]">
                  <span className={`badge ${getAppointmentBadge(selectedAppointment.status)}`}>
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Preferred date</div>
                <div className="mt-1.5 text-[13px] leading-6 text-[var(--vs-text)] [overflow-wrap:anywhere]">
                  {formatDateOnly(selectedAppointment.preferredDate)}
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Booked at</div>
                <div className="mt-1.5 text-[13px] leading-6 text-[var(--vs-text)] [overflow-wrap:anywhere]">
                  {formatDateTime(selectedAppointment.bookedAt)}
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3 md:col-span-2">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Service type</div>
                <div className="mt-1.5 text-[13px] leading-6 text-[var(--vs-text)] [overflow-wrap:anywhere]">
                  {selectedAppointment.serviceType}
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3 md:col-span-2">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Problem description</div>
                <div className="mt-1.5 text-[13px] leading-6 text-[var(--vs-text)] [overflow-wrap:anywhere]">
                  {selectedAppointment.problemDescription}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <button
              className="tb-btn"
              onClick={closeAppointmentDetails}
              type="button"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !isCancelling) {
            setAppointmentToCancel(null)
          }
        }}
        open={Boolean(appointmentToCancel)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the pending appointment for {appointmentToCancel?.vehicleNumber}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep appointment
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancelling}
              onClick={(event) => {
                event.preventDefault()
                void handleCancelAppointment()
              }}
              variant="destructive"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel appointment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageSection>
  )
}
