import * as React from 'react'
import { ArrowDownUp, Filter, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/shared/data-table'
import { DateRangeFilterPopover } from '@/components/shared/date-range-filter-popover'
import { PageSection } from '@/components/shared/page-section'
import { ErrorAlert } from '@/components/shared/error-alert'
import { PaginationFooter } from '@/components/shared/pagination-footer'
import { getCustomerPaymentsPage } from '@/features/payments/api/payments-api'
import type { CustomerPaymentListItem } from '@/features/payments/types/payments'
import { usePagination } from '@/hooks/use-pagination'
import { formatDateTime } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError, type PaginatedResponse, type SortRequest } from '@/types/api'

const INVOICE_KIND_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Service', value: 'Service' },
  { label: 'Purchase', value: 'Sales' },
]

const PAYMENT_STATUSES = [
  { label: 'Unpaid', value: 'Unpaid' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Overdue', value: 'Overdue' },
  { label: 'Cancelled', value: 'Cancelled' },
]

type PaymentSortKey = 'dateDesc' | 'dateAsc' | 'amountDesc' | 'amountAsc'

const PAYMENT_SORT_OPTIONS: { label: string; key: PaymentSortKey; sorts: SortRequest[] }[] = [
  { label: 'Newest first', key: 'dateDesc', sorts: [{ sortBy: 'paymentDate', sortDirection: 'Desc' }] },
  { label: 'Oldest first', key: 'dateAsc', sorts: [{ sortBy: 'paymentDate', sortDirection: 'Asc' }] },
  { label: 'Highest amount', key: 'amountDesc', sorts: [{ sortBy: 'amount', sortDirection: 'Desc' }] },
  { label: 'Lowest amount', key: 'amountAsc', sorts: [{ sortBy: 'amount', sortDirection: 'Asc' }] },
]

function getSortLabel(key: PaymentSortKey) {
  return PAYMENT_SORT_OPTIONS.find((option) => option.key === key)?.label ?? 'Newest first'
}

function getSorts(key: PaymentSortKey): SortRequest[] {
  return PAYMENT_SORT_OPTIONS.find((option) => option.key === key)?.sorts ?? PAYMENT_SORT_OPTIONS[0].sorts
}

function getInvoiceFilterLabel(invoiceKind: string, invoiceStatus: string) {
  const parts: string[] = []

  if (invoiceKind) {
    parts.push(
      INVOICE_KIND_OPTIONS.find((option) => option.value === invoiceKind)?.label ?? invoiceKind,
    )
  }

  if (invoiceStatus) {
    parts.push(
      PAYMENT_STATUSES.find((option) => option.value === invoiceStatus)?.label ?? invoiceStatus,
    )
  }

  if (parts.length === 0) {
    return 'Invoice filters'
  }

  return parts.join(' · ')
}

function invoiceStatusBadgeClass(status: string) {
  if (status === 'Overdue') {
    return 'badge br'
  }
  if (status === 'Paid') {
    return 'badge bg'
  }
  return 'badge ba'
}

export function CustomerPaymentsPage() {
  const pagination = usePagination(1, 10)
  const [searchText, setSearchText] = React.useState('')
  const [debouncedSearchText, setDebouncedSearchText] = React.useState('')
  const [invoiceKind, setInvoiceKind] = React.useState('')
  const [invoiceStatus, setInvoiceStatus] = React.useState('')
  const [fromDate, setFromDate] = React.useState('')
  const [toDate, setToDate] = React.useState('')
  const [sortKey, setSortKey] = React.useState<PaymentSortKey>('dateDesc')
  const [result, setResult] = React.useState<PaginatedResponse<CustomerPaymentListItem> | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 300)
    return () => clearTimeout(timer)
  }, [searchText])

  React.useEffect(() => {
    let isMounted = true

    async function loadPayments() {
      try {
        setIsLoading(true)
        setError(null)
        const nextResult = await getCustomerPaymentsPage({
          pageNumber: pagination.page,
          pageSize: pagination.pageSize,
          searchText: debouncedSearchText.trim() || undefined,
          invoiceKind: invoiceKind || undefined,
          invoiceStatus: invoiceStatus || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          sorts: getSorts(sortKey),
        })

        if (isMounted) {
          setResult(nextResult)
        }
      } catch (loadError) {
        if (!isMounted) {
          return
        }
        setResult(null)
        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load payments.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPayments()

    return () => {
      isMounted = false
    }
  }, [
    debouncedSearchText,
    fromDate,
    invoiceKind,
    invoiceStatus,
    pagination.page,
    pagination.pageSize,
    sortKey,
    toDate,
  ])

  const payments = result?.items ?? []
  const totalRecords = result?.totalRecords ?? 0
  const totalPages = result && result.totalPages > 0 ? result.totalPages : 1
  const hasFilters = Boolean(
    searchText.trim() || invoiceKind || invoiceStatus || fromDate || toDate,
  )

  return (
    <PageSection
      description="All Khalti payments recorded against your service and purchase invoices."
      title="Payments"
    >
      <ErrorAlert message={error} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-[38px] w-[min(440px,100%)] items-center gap-2 rounded-full border border-[var(--vs-border)] bg-[var(--vs-bg)] px-3 text-[var(--vs-muted)] max-md:w-full">
            <Search size={16} />
            <input
              aria-label="Search payments"
              className="w-full min-w-0 border-0 bg-transparent text-[13px] text-[var(--vs-text)] outline-none placeholder:text-[var(--vs-faint)]"
              onChange={(event) => {
                pagination.setPage(1)
                setSearchText(event.target.value)
              }}
              placeholder="Invoice, vehicle, or transaction id"
              type="search"
              value={searchText}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex min-h-[38px] max-w-[220px] cursor-pointer items-center justify-center gap-[7px] rounded-full border border-[var(--vs-border)] bg-white px-3.5 text-xs font-bold text-[var(--vs-green-800)] hover:bg-[var(--vs-green-100)] data-[state=open]:bg-[var(--vs-green-100)]"
                  type="button"
                >
                  <Filter size={15} />
                  <span className="truncate">{getInvoiceFilterLabel(invoiceKind, invoiceStatus)}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="!w-[220px] !min-w-[220px]">
                <DropdownMenuLabel>Invoice type</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  onValueChange={(value) => {
                    pagination.setPage(1)
                    setInvoiceKind(value)
                  }}
                  value={invoiceKind}
                >
                  {INVOICE_KIND_OPTIONS.map((option) => (
                    <DropdownMenuRadioItem className="gap-2 py-[7px] pl-2.5 pr-7 text-xs" key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Invoice status</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  onValueChange={(value) => {
                    pagination.setPage(1)
                    setInvoiceStatus(value)
                  }}
                  value={invoiceStatus}
                >
                  <DropdownMenuRadioItem className="gap-2 py-[7px] pl-2.5 pr-7 text-xs" value="">All statuses</DropdownMenuRadioItem>
                  {PAYMENT_STATUSES.map((option) => (
                    <DropdownMenuRadioItem className="gap-2 py-[7px] pl-2.5 pr-7 text-xs" key={option.value} value={option.value}>
                      {option.label}
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
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">{getSortLabel(sortKey)}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="!w-[200px] !min-w-[200px]">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  onValueChange={(value) => {
                    pagination.setPage(1)
                    setSortKey(value as PaymentSortKey)
                  }}
                  value={sortKey}
                >
                  {PAYMENT_SORT_OPTIONS.map((option) => (
                    <DropdownMenuRadioItem className="gap-2 py-[7px] pl-2.5 pr-7 text-xs" key={option.key} value={option.key}>
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DateRangeFilterPopover
              fromDate={fromDate}
              onApply={(nextFrom, nextTo) => {
                pagination.setPage(1)
                setFromDate(nextFrom)
                setToDate(nextTo)
              }}
              toDate={toDate}
            />
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: 'paymentDate',
              header: 'Date',
              render: (item) => formatDateTime(item.paymentDate),
            },
            {
              key: 'invoiceReference',
              header: 'Invoice',
              render: (item) => (
                <div>
                  <div className="font-semibold text-[var(--vs-text)]">{item.invoiceReference}</div>
                  <div className="text-[11px] text-[var(--vs-muted)]">
                    {item.invoiceKind === 'Sales' ? 'Purchase' : item.invoiceKind}
                  </div>
                </div>
              ),
            },
            {
              key: 'vehicleNumber',
              header: 'Vehicle',
              render: (item) => item.vehicleNumber || '—',
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (item) => (
                <span className="font-bold text-[var(--vs-text)]">{formatCurrency(item.amount)}</span>
              ),
            },
            {
              key: 'paymentType',
              header: 'Method',
              render: (item) => item.paymentType,
            },
            {
              key: 'invoicePaymentStatus',
              header: 'Invoice status',
              render: (item) => (
                <span className={invoiceStatusBadgeClass(item.invoicePaymentStatus)}>
                  {item.invoicePaymentStatus}
                </span>
              ),
            },
            {
              key: 'transactionId',
              header: 'Txn ID',
              render: (item) => (
                <span className="font-mono text-[11px] text-[var(--vs-muted)]">
                  {item.transactionId || '—'}
                </span>
              ),
            },
          ]}
          emptyMessage={
            isLoading
              ? 'Loading payments...'
              : hasFilters
                ? 'No payments match these filters.'
                : 'No payment records yet.'
          }
          rows={payments}
        />

        <PaginationFooter
          pageNumber={pagination.page}
          pageSize={pagination.pageSize}
          totalRecords={totalRecords}
          totalPages={totalPages}
          itemCount={payments.length}
          isLoading={isLoading}
          onPrevious={() => pagination.setPage((page) => Math.max(1, page - 1))}
          onNext={() => pagination.setPage((page) => Math.min(totalPages, page + 1))}
        />
      </div>
    </PageSection>
  )
}
