import * as React from 'react'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/shared/data-table'
import { ErrorAlert } from '@/components/shared/error-alert'
import { ListToolbar } from '@/components/shared/list-toolbar'
import { PageSection } from '@/components/shared/page-section'
import { PaginationFooter } from '@/components/shared/pagination-footer'
import {
  cancelPartRequest,
  createPartRequest,
  getPartRequests,
} from '@/features/part-requests/api/part-requests-api'
import type { PartRequest } from '@/features/part-requests/types/part-requests'
import {
  getVehicleImageSrc,
  handleVehicleImageError,
} from '@/features/vehicles/utils/vehicle-images'
import { PartRequestFormDialog } from '@/features/part-requests/components/part-request-form-dialog'
import { usePagination } from '@/hooks/use-pagination'
import { formatDateTime } from '@/utils/date'
import { ApiError, type PaginatedResponse, type SortRequest } from '@/types/api'
import { Eye, MoreVertical, Plus, XCircle } from 'lucide-react'

const PART_REQUEST_STATUSES = ['Pending', 'Ordered', 'Fulfilled', 'Cancelled']

type PartRequestSortKey = 'newest' | 'oldest'

const SORT_OPTIONS: { label: string; key: PartRequestSortKey; sorts: SortRequest[] }[] = [
  { label: 'Newest first', key: 'newest', sorts: [{ sortBy: 'requestDate', sortDirection: 'Desc' }] },
  { label: 'Oldest first', key: 'oldest', sorts: [{ sortBy: 'requestDate', sortDirection: 'Asc' }] },
]

function getPartRequestBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'fulfilled':
    case 'ordered':
      return 'bg'
    case 'cancelled':
      return 'br'
    default:
      return 'ba'
  }
}

function getSorts(key: PartRequestSortKey): SortRequest[] {
  return SORT_OPTIONS.find((option) => option.key === key)?.sorts ?? [
    { sortBy: 'requestDate', sortDirection: 'Desc' },
  ]
}

function isPendingPartRequestStatus(status: string) {
  return status.trim().toLowerCase() === 'pending'
}

function getNonPendingCancelMessage(status: string) {
  const trimmed = status.trim()
  return `This request cannot be cancelled because its status is "${trimmed}". Only requests that are still pending can be cancelled.`
}

