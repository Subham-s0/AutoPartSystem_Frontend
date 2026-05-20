import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  FileText,
  Eye,
  Trash2,
  Wrench,
  X,
  Loader2,
  AlertCircle,
  Car,
  DollarSign,
  Receipt,
  Edit3
} from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
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
  getServiceRecords,
  getServiceRecordLookups,
  createServiceRecord,
  updateServiceRecord,
  generateServiceInvoice,
  type ServiceRecord,
  type ServiceRecordPartRequest
} from '../../api/service-records-api'
import { getStaffCustomerVehicles } from '@/features/sales-invoices/api/sales-invoices-api'
import { DEFAULT_VEHICLE_LIST_SORTS } from '@/features/vehicles/api/vehicles-api'
import type { CustomerVehicle } from '@/features/vehicles/types/vehicles'
import type { SalesInvoiceLookup, SalesInvoicePartLookupResponse } from '@/features/sales-invoices/types/sales-invoices'
import { mergeSelectedVehicleForCombobox } from '@/features/vehicles/utils/vehicle-combobox-options'
import { formatDateOnly } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError } from '@/types/api'

interface ServiceRecordLineDraft {
  partId: string
  quantity: string
}

interface ServiceRecordFormState {
  customerId: string
  vehicleId: string
  diagnosis: string
  workDone: string
  laborCharge: string
  notes: string
  status: string
  partsUsed: ServiceRecordLineDraft[]
}

const initialForm: ServiceRecordFormState = {
  customerId: '',
  vehicleId: '',
  diagnosis: '',
  workDone: '',
  laborCharge: '0',
  notes: '',
  status: 'Open',
  partsUsed: [],
}

