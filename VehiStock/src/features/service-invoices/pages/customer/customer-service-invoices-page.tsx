import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowDownUp,
  ArrowLeft,
  BadgePercent,
  BadgeX,
  CreditCard,
  Eye,
  Filter,
  MoreVertical,
  Receipt,
  Search,
  X,
} from 'lucide-react'
import { ROUTE_PATHS } from '@/app/config/routes'
import {
  Dialog,
  DialogClose,
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
import { PageSection } from '@/components/shared/page-section'
import {
  getServiceInvoiceDetail,
  getServiceInvoicesPage,
  setServiceInvoiceLoyalty,
} from '@/features/service-invoices/api/customer-service-invoices-api'
import { initiateServiceInvoicePayment } from '@/features/payments/api/payments-api'
import {
  KhaltiCheckoutPanel,
} from '@/features/payments/components/khalti-checkout-panel'
import { redirectToKhaltiCheckout } from '@/features/payments/lib/khalti-checkout'
import { canPayKhaltiInvoice } from '@/features/payments/lib/khalti-checkout-utils'
import type { ServiceInvoiceListItem } from '@/features/service-invoices/types/customer-service-invoices'
import { usePagination } from '@/hooks/use-pagination'
import { formatDateOnly } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError, type PaginatedResponse, type SortRequest } from '@/types/api'

const PAYMENT_STATUSES = ['Unpaid', 'Partial', 'Paid', 'Overdue', 'Cancelled']
const LOYALTY_THRESHOLD = 5000
const LOYALTY_DISCOUNT_PERCENT = 10

type InvoiceSortKey =
  | 'dateDesc'
  | 'dateAsc'
  | 'amountDesc'
  | 'amountAsc'

const INVOICE_SORT_OPTIONS: { label: string; key: InvoiceSortKey; sorts: SortRequest[] }[] = [
  { label: 'Newest first', key: 'dateDesc', sorts: [{ sortBy: 'serviceDate', sortDirection: 'Desc' }] },
  { label: 'Oldest first', key: 'dateAsc', sorts: [{ sortBy: 'serviceDate', sortDirection: 'Asc' }] },
  { label: 'Highest amount', key: 'amountDesc', sorts: [{ sortBy: 'totalAmount', sortDirection: 'Desc' }] },
  { label: 'Lowest amount', key: 'amountAsc', sorts: [{ sortBy: 'totalAmount', sortDirection: 'Asc' }] },
]

function getSortLabel(key: InvoiceSortKey) {
  return INVOICE_SORT_OPTIONS.find((option) => option.key === key)?.label ?? 'Newest first'
}

function getSorts(key: InvoiceSortKey): SortRequest[] {
  return (
    INVOICE_SORT_OPTIONS.find((option) => option.key === key)?.sorts ??
    INVOICE_SORT_OPTIONS[0].sorts
  )
}

function paymentBadgeClass(status: string, balanceDue: number) {
  if (status === 'Overdue') {
    return 'badge br'
  }

  if (status === 'Paid' || balanceDue === 0) {
    return 'badge bg'
  }

  return 'badge ba'
}

function getServiceSubtotal(invoice: ServiceInvoiceListItem) {
  return invoice.laborCharge + invoice.partsCharge
}

function isLoyaltyEligible(invoice: ServiceInvoiceListItem) {
  return getServiceSubtotal(invoice) > LOYALTY_THRESHOLD
}

function hasLoyaltyApplied(invoice: ServiceInvoiceListItem) {
  return Math.abs(invoice.discountPercent - LOYALTY_DISCOUNT_PERCENT) < 0.001
}

function getServiceLoyaltyDiscountAmount(invoice: ServiceInvoiceListItem) {
  if (!hasLoyaltyApplied(invoice)) {
    return 0
  }

  return Math.round(
    (getServiceSubtotal(invoice) * LOYALTY_DISCOUNT_PERCENT) / 100,
  )
}

function getServiceTotalBeforeLoyalty(invoice: ServiceInvoiceListItem) {
  return getServiceSubtotal(invoice) + invoice.taxAmount
}