export function PartRequestsPage() {
  const pagination = usePagination(1, 10)
  const [requestsResult, setRequestsResult] =
    React.useState<PaginatedResponse<PartRequest> | null>(null)

  const [searchText, setSearchText] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [sortKey, setSortKey] = React.useState<PartRequestSortKey>('newest')
  const [reloadKey, setReloadKey] = React.useState(0)

  const [isRequestsLoading, setIsRequestsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const [detailRequest, setDetailRequest] = React.useState<PartRequest | null>(null)
  const [cannotCancelMessage, setCannotCancelMessage] = React.useState<string | null>(null)
  const [cancelConfirmRequest, setCancelConfirmRequest] = React.useState<PartRequest | null>(null)
  const [isCancelling, setIsCancelling] = React.useState(false)

  React.useEffect(() => {
    let isMounted = true

    async function loadRequests() {
      try {
        setIsRequestsLoading(true)
        setError(null)
        const next = await getPartRequests({
          pageNumber: pagination.page,
          pageSize: pagination.pageSize,
          searchText: searchText.trim() || undefined,
          status: statusFilter || undefined,
          sorts: getSorts(sortKey),
        })
        if (!isMounted) return
        setRequestsResult(next)
      } catch (loadError) {
        if (!isMounted) return
        setRequestsResult(null)
        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load part requests.',
        )
      } finally {
        if (isMounted) setIsRequestsLoading(false)
      }
    }

    void loadRequests()
    return () => {
      isMounted = false
    }
  }, [
    pagination.page,
    pagination.pageSize,
    searchText,
    statusFilter,
    sortKey,
    reloadKey,
  ])

  function resetToFirstPage() {
    pagination.setPage(1)
  }

  async function handleConfirmCancel() {
    if (!cancelConfirmRequest) return
    setIsCancelling(true)
    setError(null)
    try {
      await cancelPartRequest(cancelConfirmRequest.partRequestId)
      setCancelConfirmRequest(null)
      setSuccessMessage('Part request cancelled.')
      setReloadKey((k) => k + 1)
    } catch (cancelError) {
      setError(
        cancelError instanceof ApiError || cancelError instanceof Error
          ? cancelError.message
          : 'Unable to cancel this part request.',
      )
    } finally {
      setIsCancelling(false)
    }
  }

  const requests = requestsResult?.items ?? []
  const totalRecords = requestsResult?.totalRecords ?? 0
  const totalPages =
    requestsResult && requestsResult.totalPages > 0 ? requestsResult.totalPages : 1
  const hasFilters = Boolean(searchText.trim() || statusFilter)

  return (
    <PageSection
      actions={(
        <button
          className="tb-btn primary"
          onClick={() => {
            setError(null)
            setSuccessMessage(null)
            setIsDialogOpen(true)
          }}
          type="button"
        >
          <Plus size={15} />
          New part request
        </button>
      )}
      description="Request unavailable parts and track status. Filter by state, search by vehicle or part name, and sort by date."
      title="Part Requests"
    >
      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-green-600)]/15 bg-[var(--vs-green-100)] px-4 py-3 text-sm text-[var(--vs-green-900)]">
          {successMessage}
        </div>
      ) : null}

      {error && !isDialogOpen ? (
        <ErrorAlert message={error} />
      ) : null}

      <div className="space-y-4">
        <ListToolbar
          searchPlaceholder="Vehicle number or part name"
          searchAriaLabel="Search part requests"
          searchText={searchText}
          onSearchTextChange={(value) => {
            resetToFirstPage()
            setSearchText(value)
          }}
          filterLabel="Status"
          filterValue={statusFilter}
          onFilterChange={(value) => {
            resetToFirstPage()
            setStatusFilter(value)
          }}
          filterOptions={PART_REQUEST_STATUSES.map((s) => ({ label: s, value: s }))}
          sortOptions={SORT_OPTIONS}
          sortKey={sortKey}
          onSortKeyChange={(value) => {
            resetToFirstPage()
            setSortKey(value as PartRequestSortKey)
          }}
        />

        <DataTable
          columns={[
            {
              key: 'requestedPartName',
              header: 'Requested part',
              className: 'min-w-[140px]',
              render: (item) => item.requestedPartName,
            },
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
                    src={getVehicleImageSrc(item.vehiclePhotoUrl)}
                  />
                  <div className="min-w-0 text-left">
                    <div className="truncate font-bold text-[var(--vs-text)]">
                      {item.vehicleNumber ?? 'General (no vehicle)'}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'quantity',
              header: 'Qty',
              className: 'w-16',
              render: (item) => item.quantity,
            },
            {
              key: 'status',
              header: 'Status',
              className: 'w-[104px]',
              render: (item) => (
                <span className={`badge ${getPartRequestBadge(item.status)}`}>
                  {item.status}
                </span>
              ),
            },
            {
              key: 'requestDate',
              header: 'Requested at',
              className: 'w-[150px]',
              render: (item) => formatDateTime(item.requestDate),
            },
            {
              key: 'actions',
              header: '',
              className: '!w-9 !min-w-9 !max-w-9 !px-1 !text-center whitespace-nowrap',
              render: (item) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={`Actions for ${item.requestedPartName}`}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[var(--vs-muted)] hover:bg-[var(--vs-green-100)] hover:text-[var(--vs-green-800)] data-[state=open]:bg-[var(--vs-green-100)] data-[state=open]:text-[var(--vs-green-800)]"
                      type="button"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="!w-[170px] !min-w-[170px]">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 px-2.5 py-2 text-xs"
                      onSelect={() => {
                        window.setTimeout(() => setDetailRequest(item), 0)
                      }}
                    >
                      <Eye size={15} />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 px-2.5 py-2 text-xs !text-[var(--vs-red)]"
                      onSelect={() => {
                        window.setTimeout(() => {
                          if (!isPendingPartRequestStatus(item.status)) {
                            setCannotCancelMessage(getNonPendingCancelMessage(item.status))
                            return
                          }
                          setCancelConfirmRequest(item)
                        }, 0)
                      }}
                    >
                      <XCircle size={15} />
                      Cancel request
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ]}
          emptyMessage={
            isRequestsLoading
              ? 'Loading requests…'
              : hasFilters
                ? 'No part requests match these filters.'
                : 'No part requests submitted yet.'
          }
          rows={requests}
        />

        <PaginationFooter
          pageNumber={pagination.page}
          pageSize={pagination.pageSize}
          totalRecords={totalRecords}
          totalPages={totalPages}
          itemCount={requests.length}
          isLoading={isRequestsLoading}
          onPrevious={() => pagination.setPage((p) => Math.max(1, p - 1))}
          onNext={() => pagination.setPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>

      <PartRequestFormDialog
        onOpenChange={setIsDialogOpen}
        onSubmit={async (input) => {
          await createPartRequest(input)
          setSuccessMessage('Part request submitted successfully.')
          resetToFirstPage()
          setReloadKey((k) => k + 1)
        }}
        open={isDialogOpen}
      />

      <Dialog onOpenChange={(open) => !open && setDetailRequest(null)} open={detailRequest !== null}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Part request details</DialogTitle>
            <DialogDescription>
              Request #{detailRequest?.partRequestId ?? ''}
            </DialogDescription>
          </DialogHeader>
          {detailRequest ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3 md:col-span-2">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Vehicle</div>
                <div className="mt-2 flex items-center gap-3">
                  <img
                    alt=""
                    className="h-10 w-14 shrink-0 rounded-lg object-cover ring-1 ring-[var(--vs-border)]"
                    onError={handleVehicleImageError}
                    src={getVehicleImageSrc(detailRequest.vehiclePhotoUrl)}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--vs-text)] [overflow-wrap:anywhere]">
                      {detailRequest.vehicleNumber ?? 'General (no vehicle)'}
                    </div>
                    {detailRequest.vehicleMake ? (
                      <div className="mt-0.5 text-[12px] text-[var(--vs-muted)]">
                        {[detailRequest.vehicleMake, detailRequest.vehicleModel]
                          .filter(Boolean)
                          .join(' ')}
                        {detailRequest.vehicleManufactureYear != null
                          ? ` · ${detailRequest.vehicleManufactureYear}`
                          : ''}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Status</div>
                <div className="mt-1.5 text-[13px] leading-6 text-[var(--vs-text)] [overflow-wrap:anywhere]">
                  <span className={`badge ${getPartRequestBadge(detailRequest.status)}`}>
                    {detailRequest.status}
                  </span>
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Requested at</div>
                <div className="mt-1.5 text-[13px] leading-6 text-[var(--vs-text)] [overflow-wrap:anywhere]">
                  {formatDateTime(detailRequest.requestDate)}
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3 md:col-span-2">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Part details</div>
                <div className="mt-1.5 text-[13px] leading-6 text-[var(--vs-text)] [overflow-wrap:anywhere]">
                  <span className="font-semibold">{detailRequest.requestedPartName}</span>
                  <span className="ml-2 text-[var(--vs-muted)]">(Qty: {detailRequest.quantity})</span>
                </div>
              </div>

              {detailRequest.details ? (
                <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3 md:col-span-2">
                  <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Additional details</div>
                  <div className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-[var(--vs-text)] [overflow-wrap:anywhere]">
                    {detailRequest.details}
                  </div>
                </div>
              ) : null}

              {detailRequest.photoUrl ? (
                <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3 md:col-span-2">
                  <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Part Image</div>
                  <div className="mt-2 flex">
                    <a href={getVehicleImageSrc(detailRequest.photoUrl)} target="_blank" rel="noreferrer">
                      <img
                        alt="Requested part"
                        className="max-h-48 rounded-lg object-contain border border-[var(--vs-border)] bg-[var(--vs-bg)]"
                        onError={handleVehicleImageError}
                        src={getVehicleImageSrc(detailRequest.photoUrl)}
                      />
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <button className="tb-btn primary" onClick={() => setDetailRequest(null)} type="button">
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => !open && setCannotCancelMessage(null)}
        open={cannotCancelMessage !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cannot cancel this request</AlertDialogTitle>
            <AlertDialogDescription>{cannotCancelMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setCannotCancelMessage(null)} type="button">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={(open) => !open && !isCancelling && setCancelConfirmRequest(null)}
        open={cancelConfirmRequest !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this part request?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelConfirmRequest
                ? `This will cancel your request for “${cancelConfirmRequest.requestedPartName}”. You can submit a new request later if needed.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling} type="button">
              Keep request
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--vs-red)] hover:bg-[var(--vs-red)]/90"
              disabled={isCancelling}
              onClick={() => {
                void handleConfirmCancel()
              }}
              type="button"
            >
              {isCancelling ? 'Cancelling…' : 'Yes, cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageSection>
  )
}