export function StaffServiceRecordsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = React.useState<'list' | 'create'>('list')
  const [records, setRecords] = React.useState<ServiceRecord[]>([])
  const [lookups, setLookups] = React.useState<SalesInvoiceLookup | null>(null)
  
  // States for loading/saving
  const [isLoadingList, setIsLoadingList] = React.useState(true)
  const [isLookupLoading, setIsLookupLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isBilling, setIsBilling] = React.useState<number | null>(null)
  
  // Errors and feedback
  const [listError, setListError] = React.useState<string | null>(null)
  const [lookupError, setLookupError] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('')

  // Selected for modals
  const [selectedRecord, setSelectedRecord] = React.useState<ServiceRecord | null>(null)
  const [editingRecord, setEditingRecord] = React.useState<ServiceRecord | null>(null)

  // Form states
  const [form, setForm] = React.useState<ServiceRecordFormState>(initialForm)
  const [editForm, setEditForm] = React.useState<Omit<ServiceRecordFormState, 'customerId' | 'vehicleId'>>({
    diagnosis: '',
    workDone: '',
    laborCharge: '0',
    notes: '',
    status: 'Open',
    partsUsed: [],
  })

  // Customer vehicles loading states
  const [staffVehicles, setStaffVehicles] = React.useState<CustomerVehicle[]>([])
  const [vehicleComboSearch, setVehicleComboSearch] = React.useState('')
  const [debouncedVehicleSearch, setDebouncedVehicleSearch] = React.useState('')
  const [isStaffVehiclesLoading, setIsStaffVehiclesLoading] = React.useState(false)
  const [selectedStaffVehicle, setSelectedStaffVehicle] = React.useState<CustomerVehicle | null>(null)

  // Parse header shortcut trigger
  React.useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setActiveTab('create')
      // Clear query params to not re-trigger on subsequent clicks
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Fetch list
  const loadRecords = React.useCallback(async () => {
    try {
      setIsLoadingList(true)
      setListError(null)
      const data = await getServiceRecords()
      setRecords(data)
    } catch (err) {
      setListError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Unable to load service records.'
      )
    } finally {
      setIsLoadingList(false)
    }
  }, [])

  React.useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  // Load Lookups on mount
  React.useEffect(() => {
    async function loadLookups() {
      try {
        setLookupError(null)
        setIsLookupLoading(true)
        const response = await getServiceRecordLookups()
        setLookups(response)
      } catch (error) {
        setLookupError(
          error instanceof ApiError || error instanceof Error
            ? error.message
            : 'Unable to load service form choices.'
        )
      } finally {
        setIsLookupLoading(false)
      }
    }
    void loadLookups()
  }, [])

  // Handle customer dynamic vehicle loading
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

  // Map vehicle choice to object
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

  // Combobox Memoized Options
  const customerOptions = React.useMemo<SearchableComboboxOption[]>(
    () =>
      (lookups?.customers ?? []).map((customer) => ({
        value: String(customer.customerId),
        label: customer.fullName,
        searchText: `${customer.fullName} ${customer.email} ${customer.phoneNumber ?? ''}`,
        secondaryText: `${customer.email}${customer.phoneNumber ? ` | ${customer.phoneNumber}` : ''}`,
      })),
    [lookups]
  )

  const mergedStaffVehicles = React.useMemo(
    () => mergeSelectedVehicleForCombobox(staffVehicles, selectedStaffVehicle),
    [staffVehicles, selectedStaffVehicle]
  )

  const vehicleOptions = React.useMemo<SearchableComboboxOption[]>(
    () =>
      mergedStaffVehicles.map((vehicle) => ({
        value: String(vehicle.vehicleId),
        label: vehicle.vehicleNumber,
        searchText: `${vehicle.vehicleNumber} ${vehicle.make} ${vehicle.model}`,
        secondaryText: `${vehicle.make} ${vehicle.model}`,
      })),
    [mergedStaffVehicles]
  )

  const partLookupMap = React.useMemo(() => {
    return new Map(
      (lookups?.parts ?? []).map((part) => [String(part.partId), part])
    )
  }, [lookups])

  function getPartOptions(excludeLineIndex: number, isEdit: boolean = false): SearchableComboboxOption[] {
    const itemsList = isEdit ? editForm.partsUsed : form.partsUsed
    const chosenPartIds = new Set(
      itemsList
        .filter((_, index) => index !== excludeLineIndex)
        .map((item) => item.partId)
        .filter(Boolean)
    )

    return (lookups?.parts ?? [])
      .filter((part) => !chosenPartIds.has(String(part.partId)))
      .map((part) => ({
        value: String(part.partId),
        label: part.partName,
        searchText: `${part.partName} ${part.brand} ${part.partId}`,
        secondaryText: `${part.brand} | ${formatCurrency(part.unitPrice)} | Stock: ${part.stockQty}`,
      }))
  }

  // Handle Form Change Events
  function updateForm<K extends keyof ServiceRecordFormState>(field: K, value: ServiceRecordFormState[K]) {
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

  function addPartLine(isEdit: boolean = false) {
    const updateFn = isEdit ? setEditForm : setForm
    updateFn((current: any) => ({
      ...current,
      partsUsed: [
        ...current.partsUsed,
        { partId: '', quantity: '1' }
      ]
    }))
  }

  function removePartLine(index: number, isEdit: boolean = false) {
    const updateFn = isEdit ? setEditForm : setForm
    updateFn((current: any) => ({
      ...current,
      partsUsed: current.partsUsed.filter((_: any, i: number) => i !== index)
    }))
  }

  function updatePartLine(index: number, field: keyof ServiceRecordLineDraft, value: string, isEdit: boolean = false) {
    const updateFn = isEdit ? setEditForm : setForm
    updateFn((current: any) => ({
      ...current,
      partsUsed: current.partsUsed.map((item: any, i: number) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  // Preview computations
  const createSubtotal = React.useMemo(() => {
    const labor = Number(form.laborCharge || 0)
    const partsTotal = form.partsUsed.reduce((sum, line) => {
      const part = partLookupMap.get(line.partId)
      const qty = Number(line.quantity || 0)
      return sum + (part?.unitPrice ?? 0) * qty
    }, 0)
    return labor + partsTotal
  }, [form.laborCharge, form.partsUsed, partLookupMap])

  const editSubtotal = React.useMemo(() => {
    const labor = Number(editForm.laborCharge || 0)
    const partsTotal = editForm.partsUsed.reduce((sum, line) => {
      const part = partLookupMap.get(line.partId)
      const qty = Number(line.quantity || 0)
      return sum + (part?.unitPrice ?? 0) * qty
    }, 0)
    return labor + partsTotal
  }, [editForm.laborCharge, editForm.partsUsed, partLookupMap])

  // Actions: CREATE
  async function handleCreateRecord(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSuccessMessage(null)

    if (!form.customerId) {
      setSubmitError('Please choose a customer.')
      return
    }
    if (!form.vehicleId) {
      setSubmitError('Please choose a vehicle.')
      return
    }
    if (!form.diagnosis.trim()) {
      setSubmitError('Please enter a diagnosis description.')
      return
    }
    if (!form.workDone.trim()) {
      setSubmitError('Please enter a work done description.')
      return
    }

    // Validate quantities & stock
    for (const item of form.partsUsed) {
      if (!item.partId) {
        setSubmitError('Please select a part for all added lines.')
        return
      }
      const qty = Number(item.quantity)
      const partObj = partLookupMap.get(item.partId)
      if (isNaN(qty) || qty <= 0) {
        setSubmitError(`Invalid quantity for part: ${partObj?.partName ?? 'Selected Part'}`)
        return
      }
      if (partObj && qty > partObj.stockQty) {
        setSubmitError(`Insufficient stock for ${partObj.partName}. Available: ${partObj.stockQty}, Requested: ${qty}`)
        return
      }
    }

    try {
      setIsSubmitting(true)
      const payload = {
        customerId: Number(form.customerId),
        vehicleId: Number(form.vehicleId),
        diagnosis: form.diagnosis,
        workDone: form.workDone,
        laborCharge: Number(form.laborCharge || 0),
        notes: form.notes || undefined,
        status: form.status || undefined,
        partsUsed: form.partsUsed.map((p) => ({
          partId: Number(p.partId),
          quantity: Number(p.quantity)
        }))
      }

      await createServiceRecord(payload)
      setSuccessMessage('Service record logged and vehicle inventory stock adjusted successfully!')
      setForm(initialForm)
      setSelectedStaffVehicle(null)
      setActiveTab('list')
      void loadRecords()
    } catch (error) {
      setSubmitError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Unable to save service record.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: EDIT OPEN
  function openEditModal(record: ServiceRecord) {
    setEditingRecord(record)
    setEditForm({
      diagnosis: record.diagnosis,
      workDone: record.workDone,
      laborCharge: String(record.laborCharge),
      notes: record.notes ?? '',
      status: record.status,
      partsUsed: record.partsUsed.map((p) => ({
        partId: String(p.partId),
        quantity: String(p.quantity)
      }))
    })
  }

  // Action: UPDATE SAVE
  async function handleUpdateRecord(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRecord) return
    setSubmitError(null)

    if (!editForm.diagnosis.trim()) {
      setSubmitError('Please enter a diagnosis description.')
      return
    }
    if (!editForm.workDone.trim()) {
      setSubmitError('Please enter a work done description.')
      return
    }

    // Validate quantities & stock
    for (const item of editForm.partsUsed) {
      if (!item.partId) {
        setSubmitError('Please select a part for all added lines.')
        return
      }
      const qty = Number(item.quantity)
      const partObj = partLookupMap.get(item.partId)
      if (isNaN(qty) || qty <= 0) {
        setSubmitError(`Invalid quantity for part: ${partObj?.partName ?? 'Selected Part'}`)
        return
      }
      // Reconcile stock check if new parts were added or changed
      const originalPart = editingRecord.partsUsed.find(op => String(op.partId) === item.partId)
      const delta = qty - (originalPart?.quantity ?? 0)
      if (partObj && delta > partObj.stockQty) {
        setSubmitError(`Insufficient stock for ${partObj.partName}. Additional needed: ${delta}, Available: ${partObj.stockQty}`)
        return
      }
    }

    try {
      setIsSubmitting(true)
      const payload = {
        diagnosis: editForm.diagnosis,
        workDone: editForm.workDone,
        laborCharge: Number(editForm.laborCharge || 0),
        notes: editForm.notes || undefined,
        status: editForm.status,
        partsUsed: editForm.partsUsed.map((p) => ({
          partId: Number(p.partId),
          quantity: Number(p.quantity)
        }))
      }

      await updateServiceRecord(editingRecord.serviceRecordId, payload)
      setSuccessMessage('Service record updated and stock levels reconciled successfully!')
      setEditingRecord(null)
      void loadRecords()
    } catch (error) {
      setSubmitError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Unable to update service record.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: CREATE INVOICE
  async function handleCreateInvoice(recordId: number) {
    try {
      setIsBilling(recordId)
      setSuccessMessage(null)
      const invoice = await generateServiceInvoice(recordId)
      setSuccessMessage(`Service Invoice ${invoice.invoiceNo} successfully created for ${invoice.customerName}!`)
      void loadRecords()
    } catch (err) {
      alert(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to generate service invoice.')
    } finally {
      setIsBilling(null)
    }
  }

  // Filter local record list
  const filteredRecords = React.useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.vehicleNumber.toLowerCase().includes(q) ||
        r.diagnosis.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        String(r.serviceRecordId).includes(q)
      )
    })
  }, [records, searchQuery])

  return (
    <PageSection
      description="Record details about vehicle maintenance, parts consumption, and generate customer billing invoices."
      title="Service Records Manager"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-6 mb-6">
          <button
            onClick={() => {
              setActiveTab('list')
              setSubmitError(null)
            }}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'list'
                ? 'text-[var(--vs-green-800)] border-b-2 border-[var(--vs-green-800)]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Completed Services
          </button>
          <button
            onClick={() => {
              setActiveTab('create')
              setSubmitError(null)
            }}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'create'
                ? 'text-[var(--vs-green-800)] border-b-2 border-[var(--vs-green-800)]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Log New Service
          </button>
        </div>

        {/* Global Feedback Banner */}
        {successMessage && (
          <Alert className="bg-emerald-50 border-emerald-200 text-emerald-950 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertTitle className="font-semibold text-emerald-800">Operation Successful</AlertTitle>
            <AlertDescription className="text-emerald-700">{successMessage}</AlertDescription>
          </Alert>
        )}

        {activeTab === 'list' ? (
          <div className="space-y-6">
            {/* Search Filter Card */}
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardContent className="pt-6">
                <div className="relative">
                  <Wrench className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search records by customer, vehicle license plate, diagnosis, or status..."
                    className="pl-10 h-11 border-gray-200 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {listError && (
              <Alert variant="destructive">
                <AlertTitle>Error loading service records</AlertTitle>
                <AlertDescription>{listError}</AlertDescription>
              </Alert>
            )}

            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {isLoadingList ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="size-8 text-[var(--vs-green-800)] animate-spin" />
                    <span className="text-sm text-gray-500">Loading service logs...</span>
                  </div>
                ) : filteredRecords.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="font-semibold text-xs text-gray-700">Record ID</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Customer & Vehicle</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Service Details</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Charges (NPR)</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Date & Status</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((r) => (
                        <TableRow key={r.serviceRecordId} className="hover:bg-gray-50/20 transition-colors">
                          <TableCell className="font-mono text-xs font-semibold text-gray-500">
                            #{r.serviceRecordId}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800 text-xs">{r.customerName}</span>
                              <span className="text-gray-500 text-[10px] flex items-center gap-1 mt-0.5">
                                <Car size={11} className="text-gray-400" /> {r.vehicleNumber}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs space-y-0.5">
                              <p className="text-xs font-semibold text-gray-700 truncate">Dx: {r.diagnosis}</p>
                              <p className="text-[10px] text-gray-500 truncate">Tx: {r.workDone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-[11px] text-gray-600">
                              <span>Labor: {formatCurrency(r.laborCharge)}</span>
                              <span>Parts: {formatCurrency(r.partsCharge)}</span>
                              <span className="font-bold text-gray-900 mt-0.5 flex items-center gap-0.5">
                                <DollarSign size={10} />
                                {formatCurrency(r.totalCharge)}
                              </span>
                            </div>
                          </TableCell>
                           <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-xs text-gray-600">{formatDateOnly(r.serviceDate)}</span>
                              <Badge
                                className={`font-semibold text-[9px] px-2 py-0.5 rounded-full ${
                                  r.status === 'Open'
                                    ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                    : r.status === 'ReadyForBilling'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}
                              >
                                {r.status === 'ReadyForBilling' ? 'Ready For Billing' : r.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                title="View detailed service log"
                                onClick={() => setSelectedRecord(r)}
                              >
                                <Eye className="size-4" />
                              </Button>

                              {r.status === 'ReadyForBilling' && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                                    title="Edit diagnosis or parts"
                                    onClick={() => openEditModal(r)}
                                  >
                                    <Edit3 className="size-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                                    title="Generate Service Invoice"
                                    onClick={() => void handleCreateInvoice(r.serviceRecordId)}
                                    disabled={isBilling === r.serviceRecordId}
                                  >
                                    {isBilling === r.serviceRecordId ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <Receipt className="size-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <FileText className="size-8 text-gray-300" />
                    <span className="text-sm text-gray-500">No completed services logged.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {submitError && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle className="size-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
              {/* Creation Form */}
              <Card className="rounded-2xl border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle>Log Vehicle Service Details</CardTitle>
                  <CardDescription>
                    Assign a customer and select their vehicle, then list all diagnostic findings, labor actions, and parts used.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateRecord} className="space-y-6">
                    {/* Customer & Vehicle Row */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="service-customer">Customer</Label>
                        <SearchableCombobox
                          emptyText="No customers registered."
                          onChange={updateCustomer}
                          options={customerOptions}
                          placeholder={isLookupLoading ? 'Loading customer records...' : 'Select customer'}
                          searchPlaceholder="Search customers..."
                          value={form.customerId}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="service-vehicle">Vehicle Plate</Label>
                        <SearchableCombobox
                          disabled={!form.customerId || isLookupLoading}
                          emptyText={
                            form.customerId
                              ? 'No vehicles registered for this customer.'
                              : 'Choose a customer first.'
                          }
                          onChange={(value) => updateForm('vehicleId', value)}
                          onSearchChange={setVehicleComboSearch}
                          options={vehicleOptions}
                          placeholder={
                            form.customerId
                              ? 'Select vehicle plate'
                              : 'Choose a customer first'
                          }
                          searchLoading={isStaffVehiclesLoading}
                          searchPlaceholder="Search vehicle plates..."
                          serverSearch
                          value={form.vehicleId}
                        />
                      </div>
                    </div>

                    {/* Customer Info Card Snippet */}
                    {selectedStaffVehicle && (
                      <div className="rounded-xl border bg-gray-50/50 px-4 py-3 text-xs text-gray-500 space-y-1">
                        <div className="font-bold text-gray-800">Vehicle Details:</div>
                        <div>Plate Number: <span className="font-mono font-bold text-gray-700">{selectedStaffVehicle.vehicleNumber}</span></div>
                        <div>Model: {selectedStaffVehicle.make} {selectedStaffVehicle.model} ({selectedStaffVehicle.year})</div>
                        <div>Color: {selectedStaffVehicle.color} | Engine: {selectedStaffVehicle.engineNumber}</div>
                      </div>
                    )}

                    {/* Diagnosis & Work Done */}
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="diagnosis">Diagnosis Findings</Label>
                        <Textarea
                          id="diagnosis"
                          placeholder="Describe the diagnostics check, faults discovered, or issues reported by the customer..."
                          rows={3}
                          value={form.diagnosis}
                          onChange={(e) => updateForm('diagnosis', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="work-done">Work Completed</Label>
                        <Textarea
                          id="work-done"
                          placeholder="List the service jobs completed (e.g. replaced engine oil, wheel balancing, brake replacement)..."
                          rows={3}
                          value={form.workDone}
                          onChange={(e) => updateForm('workDone', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Labor Charge & Notes */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="labor-charge">Labor Charge (NPR)</Label>
                        <Input
                          id="labor-charge"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Labor cost for this service"
                          value={form.laborCharge}
                          onChange={(e) => updateForm('laborCharge', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Internal Notes (Optional)</Label>
                        <Input
                          id="notes"
                          placeholder="Service recommendations or comments..."
                          value={form.notes}
                          onChange={(e) => updateForm('notes', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Parts Used Section */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">Parts Consumption</h4>
                          <p className="text-xs text-gray-500">Add inventory parts used during servicing to decrease stock automatically.</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addPartLine(false)}
                          className="h-8 px-3 rounded-lg border-gray-200"
                        >
                          <Plus className="size-4 mr-1" /> Add Part
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {form.partsUsed.map((line, index) => {
                          const partObj = partLookupMap.get(line.partId)
                          const options = getPartOptions(index, false)

                          return (
                            <div key={index} className="grid gap-3 items-end border border-gray-100 p-3 rounded-xl bg-gray-50/20 md:grid-cols-[minmax(0,2fr)_100px_100px_40px]">
                              <div className="grid gap-1.5">
                                <Label className="text-xs text-gray-600">Select Part</Label>
                                <SearchableCombobox
                                  emptyText="No parts matching."
                                  onChange={(val) => updatePartLine(index, 'partId', val, false)}
                                  options={options}
                                  placeholder="Choose part"
                                  searchPlaceholder="Search parts inventory..."
                                  value={line.partId}
                                />
                                {partObj && (
                                  <span className="text-[10px] text-gray-500">
                                    Brand: {partObj.brand} | Price: {formatCurrency(partObj.unitPrice)} | Stock: <span className="font-bold">{partObj.stockQty}</span>
                                  </span>
                                )}
                              </div>
                              <div className="grid gap-1.5">
                                <Label className="text-xs text-gray-600">Quantity</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={line.quantity}
                                  onChange={(e) => updatePartLine(index, 'quantity', e.target.value, false)}
                                  className="h-9 border-gray-200 rounded-lg text-center"
                                />
                              </div>
                              <div className="grid gap-1.5 text-right">
                                <Label className="text-xs text-gray-600">Total Price</Label>
                                <span className="h-9 flex items-center justify-end text-xs font-mono font-bold text-gray-700">
                                  {partObj ? formatCurrency(partObj.unitPrice * Number(line.quantity || 0)) : 'NPR 0'}
                                </span>
                              </div>
                              <div className="flex justify-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePartLine(index, false)}
                                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg size-8"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}

                        {form.partsUsed.length === 0 && (
                          <p className="text-center text-xs text-gray-400 py-4 italic">No parts were consumed for this service record.</p>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[var(--vs-green-800)] hover:bg-[var(--vs-green-900)] text-white font-semibold rounded-xl px-6 py-2.5 transition"
                      >
                        {isSubmitting ? 'Saving record...' : 'Log Service Record'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Summary Preview Side Column */}
              <div className="space-y-6">
                <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gray-50/50 pb-4 border-b border-gray-100">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Wrench size={16} className="text-[var(--vs-green-800)]" />
                      Cost Estimate
                    </CardTitle>
                    <CardDescription>Estimated billing totals based on labor and selected parts.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="space-y-2 border-b border-gray-100 pb-3">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Labor Charge</span>
                        <span className="font-mono text-gray-700">{formatCurrency(Number(form.laborCharge || 0))}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Parts Consumption</span>
                        <span className="font-mono text-gray-700">
                          {formatCurrency(
                            form.partsUsed.reduce((sum, line) => {
                              const part = partLookupMap.get(line.partId)
                              return sum + (part?.unitPrice ?? 0) * Number(line.quantity || 0)
                            }, 0)
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-gray-800">
                      <span>Total Estimate</span>
                      <span className="text-base text-[var(--vs-green-800)] font-mono">{formatCurrency(createSubtotal)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIEW SERVICE RECORD MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3 bg-gray-50/50 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-gray-900">
                    Service Record Details - #{selectedRecord.serviceRecordId}
                  </h3>
                  <Badge
                    className={`font-semibold text-[8px] px-1.5 py-0.5 rounded-full ${
                      selectedRecord.status === 'Open'
                        ? 'bg-sky-50 text-sky-700 border border-sky-100'
                        : selectedRecord.status === 'ReadyForBilling'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}
                  >
                    {selectedRecord.status === 'ReadyForBilling' ? 'Ready For Billing' : selectedRecord.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-gray-500">Logged by: {selectedRecord.staffName} on {formatDateOnly(selectedRecord.serviceDate)}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full size-8 hover:bg-gray-200"
                onClick={() => setSelectedRecord(null)}
              >
                <X className="size-4 text-gray-500" />
              </Button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid gap-5 md:grid-cols-2">
                {/* Left Side: Diagnostics & Maintenance details */}
                <div className="space-y-4">
                  <div className="grid gap-3 grid-cols-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Customer Name</span>
                      <span className="font-bold text-gray-800">{selectedRecord.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Vehicle Plate</span>
                      <span className="font-mono font-bold text-gray-800">{selectedRecord.vehicleNumber}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Diagnosis Findings</span>
                      <div className="bg-gray-50 p-3 rounded-xl text-gray-700 border border-gray-100 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                        {selectedRecord.diagnosis || "No diagnosis logged."}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Work Actions Logged</span>
                      <div className="bg-gray-50 p-3 rounded-xl text-gray-700 border border-gray-100 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                        {selectedRecord.workDone || "No work details logged."}
                      </div>
                    </div>
                    {selectedRecord.notes && (
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Internal Notes</span>
                        <div className="bg-gray-50 p-3 rounded-xl text-gray-600 border border-gray-100 whitespace-pre-wrap italic leading-relaxed">
                          {selectedRecord.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Parts Used & Billing Summary */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Parts Used & Reconciled</span>
                    <div className="rounded-xl border border-gray-100 overflow-hidden bg-white max-h-[180px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-gray-50/40 sticky top-0 z-10">
                          <TableRow className="h-8">
                            <TableHead className="font-semibold text-[10px] text-gray-700 h-8 py-1">Part</TableHead>
                            <TableHead className="font-semibold text-[10px] text-gray-700 text-center w-12 h-8 py-1">Qty</TableHead>
                            <TableHead className="font-semibold text-[10px] text-gray-700 text-right w-20 h-8 py-1">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedRecord.partsUsed && selectedRecord.partsUsed.length > 0 ? (
                            selectedRecord.partsUsed.map((p, idx) => (
                              <TableRow key={idx} className="h-8">
                                <TableCell className="text-[11px] text-gray-800 py-1">
                                  <div className="font-semibold truncate max-w-[120px]">{p.partName}</div>
                                  <div className="text-[9px] text-gray-400 truncate max-w-[120px]">{p.brand}</div>
                                </TableCell>
                                <TableCell className="text-center text-[11px] text-gray-700 font-bold py-1">{p.quantity}</TableCell>
                                <TableCell className="text-right text-[11px] text-gray-900 font-mono font-bold py-1">{formatCurrency(p.lineTotal)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-[11px] text-gray-400 py-6 italic">
                                No parts used.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Cost Summary Block */}
                  <div className="rounded-xl border bg-gray-50/50 p-4 border-gray-100 space-y-2 mt-auto">
                    <div className="flex justify-between text-gray-500 text-[11px]">
                      <span>Labor Service Charge</span>
                      <span className="font-mono text-gray-800">{formatCurrency(selectedRecord.laborCharge)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-[11px]">
                      <span>Parts Subtotal</span>
                      <span className="font-mono text-gray-800">{formatCurrency(selectedRecord.partsCharge)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-xs font-bold text-gray-800">
                      <span>Total Billing Amount</span>
                      <span className="font-mono text-xs text-[var(--vs-green-800)]">{formatCurrency(selectedRecord.totalCharge)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t px-5 py-3 bg-gray-50/50 shrink-0">
              <Button
                variant="outline"
                className="rounded-lg px-3 py-1.5 text-[11px] font-semibold border-gray-200 h-8"
                onClick={() => setSelectedRecord(null)}
              >
                Close Log
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SERVICE RECORD MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4.5 bg-gray-50/50 shrink-0">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  Edit Service Log - #{editingRecord.serviceRecordId}
                </h3>
                <p className="text-xs text-gray-500">For Customer: {editingRecord.customerName} ({editingRecord.vehicleNumber})</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full size-8 hover:bg-gray-200"
                onClick={() => setEditingRecord(null)}
              >
                <X className="size-4 text-gray-500" />
              </Button>
            </div>

            <form onSubmit={handleUpdateRecord} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 text-sm overflow-y-auto flex-1">
                {submitError && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-diagnosis">Diagnosis findings</Label>
                    <Textarea
                      id="edit-diagnosis"
                      rows={3}
                      value={editForm.diagnosis}
                      onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-work-done">Work Completed</Label>
                    <Textarea
                      id="edit-work-done"
                      rows={3}
                      value={editForm.workDone}
                      onChange={(e) => setEditForm({ ...editForm, workDone: e.target.value })}
                    />
                  </div>
                </div>

                 <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-labor-charge">Labor Charge (NPR)</Label>
                    <Input
                      id="edit-labor-charge"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.laborCharge}
                      onChange={(e) => setEditForm({ ...editForm, laborCharge: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Service Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                      disabled={editingRecord.status === 'Closed'}
                    >
                      <SelectTrigger id="edit-status" className="h-9 border-gray-200">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="ReadyForBilling">Ready For Billing</SelectItem>
                        <SelectItem value="Closed" disabled>Closed (Invoiced)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-notes">Internal Notes (Optional)</Label>
                    <Input
                      id="edit-notes"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                {/* Edit Mode Parts list */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Parts Used</h4>
                      <p className="text-[10px] text-gray-500">Edit or add parts. Stock levels will adjust automatically based on changes.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPartLine(true)}
                      className="h-8 px-3 rounded-lg border-gray-200 text-xs"
                    >
                      <Plus className="size-3.5 mr-1" /> Add Part
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {editForm.partsUsed.map((line, index) => {
                      const partObj = partLookupMap.get(line.partId)
                      const options = getPartOptions(index, true)

                      return (
                        <div key={index} className="grid gap-3 items-end border border-gray-100 p-3 rounded-xl bg-gray-50/20 md:grid-cols-[minmax(0,2fr)_100px_100px_40px]">
                          <div className="grid gap-1.5">
                            <Label className="text-xs text-gray-600">Part</Label>
                            <SearchableCombobox
                              emptyText="No parts matching."
                              onChange={(val) => updatePartLine(index, 'partId', val, true)}
                              options={options}
                              placeholder="Choose part"
                              searchPlaceholder="Search parts..."
                              value={line.partId}
                            />
                            {partObj && (
                              <span className="text-[10px] text-gray-500">
                                Price: {formatCurrency(partObj.unitPrice)} | Stock: <span className="font-bold">{partObj.stockQty}</span>
                              </span>
                            )}
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs text-gray-600">Qty</Label>
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => updatePartLine(index, 'quantity', e.target.value, true)}
                              className="h-9 text-center"
                            />
                          </div>
                          <div className="grid gap-1.5 text-right">
                            <Label className="text-xs text-gray-600">Line total</Label>
                            <span className="h-9 flex items-center justify-end text-xs font-mono font-bold text-gray-700">
                              {partObj ? formatCurrency(partObj.unitPrice * Number(line.quantity || 0)) : 'NPR 0'}
                            </span>
                          </div>
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePartLine(index, true)}
                              className="text-rose-500 hover:text-rose-600 rounded-lg size-8"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}

                    {editForm.partsUsed.length === 0 && (
                      <p className="text-center text-xs text-gray-400 py-3 italic">No parts added.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mt-4 text-xs font-bold text-gray-800">
                  <span>Total Estimated Cost</span>
                  <span className="font-mono text-sm text-[var(--vs-green-800)]">{formatCurrency(editSubtotal)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t px-6 py-4 bg-gray-50/50 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl px-4 py-2 text-xs font-semibold border-gray-200"
                  onClick={() => setEditingRecord(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--vs-green-800)] hover:bg-[var(--vs-green-900)] text-white font-semibold rounded-xl px-4 py-2 text-xs transition"
                >
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageSection>
  )
}
