import * as React from 'react'
import { DataTable } from '@/components/shared/data-table'
import { PageSection } from '@/components/shared/page-section'
import {
  createPartRequest,
  getCustomerVehicles,
  getPartRequests,
} from '@/features/customer-portal/api/customer-portal-api'
import { formatDateTime } from '@/lib/date'
import { ApiError } from '@/types/api'

function getPartRequestBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'fulfilled':
      return 'bg'
    case 'rejected':
      return 'br'
    default:
      return 'ba'
  }
}

export function PartRequestsPage() {
  const [vehicles, setVehicles] = React.useState<
    Awaited<ReturnType<typeof getCustomerVehicles>>
  >([])
  const [requests, setRequests] = React.useState<
    Awaited<ReturnType<typeof getPartRequests>>
  >([])
  const [vehicleId, setVehicleId] = React.useState('')
  const [requestedPartName, setRequestedPartName] = React.useState('')
  const [quantity, setQuantity] = React.useState('1')
  const [details, setDetails] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setError(null)
        const [nextVehicles, nextRequests] = await Promise.all([
          getCustomerVehicles(),
          getPartRequests(),
        ])

        if (!isMounted) {
          return
        }

        setVehicles(nextVehicles)
        setRequests(nextRequests)
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load part requests.',
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
      const createdRequest = await createPartRequest({
        vehicleId: vehicleId ? Number(vehicleId) : null,
        requestedPartName,
        quantity: Number(quantity),
        details: details || undefined,
      })

      setRequests((current) => [createdRequest, ...current])
      setVehicleId('')
      setRequestedPartName('')
      setQuantity('1')
      setDetails('')
      setSuccessMessage('Part request submitted successfully.')
    } catch (submitError) {
      setError(
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Unable to submit part request.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageSection
      description="Request unavailable parts and monitor whether they are still pending, approved, or fulfilled."
      title="Part Requests"
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="form-label">
            Vehicle
            <select
              className="form-select"
              onChange={(event) => setVehicleId(event.target.value)}
              value={vehicleId}
            >
              <option value="">General request</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                  {vehicle.vehicleNumber} • {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Quantity
            <input
              className="form-input"
              min="1"
              onChange={(event) => setQuantity(event.target.value)}
              required
              type="number"
              value={quantity}
            />
          </label>

          <label className="form-label md:col-span-2">
            Requested part name
            <input
              className="form-input"
              onChange={(event) => setRequestedPartName(event.target.value)}
              placeholder="Original brake disc"
              required
              type="text"
              value={requestedPartName}
            />
          </label>

          <label className="form-label md:col-span-2">
            Details
            <textarea
              className="form-textarea"
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Mention brand preference, engine compatibility, or any extra notes..."
              value={details}
            />
          </label>

          {error ? (
            <div className="md:col-span-2 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="md:col-span-2 rounded-2xl border border-[var(--vs-green-600)]/15 bg-[var(--vs-green-100)] px-4 py-3 text-sm text-[var(--vs-green-900)]">
              {successMessage}
            </div>
          ) : null}

          <div className="md:col-span-2">
            <button
              className="tb-btn primary"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Submitting...' : 'Submit part request'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div>
            <div className="page-section-title">Request history</div>
            <p className="page-section-desc">
              Review current request statuses and the vehicles they were linked to.
            </p>
          </div>
          <DataTable
            columns={[
              {
                key: 'requestedPartName',
                header: 'Requested Part',
                render: (item) => item.requestedPartName,
              },
              {
                key: 'vehicleNumber',
                header: 'Vehicle',
                render: (item) => item.vehicleNumber ?? 'General',
              },
              {
                key: 'quantity',
                header: 'Quantity',
                render: (item) => item.quantity,
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <span className={`badge ${getPartRequestBadge(item.status)}`}>
                    {item.status}
                  </span>
                ),
              },
              {
                key: 'requestDate',
                header: 'Requested At',
                render: (item) => formatDateTime(item.requestDate),
              },
            ]}
            emptyMessage={
              isLoading ? 'Loading requests...' : 'No part requests submitted yet.'
            }
            rows={requests}
          />
        </div>
      </div>
    </PageSection>
  )
}
