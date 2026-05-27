import * as React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
import {
  Building2,
  Edit2,
  Eye,
  MoreVertical,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react'
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
  deleteVendor,
  getAllVendors,
} from '@/features/vendors/api/vendors-api'
import type { Vendor } from '@/features/vendors/types'
import { usePagination } from '@/hooks/use-pagination'
import { ApiError } from '@/types/api'

// ─── Page ─────────────────────────────────────────────────────────────────────

export function VendorPage() {
  const navigate = useNavigate()
  const pagination = usePagination(1, 10)
  const [items, setItems] = React.useState<Vendor[]>([])
  const [totalRecords, setTotalRecords] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)

  // Filters
  const [searchText, setSearchText] = React.useState('')

  // Detail dialog
  const [detailItem, setDetailItem] = React.useState<Vendor | null>(null)

  // Delete
  const [deleteTarget, setDeleteTarget] = React.useState<Vendor | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // ── Load ──────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    const timeoutId = setTimeout(() => {
      void fetchVendors(searchQuery, page)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, page, fetchVendors])

  React.useEffect(() => {
    queueMicrotask(() => {
      setPage(1)
    })
  }, [searchQuery])

    getAllVendors(searchText.trim() || undefined, pagination.page, pagination.pageSize)
      .then((res) => {
        if (!mounted) return
        setItems(res.items)
        setTotalRecords(res.totalRecords)
        setTotalPages(res.totalPages > 0 ? res.totalPages : 1)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to load vendors.')
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [pagination.page, pagination.pageSize, searchText, reloadKey])

  function reload() { setReloadKey((k) => k + 1) }
  function resetToFirstPage() { pagination.setPage(1) }

  function openCreate() {
    navigate(ROUTE_PATHS.admin.vendorNew)
  }

  function openEdit(vendor: Vendor) {
    navigate(ROUTE_PATHS.admin.vendorEdit(vendor.vendorId))
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteVendor(deleteTarget.vendorId)
      setSuccessMessage(`"${deleteTarget.vendorName}" deleted.`)
      setDeleteTarget(null)
      reload()
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Delete failed.')
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  function field(label: string, value: string) {
    return (
      <div key={label} className="rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] p-3">
        <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">{label}</div>
        <div className="mt-1 text-sm break-all">{value || '—'}</div>
      </div>
    )
  }

  const hasFilters = Boolean(searchText.trim())

  return (
    <PageSection
      title="Vendors"
      description="Manage your business suppliers and procurement contacts."
      actions={(
        <Link className="tb-btn primary inline-flex items-center gap-1.5" to={ROUTE_PATHS.admin.vendorNew}>
          <Plus size={15} /> Add Vendor
        </Link>
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
          searchPlaceholder="Vendor name, code or contact"
          searchAriaLabel="Search vendors"
          searchText={searchText}
          onSearchTextChange={(v) => { resetToFirstPage(); setSearchText(v); setSuccessMessage(null) }}
        />

        {/* ── Table ──────────────────────────────────────────────────── */}
        <DataTable
          rows={items}
          emptyMessage={
            loading
              ? 'Loading vendors…'
              : hasFilters
                ? 'No vendors match your search.'
                : 'No vendors added yet.'
          }
          columns={[
            {
              key: 'vendor',
              header: 'Vendor',
              className: 'min-w-[140px]',
              render: (v) => (
                <div>
                  <button
                    className="font-semibold text-left underline-offset-2 hover:underline hover:text-[var(--vs-green-700)] transition-colors text-xs sm:text-sm"
                    onClick={() => setDetailItem(v)}
                    type="button"
                  >
                    {v.vendorName}
                  </button>
                  <div className="text-xs text-[var(--vs-muted)] font-mono">#{v.vendorCode}</div>
                </div>
              ),
            },
            {
              key: 'contact',
              header: 'Contact Person',
              className: 'w-[160px]',
              render: (v) => v.contactPerson,
            },
            {
              key: 'email',
              header: 'Email',
              className: 'w-[200px] text-[var(--vs-muted)]',
              render: (v) => (
                <a
                  className="hover:text-[var(--vs-green-700)] transition-colors"
                  href={`mailto:${v.email}`}
                >
                  {v.email}
                </a>
              ),
            },
            {
              key: 'phone',
              header: 'Phone',
              className: 'w-[130px]',
              render: (v) => (
                <a
                  className="inline-flex items-center gap-1 hover:text-[var(--vs-green-700)] transition-colors"
                  href={`tel:${v.phone}`}
                >
                  <Phone size={12} /> {v.phone}
                </a>
              ),
            },
            {
              key: 'actions',
              header: '',
              className: '!w-9 !min-w-9 !max-w-9 !px-1 !text-center',
              render: (v) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={`Actions for ${v.vendorName}`}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[var(--vs-muted)] hover:bg-[var(--vs-green-100)] hover:text-[var(--vs-green-800)] data-[state=open]:bg-[var(--vs-green-100)] data-[state=open]:text-[var(--vs-green-800)]"
                      type="button"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="!w-[160px] !min-w-[160px]">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 px-2.5 py-2 text-xs"
                      onSelect={() => window.setTimeout(() => setDetailItem(v), 0)}
                    >
                      <Eye size={14} /> View details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 px-2.5 py-2 text-xs"
                      onSelect={() => window.setTimeout(() => openEdit(v), 0)}
                    >
                      <Edit2 size={14} /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 px-2.5 py-2 text-xs !text-[var(--vs-red)]"
                      onSelect={() => window.setTimeout(() => setDeleteTarget(v), 0)}
                    >
                      <Trash2 size={14} /> Delete
                    </DropdownMenuItem>
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
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Building2 size={18} /> {detailItem?.vendorName}
              </span>
            </DialogTitle>
            <DialogDescription>Code: {detailItem?.vendorCode}</DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="grid gap-3 sm:grid-cols-2">
              {field('Contact Person', detailItem.contactPerson)}
              {field('Phone', detailItem.phone)}
              {field('Email', detailItem.email)}
              {field('Address', detailItem.address)}
            </div>
          )}
          <DialogFooter className="gap-2">
            <button
              className="tb-btn"
              onClick={() => { setDetailItem(null); openEdit(detailItem!) }}
              type="button"
            >
              <Edit2 size={14} /> Edit
            </button>
            <button className="tb-btn primary" onClick={() => setDetailItem(null)} type="button">
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ─────────────────────────────────────────────── */}
      <AlertDialog
        onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}
        open={deleteTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.vendorName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this vendor. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--vs-red)] hover:bg-[var(--vs-red)]/90"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
              type="button"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageSection>
  )
}
