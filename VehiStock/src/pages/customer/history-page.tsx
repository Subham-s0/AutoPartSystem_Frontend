import * as React from 'react'
import { DataTable } from '@/components/shared/data-table'
import { PageSection } from '@/components/shared/page-section'
import { getCustomerHistory } from '@/features/customer-portal/api/customer-portal-api'
import { formatDateOnly } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import { ApiError } from '@/types/api'

export function CustomerHistoryPage() {
  const [history, setHistory] = React.useState<
    Awaited<ReturnType<typeof getCustomerHistory>> | null
  >(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      try {
        setError(null)
        const nextHistory = await getCustomerHistory()

        if (isMounted) {
          setHistory(nextHistory)
        }
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load customer history.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageSection
        description="Purchase history includes invoice totals and purchased parts linked to each vehicle."
        title="Purchase History"
      >
        {error ? (
          <div className="rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
            {error}
          </div>
        ) : null}
        <DataTable
          columns={[
            {
              key: 'invoiceNo',
              header: 'Invoice',
              render: (item) => item.invoiceNo,
            },
            {
              key: 'invoiceDate',
              header: 'Date',
              render: (item) => formatDateOnly(item.invoiceDate),
            },
            {
              key: 'vehicleNumber',
              header: 'Vehicle',
              render: (item) => item.vehicleNumber,
            },
            {
              key: 'items',
              header: 'Items',
              render: (item) =>
                item.items
                  .map((part) => `${part.partName} x${part.quantity}`)
                  .join(', '),
            },
            {
              key: 'totalAmount',
              header: 'Total',
              render: (item) => formatCurrency(item.totalAmount),
            },
            {
              key: 'paymentStatus',
              header: 'Payment',
              render: (item) => (
                <span className={`badge ${item.paymentStatus === 'Overdue' ? 'br' : item.balanceDue > 0 ? 'ba' : 'bg'}`}>
                  {item.paymentStatus}
                </span>
              ),
            },
          ]}
          emptyMessage={
            isLoading ? 'Loading purchase history...' : 'No purchases recorded yet.'
          }
          rows={history?.purchases ?? []}
        />
      </PageSection>

      <PageSection
        description="Service history combines diagnoses, work done, charges, parts used, and review status."
        title="Service History"
      >
        <DataTable
          columns={[
            {
              key: 'serviceDate',
              header: 'Date',
              render: (item) => formatDateOnly(item.serviceDate),
            },
            {
              key: 'vehicleNumber',
              header: 'Vehicle',
              render: (item) => item.vehicleNumber,
            },
            {
              key: 'workDone',
              header: 'Work Done',
              render: (item) => item.workDone,
            },
            {
              key: 'partsUsed',
              header: 'Parts Used',
              render: (item) =>
                item.partsUsed.length > 0
                  ? item.partsUsed
                      .map((part) => `${part.partName} x${part.quantity}`)
                      .join(', ')
                  : 'No parts used',
            },
            {
              key: 'totalCharge',
              header: 'Charge',
              render: (item) => formatCurrency(item.totalCharge),
            },
            {
              key: 'review',
              header: 'Review',
              render: (item) =>
                item.review ? (
                  <span className="badge bg">{item.review.rating}/5</span>
                ) : (
                  <span className="badge ba">Pending</span>
                ),
            },
          ]}
          emptyMessage={
            isLoading ? 'Loading service history...' : 'No service records recorded yet.'
          }
          rows={history?.services ?? []}
        />
      </PageSection>
    </div>
  )
}
