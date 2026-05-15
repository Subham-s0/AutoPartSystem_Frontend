import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  BadgePercent,
  BadgeX,
  CreditCard,
  Eye,
  MessageSquarePlus,
  MoreVertical,
} from 'lucide-react'
import { ROUTE_PATHS } from '@/app/config/routes'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/shared/data-table'
import { ErrorAlert } from '@/components/shared/error-alert'
import { ListToolbar, type FilterOption } from '@/components/shared/list-toolbar'
import { PageSection } from '@/components/shared/page-section'
import { PaginationFooter } from '@/components/shared/pagination-footer'
import {
  getPurchaseHistoryPage,
  getPurchaseHistoryDetail,
  getServiceHistoryPage,
  setPurchaseInvoiceLoyalty,
} from '@/features/history/api/history-api'
import { initiatePurchaseInvoicePayment } from '@/features/payments/api/payments-api'
import { KhaltiCheckoutDialog } from '@/features/payments/components/khalti-checkout-dialog'
import { canPayKhaltiInvoice } from '@/features/payments/components/khalti-checkout-panel'
import { redirectToKhaltiCheckout } from '@/features/payments/lib/khalti-checkout'
import type {
  PurchaseInvoiceLoyaltyResult,
  PurchaseHistory,
  ServiceHistory,
} from '@/features/history/types/history'
import { ReviewFormDialog, type ReviewFormMode } from '@/features/reviews/components/review-form-dialog'
import { createReview, updateReview } from '@/features/reviews/api/reviews-api'
import type { Review, UnreviewedService } from '@/features/reviews/types/reviews'
import { usePagination } from '@/hooks/use-pagination'
import { formatDateOnly } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError, type PaginatedResponse, type SortRequest } from '@/types/api'

type StatusOption = FilterOption

