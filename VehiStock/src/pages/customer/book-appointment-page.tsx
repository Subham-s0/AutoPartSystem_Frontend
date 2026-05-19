import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/shared/data-table'
import { PageSection } from '@/components/shared/page-section'
import {
  bookAppointment,
  getAppointments,
  getCustomerVehicles,
} from '@/features/customer-portal/api/customer-portal-api'
import { usePagination } from '@/hooks/use-pagination'
import { formatDateOnly, formatDateTime } from '@/lib/date'
import { ApiError } from '@/types/api'

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

export function BookAppointmentPage() {
  const pagination = usePagination(1, 5)
  const [vehicles, setVehicles] = React.useState<
    Awaited<ReturnType<typeof getCustomerVehicles>>
  >([])
  const [appointments, setAppointments] = React.useState<
    Awaited<ReturnType<typeof getAppointments>>
  >([])
  const [vehicleId, setVehicleId] = React.useState('')
  const [preferredDate, setPreferredDate] = React.useState('')
  const [serviceType, setServiceType] = React.useState('')
  const [problemDescription, setProblemDescription] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  React.useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setError(null)
        const [nextVehicles, nextAppointments] = await Promise.all([
          getCustomerVehicles(),
          getAppointments(),
        ])

        if (!isMounted) {
          return
        }

        setVehicles(nextVehicles)
        setAppointments(nextAppointments)
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
            : 'Unable to load appointment data.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const createdAppointment = await bookAppointment({
        vehicleId: Number(vehicleId),
        preferredDate,
        serviceType,
        problemDescription,
      })

      setAppointments((current) => [createdAppointment, ...current])
      setServiceType('')
      setProblemDescription('')
      setPreferredDate('')
      setSuccessMessage('Appointment booked successfully.')
      setIsDialogOpen(false)
      pagination.setPage(1)
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

  const pagedAppointments = React.useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return appointments.slice(start, start + pagination.pageSize)
  }, [appointments, pagination.page, pagination.pageSize])

  const totalPages = appointments.length === 0
    ? 1
    : Math.ceil(appointments.length / pagination.pageSize)

  const startRecord = appointments.length === 0
    ? 0
    : (pagination.page - 1) * pagination.pageSize + 1

  const endRecord = appointments.length === 0
    ? 0
    : startRecord + pagedAppointments.length - 1

  return (
    <PageSection
      actions={(
        <button
          className="tb-btn primary"
          disabled={isLoading || vehicles.length === 0}
          onClick={() => {
            setError(null)
            setSuccessMessage(null)
            setIsDialogOpen(true)
          }}
          type="button"
        >
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

      {vehicles.length === 0 && !isLoading ? (
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
        <div>
          <div className="page-section-title">Submitted appointments</div>
          <p className="page-section-desc">
            Track preferred dates, service types, booking time, and current status.
          </p>
        </div>

        <DataTable
          columns={[
            {
              key: 'vehicle',
              header: 'Vehicle',
              render: (item) => item.vehicleNumber,
            },
            {
              key: 'date',
              header: 'Preferred Date',
              render: (item) => formatDateOnly(item.preferredDate),
            },
            {
              key: 'serviceType',
              header: 'Service Type',
              render: (item) => item.serviceType,
            },
            {
              key: 'status',
              header: 'Status',
              render: (item) => (
                <span className={`badge ${getAppointmentBadge(item.status)}`}>
                  {item.status}
                </span>
              ),
            },
            {
              key: 'bookedAt',
              header: 'Booked At',
              render: (item) => formatDateTime(item.bookedAt),
            },
          ]}
          emptyMessage={
            isLoading
              ? 'Loading appointments...'
              : 'No appointments booked yet.'
          }
          rows={pagedAppointments}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--vs-muted)]">
          <div>
            {appointments.length === 0
              ? 'No records available.'
              : `Showing ${startRecord}-${endRecord} of ${appointments.length}`}
          </div>
          <div className="flex items-center gap-2">
            <span>
              Page {pagination.page} of {totalPages}
            </span>
            <button
              className="tb-btn"
              disabled={isLoading || pagination.page <= 1}
              onClick={() => pagination.setPage((currentPage) => Math.max(1, currentPage - 1))}
              type="button"
            >
              Previous
            </button>
            <button
              className="tb-btn"
              disabled={isLoading || pagination.page >= totalPages || appointments.length === 0}
              onClick={() => pagination.setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New appointment</DialogTitle>
            <DialogDescription>
              Choose a registered vehicle, preferred date, and service details.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="form-label">
              Vehicle
              <select
                className="form-select"
                disabled={isLoading || vehicles.length === 0}
                onChange={(event) => setVehicleId(event.target.value)}
                required
                value={vehicleId}
              >
                {vehicles.length === 0 ? (
                  <option value="">No vehicles available</option>
                ) : null}
                {vehicles.map((vehicle) => (
                  <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                    {vehicle.vehicleNumber} - {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-label">
              Preferred date
              <input
                className="form-input"
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setPreferredDate(event.target.value)}
                required
                type="date"
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
                disabled={isSubmitting || isLoading || vehicles.length === 0}
                type="submit"
              >
                {isSubmitting ? 'Requesting...' : 'Request appointment'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageSection>
  )
}
