import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, ReceiptText, Trash2, Eye, Mail, Search, FileText, X, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageSection } from '@/components/shared/page-section'
import {
  SearchableCombobox,
  type SearchableComboboxOption,
} from '@/components/shared/searchable-combobox'
import {
  createSalesInvoice,
  getSalesInvoiceLookups,
  getStaffCustomerVehicles,
  sendInvoiceEmail,
  getSalesInvoices,
  deleteSalesInvoice,
} from '@/features/sales-invoices/api/sales-invoices-api'
import type {
  SalesInvoice,
  SalesInvoiceLookup,
} from '@/features/sales-invoices/types/sales-invoices'
import { DEFAULT_VEHICLE_LIST_SORTS } from '@/features/vehicles/api/vehicles-api'
import type { CustomerVehicle } from '@/features/vehicles/types/vehicles'
import { mergeSelectedVehicleForCombobox } from '@/features/vehicles/utils/vehicle-combobox-options'
import { formatDateOnly } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError } from '@/types/api'

interface InvoiceLineDraft {
  partId: string
  quantity: string
  discountAmount: string
}

interface InvoiceFormState {
  customerId: string
  vehicleId: string
  invoiceDate: string
  discountPercent: string
  taxAmount: string
  amountPaid: string
  creditDueDate: string
  paymentType: string
  items: InvoiceLineDraft[]
}

const initialForm: InvoiceFormState = {
  customerId: '',
  vehicleId: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  discountPercent: '0',
  taxAmount: '0',
  amountPaid: '0',
  creditDueDate: '',
  paymentType: '1',
  items: [
    {
      partId: '',
      quantity: '1',
      discountAmount: '0',
    },
  ],
}