function TotalWithLoyaltyDisplay({
  invoice,
}: {
  invoice: ServiceInvoiceListItem
}) {
  if (!hasLoyaltyApplied(invoice)) {
    return <>{formatCurrency(invoice.totalAmount)}</>
  }

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span>{formatCurrency(invoice.totalAmount)}</span>
      <span className="text-xs font-normal text-[var(--vs-muted)] line-through">
        {formatCurrency(getServiceTotalBeforeLoyalty(invoice))}
      </span>
    </span>
  )
}

function canToggleLoyalty(invoice: ServiceInvoiceListItem) {
  return (
    invoice.amountPaid <= 0 &&
    invoice.paymentStatus !== 'Paid' &&
    invoice.paymentStatus !== 'Partial' &&
    invoice.paymentStatus !== 'Cancelled'
  )
}

export function CustomerServiceInvoicesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const pagination = usePagination(1, 10)
  const [searchText, setSearchText] = React.useState('')
  const [debouncedSearchText, setDebouncedSearchText] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [sortKey, setSortKey] = React.useState<InvoiceSortKey>('dateDesc')
  const [result, setResult] =
    React.useState<PaginatedResponse<ServiceInvoiceListItem> | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] =
    React.useState<ServiceInvoiceListItem | null>(null)
  const [isPayMode, setIsPayMode] = React.useState(false)
  const [isUpdatingLoyalty, setIsUpdatingLoyalty] = React.useState(false)
  const linkedInvoiceIdParam = searchParams.get('invoiceId')
  const linkedInvoiceMode = searchParams.get('mode')

  function openInvoiceView(item: ServiceInvoiceListItem) {
    setSelectedInvoice(item)
    setIsPayMode(false)
  }

  function openInvoiceCheckout(item: ServiceInvoiceListItem) {
    setSelectedInvoice(item)
    setIsPayMode(true)
  }

  function closeInvoiceDialog() {
    setSelectedInvoice(null)
    setIsPayMode(false)
    if (linkedInvoiceIdParam || linkedInvoiceMode) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('invoiceId')
      nextParams.delete('mode')
      setSearchParams(nextParams, { replace: true })
    }
  }

  async function handleServiceInvoicePay(amount: number) {
    if (!selectedInvoice) {
      return
    }

    const initiation = await initiateServiceInvoicePayment(
      selectedInvoice.serviceInvoiceId,
      { amount },
    )
    redirectToKhaltiCheckout(initiation)
  }

  async function handleLoyaltyToggle(
    invoice: ServiceInvoiceListItem,
    applyLoyalty: boolean,
  ) {
    try {
      setIsUpdatingLoyalty(true)
      setError(null)

      const updatedInvoice = await setServiceInvoiceLoyalty(
        invoice.serviceInvoiceId,
        { applyLoyalty },
      )

      setSelectedInvoice((current) =>
        current?.serviceInvoiceId === updatedInvoice.serviceInvoiceId
          ? updatedInvoice
          : current,
      )
      setResult((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          items: current.items.map((item) =>
            item.serviceInvoiceId === updatedInvoice.serviceInvoiceId
              ? updatedInvoice
              : item,
          ),
        }
      })
    } catch (updateError) {
      setError(
        updateError instanceof ApiError || updateError instanceof Error
          ? updateError.message
          : 'Unable to update loyalty discount.',
      )
    } finally {
      setIsUpdatingLoyalty(false)
    }
  }

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 300)
    return () => clearTimeout(timer)
  }, [searchText])

  React.useEffect(() => {
    let isMounted = true

    async function loadInvoices() {
      try {
        setIsLoading(true)
        setError(null)
        const nextResult = await getServiceInvoicesPage({
          pageNumber: pagination.page,
          pageSize: pagination.pageSize,
          searchText: debouncedSearchText.trim() || undefined,
          status: statusFilter || undefined,
          sorts: getSorts(sortKey),
        })

        if (!isMounted) {
          return
        }

        setResult(nextResult)
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setResult(null)
        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load service invoices.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInvoices()

    return () => {
      isMounted = false
    }
  }, [
    debouncedSearchText,
    pagination.page,
    pagination.pageSize,
    sortKey,
    statusFilter,
  ])

  React.useEffect(() => {
    const invoiceId = Number(linkedInvoiceIdParam)
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      return
    }

    let isMounted = true

    async function loadLinkedInvoice() {
      try {
        setError(null)
        const invoice = await getServiceInvoiceDetail(invoiceId)

        if (!isMounted) {
          return
        }

        setSelectedInvoice(invoice)
        setIsPayMode(
          linkedInvoiceMode === 'pay' &&
            canPayKhaltiInvoice(invoice.paymentStatus, invoice.balanceDue),
        )
        setResult((current) => {
          if (!current) {
            return current
          }

          const hasInvoice = current.items.some(
            (item) => item.serviceInvoiceId === invoice.serviceInvoiceId,
          )

          if (!hasInvoice) {
            return current
          }

          return {
            ...current,
            items: current.items.map((item) =>
              item.serviceInvoiceId === invoice.serviceInvoiceId ? invoice : item,
            ),
          }
        })
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to open the selected invoice.',
        )
      }
    }

    void loadLinkedInvoice()

    return () => {
      isMounted = false
    }
  }, [linkedInvoiceIdParam, linkedInvoiceMode])

  function resetToFirstPage() {
    pagination.setPage(1)
  }

  const invoices = result?.items ?? []
  const totalRecords = result?.totalRecords ?? 0
  const totalPages = result && result.totalPages > 0 ? result.totalPages : 1
  const startRecord =
    totalRecords === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const endRecord =
    totalRecords === 0 ? 0 : Math.min(startRecord + invoices.length - 1, totalRecords)
  const hasFilters = Boolean(searchText.trim() || statusFilter)

  return (
    <PageSection
      description="Detailed list of service invoices with payment status, totals, and quick actions."
      title="Service Invoices"
    >
      {error ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 max-md:flex-col max-md:items-stretch">
          <label className="flex min-h-[38px] w-[min(440px,100%)] items-center gap-2 rounded-full border border-[var(--vs-border)] bg-[var(--vs-bg)] px-3 text-[var(--vs-muted)] max-md:w-full">
            <Search size={16} />
            <input
              aria-label="Search service invoices"
              className="w-full min-w-0 border-0 bg-transparent text-[13px] text-[var(--vs-text)] outline-none placeholder:text-[var(--vs-faint)]"
              onChange={(event) => {
                resetToFirstPage()
                setSearchText(event.target.value)
              }}
              placeholder="Vehicle number or diagnosis"
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
                    {statusFilter || 'All payment statuses'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="!w-[210px] !min-w-[210px]">
                <DropdownMenuLabel>Payment status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  onValueChange={(value) => {
                    resetToFirstPage()
                    setStatusFilter(value === 'all' ? '' : value)
                  }}
                  value={statusFilter || 'all'}
                >
                  <DropdownMenuRadioItem
                    className="gap-2 py-[7px] pl-2.5 pr-7 text-xs"
                    value="all"
                  >
                    All payment statuses
                  </DropdownMenuRadioItem>
                  {PAYMENT_STATUSES.map((status) => (
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
              <DropdownMenuContent align="end" className="!w-[200px] !min-w-[200px]">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  onValueChange={(value) => {
                    resetToFirstPage()
                    setSortKey(value as InvoiceSortKey)
                  }}
                  value={sortKey}
                >
                  {INVOICE_SORT_OPTIONS.map((option) => (
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
              key: 'serviceInvoiceId',
              header: 'Invoice',
              render: (item) => (
                <span className="font-bold text-[var(--vs-text)]">
                  #{item.serviceInvoiceId}
                </span>
              ),
            },
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
              key: 'diagnosis',
              header: 'Diagnosis',
              className: 'max-w-[260px]',
              render: (item) => (
                <span
                  className="line-clamp-2 text-[13px] text-[var(--vs-text)]"
                  title={item.diagnosis}
                >
                  {item.diagnosis || '—'}
                </span>
              ),
            },
            {
              key: 'staffMemberName',
              header: 'Handled by',
              render: (item) => item.staffMemberName || 'Unassigned',
            },
            {
              key: 'totalAmount',
              header: 'Total',
              render: (item) => (
                <span className="font-bold text-[var(--vs-text)]">
                  <TotalWithLoyaltyDisplay invoice={item} />
                </span>
              ),
            },
            {
              key: 'balanceDue',
              header: 'Balance',
              render: (item) => formatCurrency(item.balanceDue),
            },
            {
              key: 'paymentStatus',
              header: 'Payment',
              render: (item) => (
                <span className={paymentBadgeClass(item.paymentStatus, item.balanceDue)}>
                  {item.paymentStatus}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              className: '!w-9 !min-w-9 !max-w-9 !px-1 !text-center whitespace-nowrap',
              render: (item) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={`Actions for invoice ${item.serviceInvoiceId}`}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[var(--vs-muted)] hover:bg-[var(--vs-green-100)] hover:text-[var(--vs-green-800)]"
                      type="button"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="!w-[210px] !min-w-[210px]">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 px-2.5 py-2 text-xs"
                      onSelect={() => {
                        window.setTimeout(() => openInvoiceView(item), 0)
                      }}
                    >
                      <Receipt size={15} />
                      View invoice
                    </DropdownMenuItem>
                    {canToggleLoyalty(item) &&
                    (isLoyaltyEligible(item) || hasLoyaltyApplied(item)) ? (
                      <DropdownMenuItem
                        className="gap-2 px-2.5 py-2 text-xs"
                        disabled={isUpdatingLoyalty}
                        onSelect={() => {
                          window.setTimeout(
                            () =>
                              void handleLoyaltyToggle(
                                item,
                                !hasLoyaltyApplied(item),
                              ),
                            0,
                          )
                        }}
                      >
                        {hasLoyaltyApplied(item) ? (
                          <>
                            <BadgeX size={15} />
                            Remove loyalty
                          </>
                        ) : (
                          <>
                            <BadgePercent size={15} />
                            Apply loyalty 10%
                          </>
                        )}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                      className="gap-2 px-2.5 py-2 text-xs"
                      disabled={
                        item.balanceDue <= 0 ||
                        item.paymentStatus === 'Cancelled' ||
                        item.paymentStatus === 'Paid'
                      }
                      onSelect={() => {
                        window.setTimeout(() => openInvoiceCheckout(item), 0)
                      }}
                    >
                      <CreditCard size={15} />
                      Pay now
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 px-2.5 py-2 text-xs"
                      onSelect={() => {
                        window.setTimeout(
                          () =>
                            navigate(
                              ROUTE_PATHS.customer.serviceHistoryDetail(item.serviceRecordId),
                            ),
                          0,
                        )
                      }}
                    >
                      <Eye size={15} />
                      View service details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ]}
          emptyMessage={
            isLoading
              ? 'Loading service invoices...'
              : hasFilters
                ? 'No service invoices match these filters.'
                : 'No service invoices recorded yet.'
          }
          rows={invoices}
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
              disabled={isLoading || pagination.page <= 1}
              onClick={() => pagination.setPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              Previous
            </button>
            <button
              className="tb-btn"
              disabled={
                isLoading || totalRecords === 0 || pagination.page >= totalPages
              }
              onClick={() =>
                pagination.setPage((page) => Math.min(totalPages, page + 1))
              }
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            closeInvoiceDialog()
          }
        }}
        open={selectedInvoice !== null}
      >
        <DialogContent className="!max-w-[640px]" showCloseButton={false}>
          {selectedInvoice ? (
            <>
              <DialogHeader className="flex flex-row items-start justify-between gap-3">
                <div className="space-y-1">
                  <DialogTitle>
                    {isPayMode
                      ? 'Pay with Khalti'
                      : `Invoice #${selectedInvoice.serviceInvoiceId}`}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedInvoice.vehicleNumber} •{' '}
                    {formatDateOnly(selectedInvoice.serviceDate)}
                    {isPayMode ? ` • Service #${selectedInvoice.serviceRecordId}` : null}
                  </DialogDescription>
                </div>
                <DialogClose asChild>
                  <button
                    aria-label="Close"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--vs-muted)] hover:bg-[var(--vs-green-100)] hover:text-[var(--vs-green-800)]"
                    type="button"
                  >
                    <X size={16} />
                  </button>
                </DialogClose>
              </DialogHeader>

              {isPayMode ? (
                <KhaltiCheckoutPanel
                  onPay={handleServiceInvoicePay}
                  summary={{
                    title: 'Service invoice',
                    subtitle: `Invoice #${selectedInvoice.serviceInvoiceId}`,
                    contextLabel: 'Service',
                    contextValue: `#${selectedInvoice.serviceRecordId}`,
                    totalAmount: selectedInvoice.totalAmount,
                    amountPaid: selectedInvoice.amountPaid,
                    balanceDue: selectedInvoice.balanceDue,
                    paymentStatus: selectedInvoice.paymentStatus,
                  }}
                />
              ) : (
              <div className="space-y-4 text-[13px]">
                <div className="rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vs-muted)]">
                    Diagnosis
                  </div>
                  <div className="mt-1 whitespace-pre-line text-[13px] text-[var(--vs-text)]">
                    {selectedInvoice.diagnosis || '—'}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[12px] text-[var(--vs-muted)]">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide">
                        Handled by
                      </div>
                      <div className="text-[var(--vs-text)]">
                        {selectedInvoice.staffMemberName || 'Unassigned'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wide">
                        Service status
                      </div>
                      <div className="text-[var(--vs-text)]">
                        {selectedInvoice.serviceStatus}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedInvoice.partsUsed.length > 0 ? (
                  <div className="rounded-2xl border border-[var(--vs-border)] bg-white">
                    <div className="border-b border-[var(--vs-soft-border)] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--vs-muted)]">
                      Parts used
                    </div>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-[var(--vs-soft-border)] text-[10px] uppercase tracking-wide text-[var(--vs-muted)]">
                          <th className="px-4 py-2 text-left font-semibold">Part</th>
                          <th className="px-4 py-2 text-left font-semibold">Brand</th>
                          <th className="px-4 py-2 text-right font-semibold">Qty</th>
                          <th className="px-4 py-2 text-right font-semibold">Unit price</th>
                          <th className="px-4 py-2 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.partsUsed.map((part, i) => (
                          <tr
                            className="border-b border-[var(--vs-soft-border)] last:border-0"
                            key={i}
                          >
                            <td className="px-4 py-2 text-[var(--vs-text)]">{part.partName}</td>
                            <td className="px-4 py-2 text-[var(--vs-muted)]">{part.brand}</td>
                            <td className="px-4 py-2 text-right text-[var(--vs-text)]">{part.quantity}</td>
                            <td className="px-4 py-2 text-right text-[var(--vs-text)]">{formatCurrency(part.unitPrice)}</td>
                            <td className="px-4 py-2 text-right font-semibold text-[var(--vs-text)]">{formatCurrency(part.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-[var(--vs-border)] bg-white">
                  <div className="border-b border-[var(--vs-soft-border)] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--vs-muted)]">
                    Charges
                  </div>
                  <dl className="grid grid-cols-2 gap-y-2 px-4 py-3 text-[13px]">
                    <dt className="text-[var(--vs-muted)]">Labor charge</dt>
                    <dd className="text-right text-[var(--vs-text)]">
                      {formatCurrency(selectedInvoice.laborCharge)}
                    </dd>
                    <dt className="text-[var(--vs-muted)]">Parts charge</dt>
                    <dd className="text-right text-[var(--vs-text)]">
                      {formatCurrency(selectedInvoice.partsCharge)}
                    </dd>
                    <dt className="text-[var(--vs-muted)]">
                      {hasLoyaltyApplied(selectedInvoice)
                        ? `Loyalty discount (${LOYALTY_DISCOUNT_PERCENT}%)`
                        : `Discount (${selectedInvoice.discountPercent}%)`}
                    </dt>
                    <dd className="text-right text-[var(--vs-text)]">
                      -
                      {formatCurrency(
                        hasLoyaltyApplied(selectedInvoice)
                          ? getServiceLoyaltyDiscountAmount(selectedInvoice)
                          : (getServiceSubtotal(selectedInvoice) *
                              selectedInvoice.discountPercent) /
                            100,
                      )}
                    </dd>
                    <dt className="text-[var(--vs-muted)]">Loyalty</dt>
                    <dd className="text-right text-[var(--vs-text)]">
                      {hasLoyaltyApplied(selectedInvoice)
                        ? `Applied (${LOYALTY_DISCOUNT_PERCENT}%)`
                        : isLoyaltyEligible(selectedInvoice)
                          ? `Eligible (${LOYALTY_DISCOUNT_PERCENT}%)`
                          : `Not eligible (subtotal must be > ${formatCurrency(LOYALTY_THRESHOLD)})`}
                    </dd>
                    <dt className="text-[var(--vs-muted)]">Tax</dt>
                    <dd className="text-right text-[var(--vs-text)]">
                      {formatCurrency(selectedInvoice.taxAmount)}
                    </dd>
                    <dt className="border-t border-[var(--vs-soft-border)] pt-2 font-semibold text-[var(--vs-text)]">
                      Total
                    </dt>
                    <dd className="border-t border-[var(--vs-soft-border)] pt-2 text-right font-bold text-[var(--vs-text)]">
                      <TotalWithLoyaltyDisplay invoice={selectedInvoice} />
                    </dd>
                    <dt className="text-[var(--vs-muted)]">Amount paid</dt>
                    <dd className="text-right text-[var(--vs-text)]">
                      {formatCurrency(selectedInvoice.amountPaid)}
                    </dd>
                    <dt className="font-semibold text-[var(--vs-text)]">Balance due</dt>
                    <dd className="text-right font-bold text-[var(--vs-text)]">
                      {formatCurrency(selectedInvoice.balanceDue)}
                    </dd>
                    <dt className="text-[var(--vs-muted)]">Payment status</dt>
                    <dd className="text-right">
                      <span
                        className={paymentBadgeClass(
                          selectedInvoice.paymentStatus,
                          selectedInvoice.balanceDue,
                        )}
                      >
                        {selectedInvoice.paymentStatus}
                      </span>
                    </dd>
                  </dl>
                </div>

              </div>
              )}

              <DialogFooter className="flex flex-row items-center justify-between gap-2">
                {isPayMode ? (
                  <button
                    className="tb-btn"
                    onClick={() => setIsPayMode(false)}
                    type="button"
                  >
                    <ArrowLeft size={14} />
                    Back to invoice
                  </button>
                ) : (
                  <button
                    className="tb-btn"
                    onClick={() =>
                      navigate(
                        ROUTE_PATHS.customer.serviceHistoryDetail(
                          selectedInvoice.serviceRecordId,
                        ),
                      )
                    }
                    type="button"
                  >
                    <Eye size={14} />
                    View service details
                  </button>
                )}

                <div className="flex items-center gap-2">
                  {!isPayMode &&
                  canToggleLoyalty(selectedInvoice) &&
                  (isLoyaltyEligible(selectedInvoice) ||
                    hasLoyaltyApplied(selectedInvoice)) ? (
                    <button
                      className="tb-btn inline-flex items-center gap-2"
                      disabled={isUpdatingLoyalty}
                      onClick={() =>
                        void handleLoyaltyToggle(
                          selectedInvoice,
                          !hasLoyaltyApplied(selectedInvoice),
                        )
                      }
                      type="button"
                    >
                      {isUpdatingLoyalty ? (
                        'Updating...'
                      ) : hasLoyaltyApplied(selectedInvoice) ? (
                        <>
                          <BadgeX size={14} />
                          Remove loyalty
                        </>
                      ) : (
                        <>
                          <BadgePercent size={14} />
                          Apply loyalty 10%
                        </>
                      )}
                    </button>
                  ) : null}
                  <DialogClose asChild>
                    <button className="tb-btn" type="button">
                      Close
                    </button>
                  </DialogClose>
                  {!isPayMode &&
                  canPayKhaltiInvoice(
                    selectedInvoice.paymentStatus,
                    selectedInvoice.balanceDue,
                  ) ? (
                    <button
                      className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-[7px] rounded-full border border-[var(--vs-green-600)] bg-[var(--vs-green-600)] px-4 text-xs font-bold text-white hover:border-[var(--vs-green-800)] hover:bg-[var(--vs-green-800)] active:border-[var(--vs-green-900)] active:bg-[var(--vs-green-900)]"
                      onClick={() => setIsPayMode(true)}
                      type="button"
                    >
                      <CreditCard size={14} />
                      Pay now
                    </button>
                  ) : null}
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageSection>
  )
}
