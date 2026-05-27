import * as React from 'react'
import {
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  MoreVertical,
  PackageCheck,
  Plus,
  XCircle,
} from 'lucide-react'
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
  getAdminPartRequests,
  updatePartRequestStatus,
} from '@/features/part-requests/api/part-requests-api'
import type {
  AdminPartRequest,
  PartRequestQueryInput,
  UpdatePartRequestStatusInput,
} from '@/features/part-requests/types/part-requests'
import { usePagination } from '@/hooks/use-pagination'
import { ApiError, type PaginatedResponse, type SortRequest } from '@/types/api'
import { APP_CONFIG } from '@/constants/app-config'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['Pending', 'Ordered', 'Fulfilled', 'Cancelled']

type SortKey = 'newest' | 'oldest'

const SORT_OPTIONS: { label: string; key: SortKey; sorts: SortRequest[] }[] = [
  { label: 'Newest first', key: 'newest', sorts: [{ sortBy: 'requestDate', sortDirection: 'Desc' }] },
  { label: 'Oldest first', key: 'oldest', sorts: [{ sortBy: 'requestDate', sortDirection: 'Asc' }] },
]

const UPDATE_STATUSES: UpdatePartRequestStatusInput['status'][] = [
  'Pending',
  'Ordered',
  'Fulfilled',
  'Cancelled',
]

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; icon: React.ReactNode }> = {
    Pending: { cls: 'bg-yellow-100 text-yellow-700', icon: <Clock size={11} /> },
    Ordered: { cls: 'bg-blue-100 text-blue-700', icon: <Loader2 size={11} /> },
    Fulfilled: { cls: 'bg-green-100 text-green-700', icon: <PackageCheck size={11} /> },
    Cancelled: { cls: 'bg-red-100 text-red-600', icon: <XCircle size={11} /> },
  }
  const { cls, icon } = cfg[status] ?? { cls: 'bg-gray-100 text-gray-600', icon: <CheckCircle size={11} /> }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {icon} {status}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function AdminPartRequestsPage() {
  const pagination = usePagination(1, 15)
  const [result, setResult] = React.useState<PaginatedResponse<AdminPartRequest> | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)

  // Filters
  const [searchText, setSearchText] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [sortKey, setSortKey] = React.useState<SortKey>('newest')

  // Detail dialog
  const [detailItem, setDetailItem] = React.useState<AdminPartRequest | null>(null)

  // Inline status update
  const [updating, setUpdating] = React.useState<number | null>(null)

  // Load data whenever filters / page / sort change
  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    const sorts = SORT_OPTIONS.find((o) => o.key === sortKey)?.sorts ?? [
      { sortBy: 'requestDate', sortDirection: 'Desc' as const },
    ]

    const query: PartRequestQueryInput = {
      pageNumber: pagination.page,
      pageSize: pagination.pageSize,
      searchText: searchText.trim() || undefined,
      status: statusFilter || undefined,
      sorts,
    }

    getAdminPartRequests(query)
      .then((data) => { if (mounted) setResult(data) })
      .catch((err) => {
        if (!mounted) return
        setResult(null)
        setError(
          err instanceof ApiError || err instanceof Error
            ? err.message
            : 'Failed to load part requests.',
        )
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [pagination.page, pagination.pageSize, searchText, statusFilter, sortKey, reloadKey])

  function resetToFirstPage() {
    pagination.setPage(1)
  }

  async function handleStatusChange(
    requestId: number,
    status: UpdatePartRequestStatusInput['status'],
  ) {
    setUpdating(requestId)
    setError(null)
    try {
      const updated = await updatePartRequestStatus(requestId, { status })
      setSuccessMessage(`Request #${requestId} updated to "${updated.status}".`)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Failed to update status.',
      )
    } finally {
      setUpdating(null)
    }
  }

  const items = result?.items ?? []
  const totalRecords = result?.totalRecords ?? 0
  const totalPages = result && result.totalPages > 0 ? result.totalPages : 1
  const hasFilters = Boolean(searchText.trim() || statusFilter)

  return (
    <PageSection
      title="Part Requests"
      description="All customer part requests. Search, filter, sort and update statuses directly."
      actions={(
        <div className="flex items-center gap-2 text-sm text-[var(--vs-muted)]">
          <span>{totalRecords} total</span>
        </div>
      )}
    >
      {/* ── Messages ─────────────────────────────────────────────────── */}
      {successMessage && (
        <div className="mb-4 rounded-2xl border border-[var(--vs-green-600)]/15 bg-[var(--vs-green-100)] px-4 py-3 text-sm text-[var(--vs-green-900)]">
          {successMessage}
        </div>
      )}
      {error && <ErrorAlert message={error} />}

      <div className="space-y-4">
        {/* ── Toolbar ────────────────────────────────────────────────── */}
        <ListToolbar
          searchPlaceholder="Part name or vehicle number"
          searchAriaLabel="Search part requests"
          searchText={searchText}
          onSearchTextChange={(v) => { resetToFirstPage(); setSearchText(v); setSuccessMessage(null) }}
          filterLabel="Status"
          filterValue={statusFilter}
          onFilterChange={(v) => { resetToFirstPage(); setStatusFilter(v); setSuccessMessage(null) }}
          filterOptions={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
          sortOptions={SORT_OPTIONS}
          sortKey={sortKey}
          onSortKeyChange={(v) => { resetToFirstPage(); setSortKey(v as SortKey) }}
        />

        {/* ── Table ──────────────────────────────────────────────────── */}
        <DataTable
          rows={items}
          emptyMessage={
            loading
              ? 'Loading requests…'
              : hasFilters
                ? 'No requests match these filters.'
                : 'No part requests found.'
          }
          columns={[
            {
              key: 'id',
              header: '#',
              className: 'w-12 text-[var(--vs-muted)]',
              render: (item) => item.partRequestId,
            },
            {
              key: 'part',
              header: 'Requested Part',
              className: 'min-w-[140px] font-medium',
              render: (item) => item.requestedPartName,
            },
            {
              key: 'qty',
              header: 'Qty',
              className: 'w-14',
              render: (item) => item.quantity,
            },
            {
              key: 'vehicle',
              header: 'Vehicle',
              className: 'w-[18%]',
              render: (item) =>
                item.vehicleNumber
                  ? `${item.vehicleMake ?? ''} ${item.vehicleModel ?? ''} (${item.vehicleNumber})`.trim()
                  : '—',
            },
            {
              key: 'image',
              header: 'Image',
              className: 'w-16',
              render: (item) =>
                item.partImageUrl ? (
                  <img
                    alt={item.requestedPartName}
                    className="h-10 w-10 cursor-pointer rounded-lg object-cover ring-1 ring-[var(--vs-border)] transition hover:scale-110"
                    src={`${APP_CONFIG.apiBaseUrl}${item.partImageUrl}`}
                    onClick={() => setDetailItem(item)}
                  />
                ) : (
                  <span className="text-[var(--vs-muted)]">—</span>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              className: 'w-[120px]',
              render: (item) => <StatusBadge status={item.status} />,
            },
            {
              key: 'date',
              header: 'Date',
              className: 'w-[110px] text-[var(--vs-muted)]',
              render: (item) => new Date(item.requestDate).toLocaleDateString(),
            },
            {
              key: 'actions',
              header: '',
              className: '!w-9 !min-w-9 !max-w-9 !px-1 !text-center',
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
                  <DropdownMenuContent align="end" className="!w-[180px] !min-w-[180px]">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 px-2.5 py-2 text-xs"
                      onSelect={() => window.setTimeout(() => setDetailItem(item), 0)}
                    >
                      <Eye size={14} />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] text-[var(--vs-muted)] px-2.5">
                      Update status
                    </DropdownMenuLabel>
                    {UPDATE_STATUSES.filter((s) => s !== item.status).map((s) => (
                      <DropdownMenuItem
                        key={s}
                        className="gap-2 px-2.5 py-2 text-xs"
                        disabled={updating === item.partRequestId}
                        onSelect={() =>
                          window.setTimeout(
                            () => void handleStatusChange(item.partRequestId, s),
                            0,
                          )
                        }
                      >
                        <StatusBadge status={s} />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ]}
        />

        {/* ── Pagination ─────────────────────────────────────────────── */}
        <PaginationFooter
          pageNumber={pagination.page}
          pageSize={pagination.pageSize}
          totalRecords={totalRecords}
          totalPages={totalPages}
          itemCount={items.length}
          isLoading={loading}
          onPrevious={() => pagination.setPage((p) => Math.max(1, p - 1))}
          onNext={() => pagination.setPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>

      {/* ── Detail Dialog ──────────────────────────────────────────────── */}
      <Dialog onOpenChange={(open) => !open && setDetailItem(null)} open={detailItem !== null}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Part Request #{detailItem?.partRequestId}</DialogTitle>
            <DialogDescription>Full details for this customer request.</DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="grid gap-3 md:grid-cols-2">
              {/* Part name + Qty */}
              <div className="rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3 md:col-span-2">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Part</div>
                <div className="mt-1 text-sm font-semibold">
                  {detailItem.requestedPartName}
                  <span className="ml-2 text-[var(--vs-muted)] font-normal">
                    × {detailItem.quantity}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Status</div>
                <div className="mt-1">
                  <StatusBadge status={detailItem.status} />
                </div>
              </div>

              {/* Date */}
              <div className="rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Date</div>
                <div className="mt-1 text-sm">
                  {new Date(detailItem.requestDate).toLocaleString()}
                </div>
              </div>

              {/* Vehicle */}
              <div className="rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3 md:col-span-2">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Vehicle</div>
                <div className="mt-1 text-sm">
                  {detailItem.vehicleNumber
                    ? `${detailItem.vehicleMake ?? ''} ${detailItem.vehicleModel ?? ''} — ${detailItem.vehicleNumber}`.trim()
                    : 'General (no specific vehicle)'}
                </div>
              </div>

              {/* Part Image */}
              {detailItem.partImageUrl && (
                <div className="rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3 md:col-span-2">
                  <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Part Image</div>
                  <img
                    alt={detailItem.requestedPartName}
                    className="mt-2 h-40 w-full rounded-xl object-contain ring-1 ring-[var(--vs-border)]"
                    src={`${APP_CONFIG.apiBaseUrl}${detailItem.partImageUrl}`}
                  />
                </div>
              )}

              {/* Details / Notes */}
              {detailItem.details && (
                <div className="rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3 md:col-span-2">
                  <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">Notes</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm">{detailItem.details}</div>
                </div>
              )}

              {/* Quick status update inside dialog */}
              <div className="md:col-span-2">
                <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)] mb-2">
                  Quick update status
                </div>
                <div className="flex flex-wrap gap-2">
                  {UPDATE_STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`tb-btn text-xs ${s === detailItem.status ? 'primary' : ''}`}
                      disabled={updating === detailItem.partRequestId || s === detailItem.status}
                      onClick={() => void handleStatusChange(detailItem.partRequestId, s)}
                      type="button"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button className="tb-btn primary" onClick={() => setDetailItem(null)} type="button">
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageSection>
  )
}