export function SalesInvoicesPage() {
  const [form, setForm] = React.useState<InvoiceFormState>(initialForm)
  const [lookups, setLookups] = React.useState<SalesInvoiceLookup | null>(null)
  const [lookupError, setLookupError] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isLookupLoading, setIsLookupLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [createdInvoice, setCreatedInvoice] = React.useState<SalesInvoice | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  // Listing states
  const [activeTab, setActiveTab] = React.useState<'list' | 'create'>(
    tabParam === 'create' ? 'create' : 'list'
  )

  React.useEffect(() => {
    if (tabParam === 'create') {
      setActiveTab('create')
    } else if (tabParam === 'list') {
      setActiveTab('list')
    }
  }, [tabParam])

  const [invoices, setInvoices] = React.useState<SalesInvoice[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = React.useState(true)
  const [invoicesError, setInvoicesError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedInvoice, setSelectedInvoice] = React.useState<SalesInvoice | null>(null)

  // Server-side pagination states
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalRecords, setTotalRecords] = React.useState(0)
  const pageSize = 10

  const loadInvoices = React.useCallback(async (q: string, targetPage: number) => {
    try {
      setIsLoadingInvoices(true)
      setInvoicesError(null)
      const res = await getSalesInvoices(q, targetPage, pageSize)
      setInvoices(res.items)
      setTotalPages(res.totalPages)
      setTotalRecords(res.totalRecords)
    } catch (err) {
      setInvoicesError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Unable to load sales invoices.',
      )
    } finally {
      setIsLoadingInvoices(false)
    }
  }, [])

  React.useEffect(() => {
    if (activeTab === 'list') {
      const timeoutId = setTimeout(() => {
        void loadInvoices(searchQuery, page)
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [activeTab, searchQuery, page, loadInvoices])

  React.useEffect(() => {
    setPage(1)
  }, [searchQuery])

  async function handleDeleteInvoice(invoiceId: number) {
    if (!window.confirm('Are you sure you want to permanently delete this sales invoice? This will restore part stock levels.')) {
      return
    }

    try {
      await deleteSalesInvoice(invoiceId)
      setInvoices((prev) => prev.filter((inv) => inv.salesInvoiceId !== invoiceId))
      if (selectedInvoice?.salesInvoiceId === invoiceId) {
        setSelectedInvoice(null)
      }
    } catch (err) {
      alert(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to delete invoice.')
    }
  }

  const filteredInvoices = invoices
  const paginatedInvoices = invoices

  const [staffVehicles, setStaffVehicles] = React.useState<CustomerVehicle[]>([])
  const [vehicleComboSearch, setVehicleComboSearch] = React.useState('')
  const [debouncedVehicleSearch, setDebouncedVehicleSearch] = React.useState('')
  const [isStaffVehiclesLoading, setIsStaffVehiclesLoading] = React.useState(false)
  const [selectedStaffVehicle, setSelectedStaffVehicle] =
    React.useState<CustomerVehicle | null>(null)

  const [emailStatus, setEmailStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [emailError, setEmailError] = React.useState<string | null>(null)

  async function handleSendEmail(invoiceId: number) {
    try {
      setEmailStatus('sending')
      setEmailError(null)
      await sendInvoiceEmail(invoiceId)
      setEmailStatus('success')
    } catch (error) {
      setEmailStatus('error')
      setEmailError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Unable to send email notification.',
      )
    }
  }

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedVehicleSearch(vehicleComboSearch), 300)
    return () => clearTimeout(timer)
  }, [vehicleComboSearch])

  React.useEffect(() => {
    if (!form.customerId) {
      setStaffVehicles([])
      return
    }

    let isCancelled = false

    async function loadStaffVehicles() {
      try {
        setIsStaffVehiclesLoading(true)
        const list = await getStaffCustomerVehicles(Number(form.customerId), {
          searchText: debouncedVehicleSearch.trim() || undefined,
          sorts: DEFAULT_VEHICLE_LIST_SORTS,
        })
        if (!isCancelled) {
          setStaffVehicles(list)
        }
      } catch {
        if (!isCancelled) {
          setStaffVehicles([])
        }
      } finally {
        if (!isCancelled) {
          setIsStaffVehiclesLoading(false)
        }
      }
    }

    void loadStaffVehicles()

    return () => {
      isCancelled = true
    }
  }, [form.customerId, debouncedVehicleSearch])

  React.useEffect(() => {
    const id = Number(form.vehicleId)
    if (!id) {
      setSelectedStaffVehicle(null)
      return
    }

    const found = staffVehicles.find((v) => v.vehicleId === id)
    if (found) {
      setSelectedStaffVehicle(found)
    }
  }, [staffVehicles, form.vehicleId])

  React.useEffect(() => {
    async function loadLookups() {
      try {
        setLookupError(null)
        setIsLookupLoading(true)
        const response = await getSalesInvoiceLookups()
        setLookups(response)
      } catch (error) {
        setLookupError(
          error instanceof ApiError || error instanceof Error
            ? error.message
            : 'Unable to load invoice lookups.',
        )
      } finally {
        setIsLookupLoading(false)
      }
    }

    void loadLookups()
  }, [])

  const selectedCustomer = React.useMemo(
    () =>
      lookups?.customers.find(
        (customer) => String(customer.customerId) === form.customerId,
      ) ?? null,
    [form.customerId, lookups],
  )

  const mergedStaffVehicles = React.useMemo(
    () => mergeSelectedVehicleForCombobox(staffVehicles, selectedStaffVehicle),
    [staffVehicles, selectedStaffVehicle],
  )

  const selectedVehicle = React.useMemo(() => {
    if (!form.vehicleId) {
      return null
    }

    const id = Number(form.vehicleId)
    return mergedStaffVehicles.find((v) => v.vehicleId === id) ?? null
  }, [form.vehicleId, mergedStaffVehicles])

  const partLookupMap = React.useMemo(() => {
    return new Map(
      (lookups?.parts ?? []).map((part) => [String(part.partId), part]),
    )
  }, [lookups])

  const customerOptions = React.useMemo<SearchableComboboxOption[]>(
    () =>
      (lookups?.customers ?? []).map((customer) => ({
        value: String(customer.customerId),
        label: customer.fullName,
        searchText: `${customer.fullName} ${customer.email} ${customer.phoneNumber ?? ''}`,
        secondaryText: `${customer.email}${customer.phoneNumber ? ` | ${customer.phoneNumber}` : ''}`,
      })),
    [lookups],
  )

  const vehicleOptions = React.useMemo<SearchableComboboxOption[]>(
    () =>
      mergedStaffVehicles.map((vehicle) => ({
        value: String(vehicle.vehicleId),
        label: vehicle.vehicleNumber,
        searchText: `${vehicle.vehicleNumber} ${vehicle.make} ${vehicle.model}`,
        secondaryText: `${vehicle.make} ${vehicle.model}`,
      })),
    [mergedStaffVehicles],
  )

  function getPartOptions(excludeLineIndex: number): SearchableComboboxOption[] {
    const chosenPartIds = new Set(
      form.items
        .filter((_, index) => index !== excludeLineIndex)
        .map((item) => item.partId)
        .filter(Boolean),
    )

    return (lookups?.parts ?? [])
      .filter((part) => !chosenPartIds.has(String(part.partId)))
      .map((part) => ({
        value: String(part.partId),
        label: part.partName,
        searchText: `${part.partName} ${part.brand} ${part.partId}`,
        secondaryText: `${part.brand} | ${formatCurrency(part.unitPrice)} | Stock ${part.stockQty}`,
      }))
  }

  function updateForm<K extends keyof InvoiceFormState>(field: K, value: InvoiceFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateCustomer(value: string) {
    setVehicleComboSearch('')
    setDebouncedVehicleSearch('')
    setSelectedStaffVehicle(null)
    setStaffVehicles([])
    setForm((current) => ({
      ...current,
      customerId: value,
      vehicleId: '',
    }))
  }

  function updateVehicleChoice(value: string) {
    updateForm('vehicleId', value)
    const id = Number(value)
    if (!id) {
      setSelectedStaffVehicle(null)
      return
    }

    const merged = mergeSelectedVehicleForCombobox(staffVehicles, selectedStaffVehicle)
    const found = merged.find((v) => v.vehicleId === id)
    setSelectedStaffVehicle(found ?? null)
  }

  function updateItem(index: number, field: keyof InvoiceLineDraft, value: string) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }))
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          partId: '',
          quantity: '1',
          discountAmount: '0',
        },
      ],
    }))
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function getLinePart(item: InvoiceLineDraft) {
    return partLookupMap.get(item.partId) ?? null
  }

  const linePreview = form.items.map((item) => {
    const part = getLinePart(item)
    const quantity = Number(item.quantity || 0)
    const discountAmount = Number(item.discountAmount || 0)
    const unitPrice = part?.unitPrice ?? 0
    const gross = unitPrice * quantity
    const lineTotal = Math.max(0, gross - discountAmount)

    return {
      discountAmount,
      gross,
      item,
      lineTotal,
      part,
      quantity,
      unitPrice,
    }
  })

  const subtotal = linePreview.reduce((sum, line) => sum + line.gross, 0)
  const lineDiscounts = linePreview.reduce((sum, line) => sum + line.discountAmount, 0)
  const invoiceDiscount = subtotal * (Number(form.discountPercent || 0) / 100)
  const taxAmount = Number(form.taxAmount || 0)
  const totalAmount = subtotal - lineDiscounts - invoiceDiscount + taxAmount

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.customerId) {
      setSubmitError('Choose a customer before creating the invoice.')
      return
    }

    if (!form.vehicleId) {
      setSubmitError('Choose a vehicle for the selected customer.')
      return
    }

    if (form.items.some((item) => !item.partId)) {
      setSubmitError('Choose a part for every invoice line.')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const response = await createSalesInvoice({
        customerId: Number(form.customerId),
        vehicleId: Number(form.vehicleId),
        invoiceDate: form.invoiceDate,
        discountPercent: Number(form.discountPercent || 0),
        taxAmount: Number(form.taxAmount || 0),
        amountPaid: Number(form.amountPaid || 0),
        creditDueDate: form.creditDueDate || undefined,
        paymentType: Number(form.paymentType),
        items: form.items.map((item) => ({
          partId: Number(item.partId),
          quantity: Number(item.quantity),
          discountAmount: Number(item.discountAmount || 0),
        })),
      })

      setCreatedInvoice(response)
      setForm(initialForm)
    } catch (error) {
      setSubmitError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Unable to create the sales invoice.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageSection
      description="Create, review, and delete sales invoices with real-time inventory synchronization."
      title="Sales Invoices"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-6 mb-6">
          <button
            onClick={() => {
              setActiveTab('list')
              setSearchParams({})
            }}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'list'
                ? 'text-[var(--vs-green-800)] border-b-2 border-[var(--vs-green-800)]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Invoice History
          </button>
          <button
            onClick={() => {
              setActiveTab('create')
              setSearchParams({ tab: 'create' })
            }}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'create'
                ? 'text-[var(--vs-green-800)] border-b-2 border-[var(--vs-green-800)]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Create New Invoice
          </button>
        </div>

        {activeTab === 'list' ? (
          <div className="space-y-6">
            {/* Search Filter Card */}
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search invoices by invoice number, customer name, or vehicle plate..."
                    className="pl-10 h-11 border-gray-200 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {invoicesError ? (
              <Alert variant="destructive">
                <AlertTitle>Error loading invoices</AlertTitle>
                <AlertDescription>{invoicesError}</AlertDescription>
              </Alert>
            ) : null}

            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {isLoadingInvoices ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="size-8 text-[var(--vs-green-800)] animate-spin" />
                    <span className="text-sm text-gray-500">Fetching invoice registry...</span>
                  </div>
                ) : filteredInvoices.length > 0 ? (
                  <>
                    <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="font-semibold text-xs text-gray-700">Invoice No</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Customer</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Vehicle</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Date</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Total Amount</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvoices.map((inv) => (
                        <TableRow key={inv.salesInvoiceId} className="hover:bg-gray-50/20 transition-colors">
                          <TableCell className="font-mono text-xs font-semibold text-gray-700">
                            {inv.invoiceNo}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800 text-xs">{inv.customerName || 'Unknown Customer'}</span>
                              <span className="text-gray-500 text-[10px]">{inv.customerId}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-[11px] font-semibold bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                              {inv.vehicleNumber || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600 text-xs">
                            {formatDateOnly(inv.invoiceDate)}
                          </TableCell>
                          <TableCell className="font-bold text-gray-900 text-xs">
                            {formatCurrency(inv.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`font-semibold hover:bg-opacity-105 ${
                                inv.paymentStatus === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-105'
                                  : inv.paymentStatus === 'Partial'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-105'
                                    : 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-105'
                              }`}
                            >
                              {inv.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                title="View details"
                                onClick={() => setSelectedInvoice(inv)}
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                                title="Resend email invoice"
                                onClick={() => void handleSendEmail(inv.salesInvoiceId)}
                                disabled={emailStatus === 'sending'}
                              >
                                <Mail className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                                title="Delete invoice"
                                onClick={() => void handleDeleteInvoice(inv.salesInvoiceId)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredInvoices.length > 0 && (
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/20">
                      <p className="text-xs font-semibold text-gray-500">
                        Showing {totalRecords === 0 ? 0 : (page - 1) * 10 + 1} to {Math.min(totalRecords, page * 10)} of {totalRecords} invoices
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          size="sm" variant="outline" className="h-8 px-3"
                        >
                          Previous
                        </Button>
                        
                        {Array.from({ length: totalPages || 1 }).map((_, index) => {
                          const p = index + 1
                          return (
                            <Button
                              type="button"
                              key={p}
                              onClick={() => setPage(p)}
                              variant={page === p ? 'default' : 'outline'}
                              size="sm"
                              className={`h-8 w-8 p-0 font-semibold ${
                                page === p 
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white border-emerald-600 shadow-sm' 
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-gray-200'
                              }`}
                            >
                              {p}
                            </Button>
                          )
                        })}

                        <Button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() => setPage(p => p + 1)}
                          size="sm" variant="outline" className="h-8 px-3"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <FileText className="size-8 text-gray-300" />
                    <span className="text-sm text-gray-500">No invoices registered.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email send status for the list page actions */}
            {emailStatus === 'success' && (
              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-950 rounded-xl">
                <AlertTitle className="font-semibold">Email Dispatch Successful</AlertTitle>
                <AlertDescription>The HTML invoice has been successfully sent via SMTP.</AlertDescription>
              </Alert>
            )}
            {emailStatus === 'error' && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-950 rounded-xl">
                <AlertTitle className="font-semibold">Email Delivery Failed</AlertTitle>
                <AlertDescription>{emailError}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardDescription>Customers available</CardDescription>
                  <CardTitle>{lookups?.customers.length ?? 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Parts available</CardDescription>
                  <CardTitle>{lookups?.parts.length ?? 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Estimated total</CardDescription>
                  <CardTitle>{formatCurrency(totalAmount)}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {lookupError ? (
              <Alert variant="destructive">
                <AlertTitle>Lookup loading failed</AlertTitle>
                <AlertDescription>{lookupError}</AlertDescription>
              </Alert>
            ) : null}

            {submitError ? (
              <Alert variant="destructive">
                <AlertTitle>Invoice creation failed</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Create a sales invoice</CardTitle>
              <CardDescription>
                Select a customer first, then choose from that customer&apos;s registered vehicles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="invoice-customer">Customer</Label>
                    <SearchableCombobox
                      emptyText="No customers found."
                      onChange={updateCustomer}
                      options={customerOptions}
                      placeholder={isLookupLoading ? 'Loading customers...' : 'Select customer'}
                      searchPlaceholder="Search customers..."
                      value={form.customerId}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="invoice-vehicle">Vehicle</Label>
                    <SearchableCombobox
                      disabled={!selectedCustomer || isLookupLoading}
                      emptyText={
                        selectedCustomer
                          ? 'No vehicles found for this customer.'
                          : 'Choose a customer first.'
                      }
                      onChange={updateVehicleChoice}
                      onSearchChange={setVehicleComboSearch}
                      options={vehicleOptions}
                      placeholder={
                        selectedCustomer
                          ? 'Select vehicle'
                          : 'Choose a customer first'
                      }
                      searchLoading={isStaffVehiclesLoading}
                      searchPlaceholder="Search vehicles..."
                      serverSearch
                      value={form.vehicleId}
                    />
                  </div>
                </div>

                {selectedCustomer ? (
                  <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    <div className="font-medium text-foreground">{selectedCustomer.fullName}</div>
                    <div>{selectedCustomer.email}</div>
                    {selectedCustomer.phoneNumber ? <div>{selectedCustomer.phoneNumber}</div> : null}
                    {selectedVehicle ? (
                      <div className="mt-2">
                        Vehicle: {selectedVehicle.vehicleNumber} ({selectedVehicle.make} {selectedVehicle.model})
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="grid gap-2">
                    <Label htmlFor="invoice-date">Invoice date</Label>
                    <Input
                      id="invoice-date"
                      onChange={(event) => updateForm('invoiceDate', event.target.value)}
                      type="date"
                      value={form.invoiceDate}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="discount-percent">Discount percent</Label>
                    <Input
                      id="discount-percent"
                      min="0"
                      onChange={(event) => updateForm('discountPercent', event.target.value)}
                      step="0.01"
                      type="number"
                      value={form.discountPercent}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tax-amount">Tax amount</Label>
                    <Input
                      id="tax-amount"
                      min="0"
                      onChange={(event) => updateForm('taxAmount', event.target.value)}
                      step="0.01"
                      type="number"
                      value={form.taxAmount}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount-paid">Amount paid</Label>
                    <Input
                      id="amount-paid"
                      min="0"
                      onChange={(event) => updateForm('amountPaid', event.target.value)}
                      step="0.01"
                      type="number"
                      value={form.amountPaid}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="credit-due-date">Credit due date</Label>
                    <Input
                      id="credit-due-date"
                      onChange={(event) => updateForm('creditDueDate', event.target.value)}
                      type="date"
                      value={form.creditDueDate}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payment-type">Payment type</Label>
                    <Select
                      onValueChange={(value) => updateForm('paymentType', value)}
                      value={form.paymentType}
                    >
                      <SelectTrigger id="payment-type">
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Khalti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium">Invoice items</h3>
                      <p className="text-sm text-muted-foreground">
                        Search parts by name, brand, or part ID.
                      </p>
                    </div>
                    <Button onClick={addItem} size="sm" type="button" variant="outline">
                      <Plus className="size-4" />
                      Add item
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {form.items.map((item, index) => {
                      const selectedPart = getLinePart(item)
                      const partOptions = getPartOptions(index)

                      return (
                        <div className="rounded-lg border p-4" key={`${index}-${item.partId}`}>
                          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_120px_140px_auto]">
                            <div className="grid gap-2">
                              <Label>Part</Label>
                              <SearchableCombobox
                                emptyText="No matching parts found."
                                onChange={(value) => updateItem(index, 'partId', value)}
                                options={partOptions}
                                placeholder={isLookupLoading ? 'Loading parts...' : 'Select part'}
                                searchPlaceholder="Search parts..."
                                value={item.partId}
                              />
                              {selectedPart ? (
                                <p className="text-xs text-muted-foreground">
                                  {selectedPart.brand} | {formatCurrency(selectedPart.unitPrice)} | Stock {selectedPart.stockQty}
                                </p>
                              ) : null}
                            </div>
                            <div className="grid gap-2">
                              <Label>Quantity</Label>
                              <Input
                                min="1"
                                onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                                type="number"
                                value={item.quantity}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Line discount</Label>
                              <Input
                                min="0"
                                onChange={(event) => updateItem(index, 'discountAmount', event.target.value)}
                                step="0.01"
                                type="number"
                                value={item.discountAmount}
                              />
                            </div>
                            <div className="flex items-end justify-end">
                              <Button
                                disabled={form.items.length === 1}
                                onClick={() => removeItem(index)}
                                size="icon"
                                type="button"
                                variant="ghost"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button disabled={isSubmitting || isLookupLoading} type="submit">
                    {isSubmitting ? 'Creating invoice...' : 'Create invoice'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice preview</CardTitle>
                <CardDescription>Totals update as you choose parts and quantities.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {selectedCustomer ? selectedCustomer.fullName : 'No customer selected'}
                  </Badge>
                  <Badge variant="outline">
                    {selectedVehicle
                      ? selectedVehicle.vehicleNumber
                      : 'No vehicle selected'}
                  </Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit price</TableHead>
                      <TableHead>Line total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linePreview.length ? (
                      linePreview.map((line, index) => (
                        <TableRow key={`preview-${index}`}>
                          <TableCell>
                            {line.part ? (
                              <div className="flex flex-col">
                                <span className="font-medium">{line.part.partName}</span>
                                <span className="text-xs text-muted-foreground">{line.part.brand}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Choose a part</span>
                            )}
                          </TableCell>
                          <TableCell>{line.quantity}</TableCell>
                          <TableCell>{formatCurrency(line.unitPrice)}</TableCell>
                          <TableCell>{formatCurrency(line.lineTotal)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="text-muted-foreground" colSpan={4}>
                          Add at least one invoice line.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Line discounts</span>
                    <span>- {formatCurrency(lineDiscounts)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Invoice discount</span>
                    <span>- {formatCurrency(invoiceDiscount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {createdInvoice ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ReceiptText className="size-5" />
                    Invoice created
                  </CardTitle>
                  <CardDescription>
                    Invoice {createdInvoice.invoiceNo} was created successfully.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Invoice date</p>
                      <p className="font-medium">{formatDateOnly(createdInvoice.invoiceDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment status</p>
                      <p className="font-medium">{createdInvoice.paymentStatus}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total amount</p>
                      <p className="font-medium">{formatCurrency(createdInvoice.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Balance due</p>
                      <p className="font-medium">{formatCurrency(createdInvoice.balanceDue)}</p>
                    </div>
                  </div>

                  {emailStatus === 'success' && (
                    <Alert className="bg-emerald-50 border-emerald-200 text-emerald-950 mt-4 rounded-xl">
                      <AlertTitle className="font-semibold">Email Dispatch Successful</AlertTitle>
                      <AlertDescription>The HTML invoice has been successfully sent to the customer's registered email address via SMTP.</AlertDescription>
                    </Alert>
                  )}

                  {emailStatus === 'error' && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-950 mt-4 rounded-xl">
                      <AlertTitle className="font-semibold">Email Delivery Failed</AlertTitle>
                      <AlertDescription>{emailError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={() => void handleSendEmail(createdInvoice.salesInvoiceId)}
                    disabled={emailStatus === 'sending'}
                    className="w-full mt-4 bg-[var(--vs-green-800)] hover:bg-[var(--vs-green-900)] text-white rounded-xl py-2.5 font-semibold transition"
                  >
                    {emailStatus === 'sending' ? 'Sending invoice email...' : 'Send Invoice via Email (SMTP)'}
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    )}

    {/* Sales Invoice Details Modal */}
    {selectedInvoice ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-gray-100">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b px-6 py-4.5 bg-gray-50/50">
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Invoice Details - {selectedInvoice.invoiceNo}
              </h3>
              <p className="text-xs text-gray-500">
                Created on {formatDateOnly(selectedInvoice.invoiceDate)}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full size-9 hover:bg-gray-200"
              onClick={() => setSelectedInvoice(null)}
            >
              <X className="size-5 text-gray-500" />
            </Button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Billing details grid */}
            <div className="grid gap-6 md:grid-cols-2 bg-gray-50/30 border border-gray-100 rounded-2xl p-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer Details</span>
                <p className="font-bold text-sm text-gray-800">{selectedInvoice.customerName || 'N/A'}</p>
                <p className="text-xs text-gray-500">ID: {selectedInvoice.customerId}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Vehicle Information</span>
                <p className="font-bold text-sm text-gray-800">License Plate: {selectedInvoice.vehicleNumber || 'N/A'}</p>
                <p className="text-xs text-gray-500">Vehicle ID: {selectedInvoice.vehicleId}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-xs text-gray-700">Part Name</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-700">Brand</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-700 text-right">Qty</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-700 text-right">Unit Price</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-700 text-right">Discount</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-700 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-gray-800 text-xs">{item.partName}</TableCell>
                        <TableCell className="text-gray-600 text-xs">{item.brand}</TableCell>
                        <TableCell className="text-right text-xs">{item.quantity}</TableCell>
                        <TableCell className="text-right text-xs font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right text-xs font-mono text-red-600">- {formatCurrency(item.discountAmount)}</TableCell>
                        <TableCell className="text-right text-xs font-mono font-bold text-gray-900">{formatCurrency(item.lineTotal)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                        No items found in this invoice.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 rounded-2xl border bg-gray-50/30 p-4.5 border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Invoice Discount ({selectedInvoice.discountPercent}%)</span>
                  <span className="font-mono">- {formatCurrency(selectedInvoice.discountAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Tax Amount</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 text-sm font-bold text-gray-800">
                  <span>Total Amount</span>
                  <span className="font-mono text-[15px] text-[var(--vs-green-800)]">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Amount Paid</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.amountPaid)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-rose-600">
                  <span>Balance Due</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t px-6 py-4.5 bg-gray-50/50">
            <Button
              onClick={() => void handleSendEmail(selectedInvoice.salesInvoiceId)}
              disabled={emailStatus === 'sending'}
              className="bg-[var(--vs-green-800)] hover:bg-[var(--vs-green-900)] text-white rounded-xl px-4 py-2 text-xs font-semibold"
            >
              {emailStatus === 'sending' ? 'Sending invoice...' : 'Send Invoice Email'}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl px-4 py-2 text-xs font-semibold border-gray-200"
              onClick={() => setSelectedInvoice(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    ) : null}
  </div>
</PageSection>
  )
}
