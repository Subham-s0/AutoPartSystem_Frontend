import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/shared/data-table'
import { PageSection } from '@/components/shared/page-section'
import {
  getPurchaseHistoryPage,
  getServiceHistoryPage,
} from '@/features/customer-portal/api/customer-portal-api'
import { usePagination } from '@/hooks/use-pagination'
import { formatDateOnly } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import { ApiError } from '@/types/api'

export function CustomerHistoryPage() {
  const [activeTab, setActiveTab] = React.useState('purchases')
  const purchasePagination = usePagination(1, 10)
  const servicePagination = usePagination(1, 10)
  const [purchaseHistory, setPurchaseHistory] = React.useState<
    Awaited<ReturnType<typeof getPurchaseHistoryPage>> | null
  >(null)
  const [serviceHistory, setServiceHistory] = React.useState<
    Awaited<ReturnType<typeof getServiceHistoryPage>> | null
  >(null)
  const [isPurchaseLoading, setIsPurchaseLoading] = React.useState(true)
  const [isServiceLoading, setIsServiceLoading] = React.useState(true)
  const [purchaseError, setPurchaseError] = React.useState<string | null>(null)
  const [serviceError, setServiceError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    async function loadPurchaseHistory() {
      try {
        setPurchaseError(null)
        const nextHistory = await getPurchaseHistoryPage(
          purchasePagination.page,
          purchasePagination.pageSize,
        )

        if (isMounted) {
          setPurchaseHistory(nextHistory)
        }
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setPurchaseError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load purchase history.',
        )
      } finally {
        if (isMounted) {
          setIsPurchaseLoading(false)
        }
      }
    }

    void loadPurchaseHistory()

    return () => {
      isMounted = false
    }
  }, [purchasePagination.page, purchasePagination.pageSize])

  React.useEffect(() => {
    let isMounted = true

    async function loadServiceHistory() {
      try {
        setServiceError(null)
        const nextHistory = await getServiceHistoryPage(
          servicePagination.page,
          servicePagination.pageSize,
        )

        if (isMounted) {
          setServiceHistory(nextHistory)
        }
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setServiceError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load service history.',
        )
      } finally {
        if (isMounted) {
          setIsServiceLoading(false)
        }
      }
    }

    void loadServiceHistory()

    return () => {
      isMounted = false
    }
  }, [servicePagination.page, servicePagination.pageSize])

  function renderPaginationControls(
    result: {
      items: unknown[]
      pageNumber: number
      pageSize: number
      totalRecords: number
      totalPages: number
    } | null,
    isLoading: boolean,
    onPrevious: () => void,
    onNext: () => void,
  ) {
    if (!result && isLoading) {
      return null
    }

    const currentPage = result?.pageNumber ?? 1
    const totalPages = result && result.totalPages > 0 ? result.totalPages : 1
    const totalRecords = result?.totalRecords ?? 0
    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * (result?.pageSize ?? 10) + 1
    const endRecord = totalRecords === 0
      ? 0
      : startRecord + (result?.items.length ?? 0) - 1

    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--vs-muted)]">
        <div>
          {totalRecords === 0
            ? 'No records available.'
            : `Showing ${startRecord}-${endRecord} of ${totalRecords}`}
        </div>
        <div className="flex items-center gap-2">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="tb-btn"
            disabled={isLoading || currentPage <= 1}
            onClick={onPrevious}
            type="button"
          >
            Previous
          </button>
          <button
            className="tb-btn"
            disabled={isLoading || currentPage >= totalPages || totalRecords === 0}
            onClick={onNext}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  return (
    <PageSection
      description="Switch between purchase and service records from the same history screen."
      title="History"
    >
      <Tabs className="gap-5" onValueChange={setActiveTab} value={activeTab}>
        <TabsList variant="line">
          <TabsTrigger value="purchases">Purchase History</TabsTrigger>
          <TabsTrigger value="services">Service History</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          {purchaseError ? (
            <div className="mb-4 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
              {purchaseError}
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
              isPurchaseLoading ? 'Loading purchase history...' : 'No purchases recorded yet.'
            }
            rows={purchaseHistory?.items ?? []}
          />
          {renderPaginationControls(
            purchaseHistory,
            isPurchaseLoading,
            () => purchasePagination.setPage((currentPage) => Math.max(1, currentPage - 1)),
            () => purchasePagination.setPage((currentPage) => currentPage + 1),
          )}
        </TabsContent>

        <TabsContent value="services">
          {serviceError ? (
            <div className="mb-4 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
              {serviceError}
            </div>
          ) : null}
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
              isServiceLoading ? 'Loading service history...' : 'No service records recorded yet.'
            }
            rows={serviceHistory?.items ?? []}
          />
          {renderPaginationControls(
            serviceHistory,
            isServiceLoading,
            () => servicePagination.setPage((currentPage) => Math.max(1, currentPage - 1)),
            () => servicePagination.setPage((currentPage) => currentPage + 1),
          )}
        </TabsContent>
      </Tabs>
    </PageSection>
  )
}