const PAYMENT_STATUSES: StatusOption[] = [
  { label: 'Unpaid', value: 'Unpaid' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Overdue', value: 'Overdue' },
  { label: 'Cancelled', value: 'Cancelled' },
]

const INVOICE_STATUS_OPTIONS: StatusOption[] = [
  { label: 'Not invoiced', value: 'NotInvoiced' },
  { label: 'Unpaid', value: 'Unpaid' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Overdue', value: 'Overdue' },
  { label: 'Cancelled', value: 'Cancelled' },
]

const LOYALTY_THRESHOLD = 5000
const LOYALTY_DISCOUNT_PERCENT = 10



type AmountDateSortKey = 'dateDesc' | 'dateAsc' | 'amountDesc' | 'amountAsc'

interface SortOption {
  label: string
  key: AmountDateSortKey
  sorts: SortRequest[]
}

function buildSortOptions(dateField: string, amountField: string): SortOption[] {
  return [
    { label: 'Newest first', key: 'dateDesc', sorts: [{ sortBy: dateField, sortDirection: 'Desc' }] },
    { label: 'Oldest first', key: 'dateAsc', sorts: [{ sortBy: dateField, sortDirection: 'Asc' }] },
    { label: 'Highest amount', key: 'amountDesc', sorts: [{ sortBy: amountField, sortDirection: 'Desc' }] },
    { label: 'Lowest amount', key: 'amountAsc', sorts: [{ sortBy: amountField, sortDirection: 'Asc' }] },
  ]
}

const PURCHASE_SORT_OPTIONS = buildSortOptions('invoiceDate', 'totalAmount')
const SERVICE_SORT_OPTIONS = buildSortOptions('serviceDate', 'totalCharge')

function getSorts(options: SortOption[], key: AmountDateSortKey): SortRequest[] {
  return options.find((option) => option.key === key)?.sorts ?? options[0].sorts
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

function hasPurchaseLoyaltyApplied(purchase: PurchaseHistory) {
  return Math.abs(purchase.discountPercent - LOYALTY_DISCOUNT_PERCENT) < 0.001
}

function getPurchaseInvoiceLevelDiscount(purchase: PurchaseHistory) {
  return Math.round(purchase.subtotal * (purchase.discountPercent / 100))
}

function getPurchaseLineDiscountAmount(purchase: PurchaseHistory) {
  return Math.max(0, purchase.discountAmount - getPurchaseInvoiceLevelDiscount(purchase))
}

function getPurchaseLoyaltyDiscountAmount(purchase: PurchaseHistory) {
  if (!hasPurchaseLoyaltyApplied(purchase)) {
    return 0
  }

  return getPurchaseInvoiceLevelDiscount(purchase)
}

function getPurchaseTotalBeforeLoyalty(purchase: PurchaseHistory) {
  return purchase.subtotal - getPurchaseLineDiscountAmount(purchase) + purchase.taxAmount
}

function PurchaseTotalWithLoyaltyDisplay({ purchase }: { purchase: PurchaseHistory }) {
  if (!hasPurchaseLoyaltyApplied(purchase)) {
    return <>{formatCurrency(purchase.totalAmount)}</>
  }

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="font-semibold text-[var(--vs-text)]">
        {formatCurrency(purchase.totalAmount)}
      </span>
      <span className="text-xs text-[var(--vs-muted)] line-through">
        {formatCurrency(getPurchaseTotalBeforeLoyalty(purchase))}
      </span>
    </span>
  )
}

function isPurchaseLoyaltyEligible(purchase: PurchaseHistory) {
  return purchase.subtotal > LOYALTY_THRESHOLD
}

function canTogglePurchaseLoyalty(purchase: PurchaseHistory) {
  return (
    purchase.amountPaid <= 0 &&
    purchase.paymentStatus !== 'Paid' &&
    purchase.paymentStatus !== 'Partial' &&
    purchase.paymentStatus !== 'Cancelled'
  )
}

function serviceStatusBadgeClass(status: string) {
  return status === 'Closed' ? 'badge bg' : 'badge ba'
}

function invoiceCellBadge(service: ServiceHistory) {
  if (!service.serviceInvoice) {
    return { label: 'Not invoiced', className: 'badge ba' }
  }

  const invoice = service.serviceInvoice
  const className = paymentBadgeClass(invoice.paymentStatus, invoice.balanceDue)
  return { label: invoice.paymentStatus, className }
}

function toReviewFromService(service: ServiceHistory): Review | null {
  if (!service.review) {
    return null
  }

  return {
    reviewId: service.review.reviewId,
    serviceRecordId: service.serviceRecordId,
    vehicleNumber: service.vehicleNumber,
    serviceDate: service.serviceDate,
    diagnosis: service.diagnosis,
    workDone: service.workDone,
    rating: service.review.rating,
    reviewText: service.review.reviewText,
    createdAt: service.review.createdAt,
  }
}

function toPresetService(service: ServiceHistory): UnreviewedService {
  return {
    serviceRecordId: service.serviceRecordId,
    vehicleNumber: service.vehicleNumber,
    serviceDate: service.serviceDate,
    workDone: service.workDone,
    diagnosis: service.diagnosis,
  }
}

function canWriteReview(service: ServiceHistory) {
  return service.serviceStatus === 'Closed' && !service.review
}



export function CustomerHistoryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'services' ? 'services' : 'purchases'
  const linkedInvoiceType = searchParams.get('invoiceType')
  const linkedSalesInvoiceIdParam =
    searchParams.get('salesInvoiceId') ??
    (linkedInvoiceType?.toLowerCase() === 'sales'
      ? searchParams.get('invoiceId')
      : null)
  const linkedInvoiceMode = searchParams.get('mode')

  function setActiveTab(tab: string) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', tab)
    setSearchParams(nextParams, { replace: true })
  }

  // Purchase tab state
  const purchasePagination = usePagination(1, 10)
  const [purchaseResult, setPurchaseResult] =
    React.useState<PaginatedResponse<PurchaseHistory> | null>(null)
  const [isPurchaseLoading, setIsPurchaseLoading] = React.useState(true)
  const [purchaseError, setPurchaseError] = React.useState<string | null>(null)
  const [purchaseSearch, setPurchaseSearch] = React.useState('')
  const [debouncedPurchaseSearch, setDebouncedPurchaseSearch] = React.useState('')
  const [purchaseStatus, setPurchaseStatus] = React.useState('')
  const [purchaseSortKey, setPurchaseSortKey] = React.useState<AmountDateSortKey>('dateDesc')
  const [purchaseDetail, setPurchaseDetail] = React.useState<PurchaseHistory | null>(null)
  const [purchaseCheckout, setPurchaseCheckout] = React.useState<PurchaseHistory | null>(null)
  const [isUpdatingPurchaseLoyalty, setIsUpdatingPurchaseLoyalty] = React.useState(false)
  const handledPurchaseInvoiceLinkRef = React.useRef<string | null>(null)

  // Service tab state
  const servicePagination = usePagination(1, 10)
  const [serviceResult, setServiceResult] =
    React.useState<PaginatedResponse<ServiceHistory> | null>(null)
  const [isServiceLoading, setIsServiceLoading] = React.useState(true)
  const [serviceError, setServiceError] = React.useState<string | null>(null)
  const [serviceSearch, setServiceSearch] = React.useState('')
  const [debouncedServiceSearch, setDebouncedServiceSearch] = React.useState('')
  const [serviceInvoiceStatus, setServiceInvoiceStatus] = React.useState('')
  const [serviceSortKey, setServiceSortKey] = React.useState<AmountDateSortKey>('dateDesc')
  const [serviceReloadKey, setServiceReloadKey] = React.useState(0)

  // Review modal state
  const [isReviewFormOpen, setIsReviewFormOpen] = React.useState(false)
  const [reviewFormMode, setReviewFormMode] = React.useState<ReviewFormMode>('view')
  const [activeReview, setActiveReview] = React.useState<Review | null>(null)
  const [presetService, setPresetService] = React.useState<UnreviewedService | null>(null)
  const [reviewActionError, setReviewActionError] = React.useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = React.useState<string | null>(null)

  // Debounce search inputs
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedPurchaseSearch(purchaseSearch), 300)
    return () => clearTimeout(timer)
  }, [purchaseSearch])

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedServiceSearch(serviceSearch), 300)
    return () => clearTimeout(timer)
  }, [serviceSearch])

  // Load purchases
  React.useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        setPurchaseError(null)
        setIsPurchaseLoading(true)
        const next = await getPurchaseHistoryPage({
          pageNumber: purchasePagination.page,
          pageSize: purchasePagination.pageSize,
          searchText: debouncedPurchaseSearch.trim() || undefined,
          status: purchaseStatus || undefined,
          sorts: getSorts(PURCHASE_SORT_OPTIONS, purchaseSortKey),
        })

        if (isMounted) {
          setPurchaseResult(next)
        }
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setPurchaseResult(null)
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

    void load()

    return () => {
      isMounted = false
    }
  }, [
    purchasePagination.page,
    purchasePagination.pageSize,
    debouncedPurchaseSearch,
    purchaseStatus,
    purchaseSortKey,
  ])

  function openPurchaseCheckout(item: PurchaseHistory) {
    setPurchaseCheckout(item)
  }

  function clearPurchaseInvoiceSearchParams() {
    if (linkedSalesInvoiceIdParam || linkedInvoiceMode) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('salesInvoiceId')
      nextParams.delete('invoiceId')
      nextParams.delete('invoiceType')
      nextParams.delete('mode')
      setSearchParams(nextParams, { replace: true })
    }
  }

  function closePurchaseDetailPanel() {
    setPurchaseDetail(null)
    clearPurchaseInvoiceSearchParams()
  }

  function closePurchaseCheckoutPanel() {
    setPurchaseCheckout(null)
    clearPurchaseInvoiceSearchParams()
  }

  React.useEffect(() => {
    if (!linkedSalesInvoiceIdParam) {
      handledPurchaseInvoiceLinkRef.current = null
      return
    }

    const invoiceId = Number(linkedSalesInvoiceIdParam)
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      return
    }

    const linkKey = `${linkedSalesInvoiceIdParam}:${linkedInvoiceMode ?? 'view'}`
    if (handledPurchaseInvoiceLinkRef.current === linkKey) {
      return
    }

    function openLinkedPurchaseInvoice(invoice: PurchaseHistory) {
      setPurchaseDetail(invoice)
      setPurchaseCheckout(null)
      handledPurchaseInvoiceLinkRef.current = linkKey
    }

    const currentInvoice = purchaseResult?.items.find(
      (item) => item.salesInvoiceId === invoiceId,
    )

    if (currentInvoice) {
      openLinkedPurchaseInvoice(currentInvoice)
      return
    }

    if (isPurchaseLoading) {
      return
    }

    let isMounted = true

    async function loadLinkedPurchaseInvoice() {
      try {
        setPurchaseError(null)
        const linkedInvoice = await getPurchaseHistoryDetail(invoiceId)

        if (!isMounted) {
          return
        }

        openLinkedPurchaseInvoice(linkedInvoice)
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        handledPurchaseInvoiceLinkRef.current = null
        setPurchaseError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to open the selected purchase invoice.',
        )
      }
    }

    void loadLinkedPurchaseInvoice()

    return () => {
      isMounted = false
    }
  }, [
    isPurchaseLoading,
    linkedInvoiceMode,
    linkedSalesInvoiceIdParam,
    purchaseResult,
  ])

  async function handlePurchasePay(amount: number) {
    if (!purchaseCheckout) {
      return
    }

    const initiation = await initiatePurchaseInvoicePayment(
      purchaseCheckout.salesInvoiceId,
      { amount },
    )
    redirectToKhaltiCheckout(initiation)
  }

  function applyPurchaseLoyaltyResult(current: PurchaseHistory, next: PurchaseInvoiceLoyaltyResult): PurchaseHistory {
    return {
      ...current,
      subtotal: next.subtotal,
      discountPercent: next.discountPercent,
      discountAmount: next.discountAmount,
      taxAmount: next.taxAmount,
      totalAmount: next.totalAmount,
      amountPaid: next.amountPaid,
      balanceDue: next.balanceDue,
      paymentStatus: next.paymentStatus,
    }
  }

  async function handlePurchaseLoyaltyToggle(
    invoice: PurchaseHistory,
    applyLoyalty: boolean,
  ) {
    try {
      setIsUpdatingPurchaseLoyalty(true)
      setPurchaseError(null)

      const updated = await setPurchaseInvoiceLoyalty(invoice.salesInvoiceId, {
        applyLoyalty,
      })

      const nextInvoice = applyPurchaseLoyaltyResult(invoice, updated)

      setPurchaseDetail((current) =>
        current?.salesInvoiceId === updated.salesInvoiceId ? nextInvoice : current,
      )
      setPurchaseCheckout((current) =>
        current?.salesInvoiceId === updated.salesInvoiceId ? nextInvoice : current,
      )
      setPurchaseResult((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          items: current.items.map((item) =>
            item.salesInvoiceId === updated.salesInvoiceId ? nextInvoice : item,
          ),
        }
      })
    } catch (loyaltyError) {
      setPurchaseError(
        loyaltyError instanceof ApiError || loyaltyError instanceof Error
          ? loyaltyError.message
          : 'Unable to update purchase loyalty.',
      )
    } finally {
      setIsUpdatingPurchaseLoyalty(false)
    }
  }

  // Load services
  React.useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        setServiceError(null)
        setIsServiceLoading(true)
        const next = await getServiceHistoryPage({
          pageNumber: servicePagination.page,
          pageSize: servicePagination.pageSize,
          searchText: debouncedServiceSearch.trim() || undefined,
          invoiceStatus: serviceInvoiceStatus || undefined,
          sorts: getSorts(SERVICE_SORT_OPTIONS, serviceSortKey),
        })

        if (isMounted) {
          setServiceResult(next)
        }
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setServiceResult(null)
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

    void load()

    return () => {
      isMounted = false
    }
  }, [
    servicePagination.page,
    servicePagination.pageSize,
    debouncedServiceSearch,
    serviceInvoiceStatus,
    serviceSortKey,
    serviceReloadKey,
  ])

  function refreshServiceHistory() {
    setServiceReloadKey((key) => key + 1)
  }

  function openViewReview(service: ServiceHistory) {
    const review = toReviewFromService(service)
    if (!review) {
      return
    }

    setReviewActionError(null)
    setReviewSuccess(null)
    setReviewFormMode('view')
    setActiveReview(review)
    setPresetService(null)
    setIsReviewFormOpen(true)
  }

  function openWriteReview(service: ServiceHistory) {
    setReviewActionError(null)
    setReviewSuccess(null)
    setReviewFormMode('create')
    setActiveReview(null)
    setPresetService(toPresetService(service))
    setIsReviewFormOpen(true)
  }

  function openEditReview() {
    if (!activeReview) {
      return
    }

    setReviewFormMode('edit')
  }

  async function handleReviewSubmit(data: {
    serviceRecordId: number
    rating: number
    reviewText: string
  }) {
    if (reviewFormMode === 'edit' && activeReview) {
      await updateReview(activeReview.reviewId, {
        rating: data.rating,
        reviewText: data.reviewText,
      })
      setReviewSuccess('Review updated successfully.')
    } else {
      await createReview(data)
      setReviewSuccess('Review submitted successfully.')
    }

    refreshServiceHistory()
  }

  const actionsColumnClass =
    '!w-9 !min-w-9 !max-w-9 !px-1 !text-center whitespace-nowrap'

  const purchaseItems = purchaseResult?.items ?? []
  const serviceItems = serviceResult?.items ?? []

  const purchasesHasFilters = Boolean(purchaseSearch.trim() || purchaseStatus)
  const servicesHasFilters = Boolean(serviceSearch.trim() || serviceInvoiceStatus)

  return (
    <PageSection
      description="Switch between purchase and service records from the same history screen."
      title="History"
    >
      {reviewSuccess ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-green-600)]/15 bg-[var(--vs-green-100)] px-4 py-3 text-sm text-[var(--vs-green-900)]">
          {reviewSuccess}
        </div>
      ) : null}

      <ErrorAlert message={reviewActionError} />

      <Tabs className="gap-5" onValueChange={setActiveTab} value={activeTab}>
        <TabsList variant="line">
          <TabsTrigger value="purchases">Purchase History</TabsTrigger>
          <TabsTrigger value="services">Service History</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          <div className="space-y-4">
            <ErrorAlert message={purchaseError} />

            <ListToolbar
              onSearchTextChange={(value) => {
                purchasePagination.setPage(1)
                setPurchaseSearch(value)
              }}
              onSortKeyChange={(value) => {
                purchasePagination.setPage(1)
                setPurchaseSortKey(value)
              }}
              onFilterChange={(value) => {
                purchasePagination.setPage(1)
                setPurchaseStatus(value)
              }}
              searchAriaLabel="Search purchase history"
              searchPlaceholder="Vehicle number or part name"
              searchText={purchaseSearch}
              sortKey={purchaseSortKey}
              sortOptions={PURCHASE_SORT_OPTIONS}
              filterValue={purchaseStatus}
              filterLabel="Payment status"
              filterOptions={PAYMENT_STATUSES}
            />

            <DataTable
              columns={[
                {
                  key: 'invoiceNo',
                  header: 'Invoice',
                  render: (item) => (
                    <span className="font-bold text-[var(--vs-text)]">{item.invoiceNo}</span>
                  ),
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
                  key: 'itemsCount',
                  header: 'Items',
                  render: (item) => (
                    <span className="text-[var(--vs-muted)]">
                      {item.items.length} {item.items.length === 1 ? 'part' : 'parts'}
                    </span>
                  ),
                },
                {
                  key: 'totalAmount',
                  header: 'Total',
                  render: (item) => (
                    <span className="font-bold text-[var(--vs-text)]">
                      <PurchaseTotalWithLoyaltyDisplay purchase={item} />
                    </span>
                  ),
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
                  className: actionsColumnClass,
                  render: (item) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label={`Actions for invoice ${item.invoiceNo}`}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[var(--vs-muted)] hover:bg-[var(--vs-green-100)] hover:text-[var(--vs-green-800)]"
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
                            window.setTimeout(() => setPurchaseDetail(item), 0)
                          }}
                        >
                          <Eye size={15} />
                          View details
                        </DropdownMenuItem>
                        {canTogglePurchaseLoyalty(item) &&
                        (isPurchaseLoyaltyEligible(item) ||
                          hasPurchaseLoyaltyApplied(item)) ? (
                          <DropdownMenuItem
                            className="gap-2 px-2.5 py-2 text-xs"
                            disabled={isUpdatingPurchaseLoyalty}
                            onSelect={() => {
                              window.setTimeout(
                                () =>
                                  void handlePurchaseLoyaltyToggle(
                                    item,
                                    !hasPurchaseLoyaltyApplied(item),
                                  ),
                                0,
                              )
                            }}
                          >
                            {hasPurchaseLoyaltyApplied(item) ? (
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
                          disabled={!canPayKhaltiInvoice(item.paymentStatus, item.balanceDue)}
                          onSelect={() => {
                            window.setTimeout(() => openPurchaseCheckout(item), 0)
                          }}
                        >
                          <CreditCard size={15} />
                          Pay now
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ),
                },
              ]}
              emptyMessage={
                isPurchaseLoading
                  ? 'Loading purchase history...'
                  : purchasesHasFilters
                    ? 'No purchases match these filters.'
                    : 'No purchases recorded yet.'
              }
              rows={purchaseItems}
            />

            <PaginationFooter
              isLoading={isPurchaseLoading}
              itemCount={purchaseItems.length}
              onNext={() =>
                purchasePagination.setPage((page) =>
                  Math.min(purchaseResult?.totalPages ?? 1, page + 1),
                )
              }
              onPrevious={() =>
                purchasePagination.setPage((page) => Math.max(1, page - 1))
              }
              pageNumber={purchasePagination.page}
              pageSize={purchasePagination.pageSize}
              totalPages={purchaseResult?.totalPages ?? 0}
              totalRecords={purchaseResult?.totalRecords ?? 0}
            />
          </div>
        </TabsContent>

        <TabsContent value="services">
          <div className="space-y-4">
            <ErrorAlert message={serviceError} />

            <ListToolbar
              onSearchTextChange={(value) => {
                servicePagination.setPage(1)
                setServiceSearch(value)
              }}
              onSortKeyChange={(value) => {
                servicePagination.setPage(1)
                setServiceSortKey(value)
              }}
              onFilterChange={(value) => {
                servicePagination.setPage(1)
                setServiceInvoiceStatus(value)
              }}
              searchAriaLabel="Search service history"
              searchPlaceholder="Vehicle number or diagnosis"
              searchText={serviceSearch}
              sortKey={serviceSortKey}
              sortOptions={SERVICE_SORT_OPTIONS}
              filterValue={serviceInvoiceStatus}
              filterLabel="Invoice status"
              filterOptions={INVOICE_STATUS_OPTIONS}
            />

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
                  key: 'serviceStatus',
                  header: 'Status',
                  render: (item) => (
                    <span className={serviceStatusBadgeClass(item.serviceStatus)}>
                      {item.serviceStatus}
                    </span>
                  ),
                },
                {
                  key: 'diagnosis',
                  header: 'Diagnosis',
                  className: 'max-w-[220px]',
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
                  render: (item) => (
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[var(--vs-text)]">
                        {item.staffMemberName || 'Unassigned'}
                      </div>
                      {item.staffJobTitle ? (
                        <div className="text-[11px] text-[var(--vs-muted)]">
                          {item.staffJobTitle}
                        </div>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: 'totalCharge',
                  header: 'Charge',
                  render: (item) => formatCurrency(item.totalCharge),
                },
                {
                  key: 'invoiceStatus',
                  header: 'Invoice',
                  render: (item) => {
                    const badge = invoiceCellBadge(item)
                    return <span className={badge.className}>{badge.label}</span>
                  },
                },
                {
                  key: 'review',
                  header: 'Review',
                  render: (item) =>
                    item.review ? (
                      <span className="badge bg">{item.review.rating}/5</span>
                    ) : canWriteReview(item) ? (
                      <span className="badge ba">Pending</span>
                    ) : (
                      <span className="badge ba">—</span>
                    ),
                },
                {
                  key: 'actions',
                  header: '',
                  className: actionsColumnClass,
                  render: (item) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label={`Actions for service on ${item.vehicleNumber}`}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[var(--vs-muted)] hover:bg-[var(--vs-green-100)] hover:text-[var(--vs-green-800)]"
                          type="button"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="!w-[190px] !min-w-[190px]">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                          View details
                        </DropdownMenuItem>
                        {item.review ? (
                          <DropdownMenuItem
                            className="gap-2 px-2.5 py-2 text-xs"
                            onSelect={() => {
                              window.setTimeout(() => openViewReview(item), 0)
                            }}
                          >
                            <Eye size={15} />
                            View review
                          </DropdownMenuItem>
                        ) : null}
                        {canWriteReview(item) ? (
                          <DropdownMenuItem
                            className="gap-2 px-2.5 py-2 text-xs"
                            onSelect={() => {
                              window.setTimeout(() => openWriteReview(item), 0)
                            }}
                          >
                            <MessageSquarePlus size={15} />
                            Write review
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ),
                },
              ]}
              emptyMessage={
                isServiceLoading
                  ? 'Loading service history...'
                  : servicesHasFilters
                    ? 'No service records match these filters.'
                    : 'No service records recorded yet.'
              }
              rows={serviceItems}
            />

            <PaginationFooter
              isLoading={isServiceLoading}
              itemCount={serviceItems.length}
              onNext={() =>
                servicePagination.setPage((page) =>
                  Math.min(serviceResult?.totalPages ?? 1, page + 1),
                )
              }
              onPrevious={() =>
                servicePagination.setPage((page) => Math.max(1, page - 1))
              }
              pageNumber={servicePagination.page}
              pageSize={servicePagination.pageSize}
              totalPages={serviceResult?.totalPages ?? 0}
              totalRecords={serviceResult?.totalRecords ?? 0}
            />
          </div>
        </TabsContent>

      </Tabs>

      <Dialog
        onOpenChange={(open) => !open && closePurchaseDetailPanel()}
        open={purchaseDetail !== null}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Purchase details</DialogTitle>
            <DialogDescription>Invoice {purchaseDetail?.invoiceNo ?? ''}</DialogDescription>
          </DialogHeader>
          {purchaseDetail ? (
            <div className="space-y-4 text-sm">
              <DetailGrid>
                <DetailItem label="Date" value={formatDateOnly(purchaseDetail.invoiceDate)} />
                <DetailItem label="Vehicle" value={purchaseDetail.vehicleNumber} />
                <DetailItem label="Subtotal" value={formatCurrency(purchaseDetail.subtotal)} />
                <DetailItem
                  label={
                    hasPurchaseLoyaltyApplied(purchaseDetail)
                      ? `Loyalty discount (${LOYALTY_DISCOUNT_PERCENT}%)`
                      : `Discount (${purchaseDetail.discountPercent}%)`
                  }
                  value={`-${formatCurrency(
                    hasPurchaseLoyaltyApplied(purchaseDetail)
                      ? getPurchaseLoyaltyDiscountAmount(purchaseDetail)
                      : purchaseDetail.discountAmount,
                  )}`}
                />
                {getPurchaseLineDiscountAmount(purchaseDetail) > 0 ? (
                  <DetailItem
                    label="Line discounts"
                    value={`-${formatCurrency(getPurchaseLineDiscountAmount(purchaseDetail))}`}
                  />
                ) : null}
                <DetailItem label="Tax" value={formatCurrency(purchaseDetail.taxAmount)} />
                <DetailItem
                  label="Total"
                  value={<PurchaseTotalWithLoyaltyDisplay purchase={purchaseDetail} />}
                />
                <DetailItem label="Paid" value={formatCurrency(purchaseDetail.amountPaid)} />
                <DetailItem label="Balance" value={formatCurrency(purchaseDetail.balanceDue)} />
                <DetailItem label="Payment status" value={purchaseDetail.paymentStatus} />
                <DetailItem
                  label="Loyalty"
                  value={
                    hasPurchaseLoyaltyApplied(purchaseDetail)
                      ? `Applied (${LOYALTY_DISCOUNT_PERCENT}%)`
                      : isPurchaseLoyaltyEligible(purchaseDetail)
                        ? `Eligible (${LOYALTY_DISCOUNT_PERCENT}%)`
                        : `Not eligible (subtotal > ${formatCurrency(LOYALTY_THRESHOLD)})`
                  }
                />
              </DetailGrid>
              <div>
                <div className="mb-2 text-xs font-bold uppercase text-[var(--vs-muted)]">Items</div>
                <ul className="space-y-2">
                  {purchaseDetail.items.map((part, index) => (
                    <li
                      className="rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] px-3 py-2"
                      key={`${part.partName}-${index}`}
                    >
                      <div className="font-semibold text-[var(--vs-text)]">
                        {part.partName} ({part.brand}) × {part.quantity}
                      </div>
                      <div className="mt-1 text-xs text-[var(--vs-muted)]">
                        {formatCurrency(part.unitPrice)} each
                        {part.discountAmount > 0
                          ? ` · discount ${formatCurrency(part.discountAmount)}`
                          : ''}{' '}
                        · line {formatCurrency(part.lineTotal)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {canPayKhaltiInvoice(purchaseDetail.paymentStatus, purchaseDetail.balanceDue) ||
              (canTogglePurchaseLoyalty(purchaseDetail) &&
                (isPurchaseLoyaltyEligible(purchaseDetail) ||
                  hasPurchaseLoyaltyApplied(purchaseDetail))) ? (
                <DialogFooter className="flex flex-wrap justify-end gap-2">
                  {canTogglePurchaseLoyalty(purchaseDetail) &&
                  (isPurchaseLoyaltyEligible(purchaseDetail) ||
                    hasPurchaseLoyaltyApplied(purchaseDetail)) ? (
                    <button
                      className="tb-btn inline-flex items-center gap-2"
                      disabled={isUpdatingPurchaseLoyalty}
                      onClick={() =>
                        void handlePurchaseLoyaltyToggle(
                          purchaseDetail,
                          !hasPurchaseLoyaltyApplied(purchaseDetail),
                        )
                      }
                      type="button"
                    >
                      {isUpdatingPurchaseLoyalty ? (
                        'Updating...'
                      ) : hasPurchaseLoyaltyApplied(purchaseDetail) ? (
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
                  {canPayKhaltiInvoice(purchaseDetail.paymentStatus, purchaseDetail.balanceDue) ? (
                  <button
                    className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--vs-green-600)] bg-[var(--vs-green-600)] px-4 text-xs font-bold text-white hover:border-[var(--vs-green-800)] hover:bg-[var(--vs-green-800)]"
                    onClick={() => {
                      setPurchaseDetail(null)
                      openPurchaseCheckout(purchaseDetail)
                    }}
                    type="button"
                  >
                    <CreditCard size={14} />
                    Pay now with Khalti
                  </button>
                  ) : null}
                </DialogFooter>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {purchaseCheckout ? (
        <KhaltiCheckoutDialog
          description={`${purchaseCheckout.vehicleNumber} • ${formatDateOnly(purchaseCheckout.invoiceDate)}`}
          onOpenChange={(open) => {
            if (!open) {
              closePurchaseCheckoutPanel()
            }
          }}
          onPay={handlePurchasePay}
          open={purchaseCheckout !== null}
          summary={{
            title: 'Purchase invoice',
            subtitle: purchaseCheckout.invoiceNo,
            contextLabel: 'Vehicle',
            contextValue: purchaseCheckout.vehicleNumber,
            totalAmount: purchaseCheckout.totalAmount,
            amountPaid: purchaseCheckout.amountPaid,
            balanceDue: purchaseCheckout.balanceDue,
            paymentStatus: purchaseCheckout.paymentStatus,
          }}
          title="Pay with Khalti"
        />
      ) : null}

      <ReviewFormDialog
        mode={reviewFormMode}
        onOpenChange={(open) => {
          setIsReviewFormOpen(open)
          if (!open) {
            setActiveReview(null)
            setPresetService(null)
          }
        }}
        onSubmit={reviewFormMode === 'view' ? undefined : handleReviewSubmit}
        onSwitchToEdit={reviewFormMode === 'view' ? openEditReview : undefined}
        open={isReviewFormOpen}
        presetService={presetService}
        review={activeReview}
        unreviewedServices={[]}
      />
    </PageSection>
  )
}

function DetailGrid({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>{children}</div>
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] px-3 py-2">
      <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">{label}</div>
      <div className="mt-1 text-[13px] font-semibold text-[var(--vs-text)]">{value}</div>
    </div>
  )
}
