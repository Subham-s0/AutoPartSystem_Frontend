import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  FileText, 
  Wrench, 
  Car, 
  DollarSign, 
  Eye, 
  Edit2, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  PlusCircle, 
  X,
  FileSpreadsheet
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
import { getStaffCustomerVehicles } from '@/features/sales-invoices/api/sales-invoices-api'
import { DEFAULT_VEHICLE_LIST_SORTS } from '@/features/vehicles/api/vehicles-api'
import type { CustomerVehicle } from '@/features/vehicles/types/vehicles'
import { mergeSelectedVehicleForCombobox } from '@/features/vehicles/utils/vehicle-combobox-options'
import { formatDateOnly } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError } from '@/types/api'
import type { SalesInvoiceLookup } from '@/features/sales-invoices/types/sales-invoices'

import {
  getServiceRecords,
  getServiceRecordLookups,
  createServiceRecord,
  updateServiceRecord,
  generateServiceInvoice,
  type ServiceRecordResponse,
  type ServiceRecordPartRequest
} from '../../api/service-records-api'

interface ServiceRecordPartDraft {
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
  partsUsed: ServiceRecordPartDraft[]
}

const initialForm: ServiceRecordFormState = {
  customerId: '',
  vehicleId: '',
  diagnosis: '',
  workDone: '',
  laborCharge: '0',
  notes: '',
  partsUsed: [],
}

export function StaffServiceRecordsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  // Navigation state
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

  // Data states
  const [records, setRecords] = React.useState<ServiceRecordResponse[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = React.useState(true)
  const [recordsError, setRecordsError] = React.useState<string | null>(null)
  
  const [lookups, setLookups] = React.useState<SalesInvoiceLookup | null>(null)
  const [isLookupLoading, setIsLookupLoading] = React.useState(true)
  const [lookupError, setLookupError] = React.useState<string | null>(null)

  const [searchQuery, setSearchQuery] = React.useState('')
  const [form, setForm] = React.useState<ServiceRecordFormState>(initialForm)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null)

  // Details & Editing Modals State
  const [selectedRecord, setSelectedRecord] = React.useState<ServiceRecordResponse | null>(null)
  const [editingRecord, setEditingRecord] = React.useState<ServiceRecordResponse | null>(null)
  const [editForm, setEditForm] = React.useState<ServiceRecordFormState>(initialForm)
  const [isEditSubmitting, setIsEditSubmitting] = React.useState(false)
  const [editError, setEditError] = React.useState<string | null>(null)

  // Invoicing progress state
  const [invoicingRecordId, setInvoicingRecordId] = React.useState<number | null>(null)

  // Vehicle loading for create form
  const [staffVehicles, setStaffVehicles] = React.useState<CustomerVehicle[]>([])
  const [vehicleComboSearch, setVehicleComboSearch] = React.useState('')
  const [debouncedVehicleSearch, setDebouncedVehicleSearch] = React.useState('')
  const [isStaffVehiclesLoading, setIsStaffVehiclesLoading] = React.useState(false)
  const [selectedStaffVehicle, setSelectedStaffVehicle] = React.useState<CustomerVehicle | null>(null)

  // Load records list
  const loadRecords = React.useCallback(async () => {
    try {
      setIsLoadingRecords(true)
      setRecordsError(null)
      const res = await getServiceRecords()
      setRecords(res)
    } catch (err) {
      setRecordsError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Unable to load service records.'
      )
    } finally {
      setIsLoadingRecords(false)
    }
  }, [])

  React.useEffect(() => {
    if (activeTab === 'list') {
      void loadRecords()
    }
  }, [activeTab, loadRecords])

  // Load lookups (customers, parts)
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
            : 'Unable to load service lookup tables.'
        )
      } finally {
        setIsLookupLoading(false)
      }
    }

    void loadLookups()
  }, [])

  // Debounced vehicle search for new records
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedVehicleSearch(vehicleComboSearch), 300)
    return () => clearTimeout(timer)
  }, [vehicleComboSearch])

  // Load vehicles for selected customer (Create tab)
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

  // Keep track of selected vehicle entity (Create tab)
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

  // Map lookups to searchable options
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

  // Helper: parts list filter to exclude already added lines
  function getPartOptions(excludeLineIndex: number, currentPartsList: ServiceRecordPartDraft[]): SearchableComboboxOption[] {
    const chosenPartIds = new Set(
      currentPartsList
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
        secondaryText: `${part.brand} | ${formatCurrency(part.unitPrice)} | Stock ${part.stockQty}`,
      }))
  }

  // Create Form updates
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
    setForm((current) => ({ ...current, vehicleId: value }))
  }

  function updateFormField<K extends keyof ServiceRecordFormState>(field: K, value: ServiceRecordFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // Parts list row management (Create form)
  function addPartLine() {
    setForm((current) => ({
      ...current,
      partsUsed: [...current.partsUsed, { partId: '', quantity: '1' }],
    }))
  }

  function removePartLine(index: number) {
    setForm((current) => ({
      ...current,
      partsUsed: current.partsUsed.filter((_, i) => i !== index),
    }))
  }

  function updatePartLine(index: number, field: keyof ServiceRecordPartDraft, value: string) {
    setForm((current) => ({
      ...current,
      partsUsed: current.partsUsed.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  // Edit Form updates
  function updateEditField<K extends keyof ServiceRecordFormState>(field: K, value: ServiceRecordFormState[K]) {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  function addEditPartLine() {
    setEditForm((current) => ({
      ...current,
      partsUsed: [...current.partsUsed, { partId: '', quantity: '1' }],
    }))
  }

  function removeEditPartLine(index: number) {
    setEditForm((current) => ({
      ...current,
      partsUsed: current.partsUsed.filter((_, i) => i !== index),
    }))
  }

  function updateEditPartLine(index: number, field: keyof ServiceRecordPartDraft, value: string) {
    setEditForm((current) => ({
      ...current,
      partsUsed: current.partsUsed.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  // Computations for Create Form
  const partsCharge = React.useMemo(() => {
    return form.partsUsed.reduce((sum, item) => {
      const part = partLookupMap.get(item.partId)
      if (!part) return sum
      return sum + part.unitPrice * Number(item.quantity || 0)
    }, 0)
  }, [form.partsUsed, partLookupMap])

  const totalCharge = React.useMemo(() => {
    const labor = Number(form.laborCharge || 0)
    return labor + partsCharge
  }, [form.laborCharge, partsCharge])

  // Computations for Edit Form
  const editPartsCharge = React.useMemo(() => {
    return editForm.partsUsed.reduce((sum, item) => {
      const part = partLookupMap.get(item.partId)
      if (!part) return sum
      return sum + part.unitPrice * Number(item.quantity || 0)
    }, 0)
  }, [editForm.partsUsed, partLookupMap])

  const editTotalCharge = React.useMemo(() => {
    const labor = Number(editForm.laborCharge || 0)
    return labor + editPartsCharge
  }, [editForm.laborCharge, editPartsCharge])

  // Submit Create Form
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    if (!form.customerId) {
      setSubmitError('Select a customer for the service record.')
      return
    }
    if (!form.vehicleId) {
      setSubmitError('Select a vehicle for the customer.')
      return
    }
    if (!form.diagnosis.trim()) {
      setSubmitError('Diagnosis is required.')
      return
    }
    if (!form.workDone.trim()) {
      setSubmitError('Work description is required.')
      return
    }
    if (form.partsUsed.some(p => !p.partId)) {
      setSubmitError('Select a part for all added lines.')
      return
    }

    try {
      setIsSubmitting(true)
      const input = {
        customerId: Number(form.customerId),
        vehicleId: Number(form.vehicleId),
        diagnosis: form.diagnosis,
        workDone: form.workDone,
        laborCharge: Number(form.laborCharge || 0),
        notes: form.notes || undefined,
        partsUsed: form.partsUsed.map(p => ({
          partId: Number(p.partId),
          quantity: Number(p.quantity || 1)
        }))
      }

      await createServiceRecord(input)
      setSubmitSuccess('Service record registered successfully!')
      setForm(initialForm)
      // Switch back to list tab
      setTimeout(() => {
        setActiveTab('list')
        setSearchParams({})
      }, 1000)
    } catch (err) {
      setSubmitError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Failed to create service record.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Edit modal
  function handleOpenEdit(record: ServiceRecordResponse) {
    setEditingRecord(record)
    setEditError(null)
    setEditForm({
      customerId: String(record.customerId),
      vehicleId: String(record.vehicleId),
      diagnosis: record.diagnosis,
      workDone: record.workDone,
      laborCharge: String(record.laborCharge),
      notes: record.notes || '',
      partsUsed: record.partsUsed.map(p => ({
        partId: String(p.partId),
        quantity: String(p.quantity)
      }))
    })
  }

  // Submit Edit Form
  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingRecord) return
    setEditError(null)

    if (!editForm.diagnosis.trim()) {
      setEditError('Diagnosis is required.')
      return
    }
    if (!editForm.workDone.trim()) {
      setEditError('Work done description is required.')
      return
    }
    if (editForm.partsUsed.some(p => !p.partId)) {
      setEditError('Select a part for all added lines.')
      return
    }

    try {
      setIsEditSubmitting(true)
      const input = {
        diagnosis: editForm.diagnosis,
        workDone: editForm.workDone,
        laborCharge: Number(editForm.laborCharge || 0),
        notes: editForm.notes || undefined,
        partsUsed: editForm.partsUsed.map(p => ({
          partId: Number(p.partId),
          quantity: Number(p.quantity || 1)
        }))
      }

      await updateServiceRecord(editingRecord.serviceRecordId, input)
      setEditingRecord(null)
      void loadRecords()
    } catch (err) {
      setEditError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Failed to update service record.'
      )
    } finally {
      setIsEditSubmitting(false)
    }
  }

  // Generate Service Invoice
  async function handleGenerateInvoice(recordId: number) {
    if (!window.confirm('Do you want to generate a service invoice for this record? This will close the service log.')) {
      return
    }

    try {
      setInvoicingRecordId(recordId)
      await generateServiceInvoice(recordId)
      alert('Service invoice generated successfully and service record closed!')
      void loadRecords()
    } catch (err) {
      alert(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Failed to generate service invoice.'
      )
    } finally {
      setInvoicingRecordId(null)
    }
  }

  // Filter service records
  const filteredRecords = React.useMemo(() => {
    if (!searchQuery.trim()) return records
    const q = searchQuery.toLowerCase().trim()
    return records.filter(
      (r) =>
        String(r.serviceRecordId).includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.vehicleNumber.toLowerCase().includes(q) ||
        r.diagnosis.toLowerCase().includes(q) ||
        r.workDone.toLowerCase().includes(q)
    )
  }, [records, searchQuery])

  // Summary Metrics
  const metrics = React.useMemo(() => {
    const total = records.length
    const pendingBilling = records.filter(r => r.status === 'ReadyForBilling').length
    const completedVal = records.reduce((sum, r) => sum + r.totalCharge, 0)
    return { total, pendingBilling, completedVal }
  }, [records])

  return (
    <PageSection
      description="Create service records, add parts directly, reconcile inventory levels, and bill customer servicing invoices."
      title="Service Records"
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        
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
            Service Logs History
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
            Create Service Record
          </button>
        </div>

        {activeTab === 'list' ? (
          <div className="space-y-6">
            
            {/* Quick Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="py-4">
                  <CardDescription className="font-medium text-gray-500">Total Service Logs</CardDescription>
                  <CardTitle className="text-2xl font-extrabold text-gray-800">{metrics.total}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="py-4">
                  <CardDescription className="font-medium text-gray-500">Ready For Billing</CardDescription>
                  <CardTitle className="text-2xl font-extrabold text-amber-600">{metrics.pendingBilling}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="py-4">
                  <CardDescription className="font-medium text-gray-500">Total Workshop Valuation</CardDescription>
                  <CardTitle className="text-2xl font-extrabold text-emerald-700">{formatCurrency(metrics.completedVal)}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Search Filter Card */}
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search logs by customer name, plate number, diagnosis description..."
                    className="pl-10 h-11 border-gray-200 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {recordsError && (
              <Alert variant="destructive">
                <AlertTitle>Error loading service records</AlertTitle>
                <AlertDescription>{recordsError}</AlertDescription>
              </Alert>
            )}

            {/* List Table Card */}
            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-0">
                {isLoadingRecords ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="size-8 text-[var(--vs-green-800)] animate-spin" />
                    <span className="text-sm text-gray-500">Loading service logs database...</span>
                  </div>
                ) : filteredRecords.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="font-semibold text-xs text-gray-700 w-24">Record ID</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Customer & Vehicle</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Details</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Charges</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700">Date & Status</TableHead>
                        <TableHead className="font-semibold text-xs text-gray-700 text-right w-44">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((rec) => (
                        <TableRow key={rec.serviceRecordId} className="hover:bg-gray-50/20 transition-colors">
                          <TableCell className="font-mono text-xs font-semibold text-gray-500">
                            #{rec.serviceRecordId}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 text-xs">{rec.customerName || 'Unknown Customer'}</span>
                              <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <Car size={11} className="text-gray-400" />
                                {rec.vehicleNumber || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs text-xs">
                              <div className="font-medium text-gray-800 truncate" title={rec.diagnosis}>
                                <span className="text-gray-400 font-semibold mr-1">Dx:</span>
                                {rec.diagnosis}
                              </div>
                              <div className="text-gray-500 truncate mt-0.5" title={rec.workDone}>
                                <span className="text-gray-400 font-semibold mr-1">Tx:</span>
                                {rec.workDone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex flex-col text-gray-600">
                              <span>Labor: {formatCurrency(rec.laborCharge)}</span>
                              <span>Parts: {formatCurrency(rec.partsCharge)}</span>
                              <span className="font-bold text-gray-900 mt-0.5">{formatCurrency(rec.totalCharge)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-gray-600 text-xs">{formatDateOnly(rec.serviceDate)}</span>
                              <Badge
                                className={`font-semibold text-[10px] h-5 ${
                                  rec.status === 'Closed'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : rec.status === 'ReadyForBilling'
                                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                                      : 'bg-blue-100 text-blue-800 border-blue-200'
                                }`}
                              >
                                {rec.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                title="View Detail"
                                onClick={() => setSelectedRecord(rec)}
                              >
                                <Eye className="size-4" />
                              </Button>
                              
                              {rec.status !== 'Closed' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                                  title="Edit Record"
                                  onClick={() => handleOpenEdit(rec)}
                                >
                                  <Edit2 className="size-4" />
                                </Button>
                              )}

                              {rec.status === 'ReadyForBilling' && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-semibold text-xs"
                                  onClick={() => void handleGenerateInvoice(rec.serviceRecordId)}
                                  disabled={invoicingRecordId === rec.serviceRecordId}
                                >
                                  {invoicingRecordId === rec.serviceRecordId ? (
                                    <Loader2 className="size-3 animate-spin mr-1" />
                                  ) : (
                                    <FileSpreadsheet className="size-3 mr-1" />
                                  )}
                                  Bill
                                </Button>
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
                    <span className="text-sm text-gray-500">No service logs matching your criteria.</span>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Create Tab */}
            {lookupError && (
              <Alert variant="destructive">
                <AlertTitle>Lookup tables failed to load</AlertTitle>
                <AlertDescription>{lookupError}</AlertDescription>
              </Alert>
            )}

            {submitError && (
              <Alert variant="destructive">
                <AlertTitle>Failed to register service record</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {submitSuccess && (
              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-950 rounded-xl">
                <AlertTitle className="font-semibold text-emerald-800">Success</AlertTitle>
                <AlertDescription className="text-emerald-700">{submitSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <Card className="rounded-2xl border-gray-100 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-800">New Service Record</CardTitle>
                  <CardDescription>
                    Assign record to a customer, input diagnostics details, specify labor, and select parts used.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="service-customer" className="font-semibold text-gray-700">Customer</Label>
                        <SearchableCombobox
                          emptyText="No customers registered."
                          onChange={updateCustomer}
                          options={customerOptions}
                          placeholder={isLookupLoading ? 'Loading customer base...' : 'Select customer'}
                          searchPlaceholder="Search by name, email..."
                          value={form.customerId}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="service-vehicle" className="font-semibold text-gray-700">Vehicle</Label>
                        <SearchableCombobox
                          disabled={!form.customerId || isLookupLoading}
                          emptyText={
                            form.customerId
                              ? 'No vehicles registered for this customer.'
                              : 'Choose a customer first.'
                          }
                          onChange={updateVehicleChoice}
                          onSearchChange={setVehicleComboSearch}
                          options={vehicleOptions}
                          placeholder={
                            form.customerId
                              ? 'Select customer vehicle'
                              : 'Select customer first'
                          }
                          searchLoading={isStaffVehiclesLoading}
                          searchPlaceholder="Search plate plate..."
                          serverSearch
                          value={form.vehicleId}
                        />
                      </div>
                    </div>

                    {/* Customer info card */}
                    {form.customerId && lookups?.customers && (
                      (() => {
                        const cust = lookups.customers.find(c => String(c.customerId) === form.customerId)
                        if (!cust) return null
                        return (
                          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-xs space-y-1 text-gray-600 shadow-inner">
                            <div className="font-semibold text-gray-800 text-sm">{cust.fullName}</div>
                            <div>Email: {cust.email}</div>
                            {cust.phoneNumber && <div>Phone: {cust.phoneNumber}</div>}
                            {selectedStaffVehicle && (
                              <div className="mt-2 text-emerald-800 bg-emerald-50/50 px-2.5 py-1 rounded inline-block font-semibold">
                                Selected Vehicle: {selectedStaffVehicle.vehicleNumber} ({selectedStaffVehicle.make} {selectedStaffVehicle.model})
                              </div>
                            )}
                          </div>
                        )
                      })()
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="service-diagnosis" className="font-semibold text-gray-700">Diagnosis Details</Label>
                        <Textarea
                          id="service-diagnosis"
                          rows={3}
                          placeholder="What is the vehicle diagnosis and issues identified..."
                          value={form.diagnosis}
                          onChange={(e) => updateFormField('diagnosis', e.target.value)}
                          className="border-gray-200 rounded-xl"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="service-workdone" className="font-semibold text-gray-700">Work Done / Action Taken</Label>
                        <Textarea
                          id="service-workdone"
                          rows={3}
                          placeholder="What maintenance repairs were performed on the vehicle..."
                          value={form.workDone}
                          onChange={(e) => updateFormField('workDone', e.target.value)}
                          className="border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="service-labor" className="font-semibold text-gray-700">Labor Charge (NPR)</Label>
                        <Input
                          id="service-labor"
                          type="number"
                          min="0"
                          value={form.laborCharge}
                          onChange={(e) => updateFormField('laborCharge', e.target.value)}
                          className="border-gray-200 rounded-xl"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="service-notes" className="font-semibold text-gray-700">Administrative Notes (Optional)</Label>
                        <Input
                          id="service-notes"
                          type="text"
                          placeholder="Internal remarks..."
                          value={form.notes}
                          onChange={(e) => updateFormField('notes', e.target.value)}
                          className="border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Parts Used Section */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                          <Wrench size={16} className="text-[var(--vs-green-700)]" />
                          Parts Replaced
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg border-gray-200 hover:bg-gray-50 flex items-center gap-1 text-xs font-semibold"
                          onClick={addPartLine}
                        >
                          <PlusCircle size={14} className="text-emerald-600" />
                          Add Part
                        </Button>
                      </div>

                      {form.partsUsed.length > 0 ? (
                        <div className="space-y-3">
                          {form.partsUsed.map((line, index) => {
                            const selectedPart = partLookupMap.get(line.partId)
                            const lineTotal = selectedPart ? selectedPart.unitPrice * Number(line.quantity || 0) : 0
                            
                            return (
                              <div key={index} className="grid grid-cols-[1fr_120px_100px_40px] items-end gap-3 p-3 bg-gray-50/30 border border-gray-100 rounded-xl">
                                <div className="grid gap-1.5">
                                  <Label className="text-[10px] text-gray-500 font-semibold">Select Part</Label>
                                  <SearchableCombobox
                                    emptyText="No matching parts in stock."
                                    onChange={(value) => updatePartLine(index, 'partId', value)}
                                    options={getPartOptions(index, form.partsUsed)}
                                    placeholder="Search inventory parts..."
                                    searchPlaceholder="Search part..."
                                    value={line.partId}
                                  />
                                </div>
                                <div className="grid gap-1.5">
                                  <Label className="text-[10px] text-gray-500 font-semibold">Qty</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max={selectedPart?.stockQty}
                                    value={line.quantity}
                                    onChange={(e) => updatePartLine(index, 'quantity', e.target.value)}
                                    className="h-9 border-gray-200 rounded-lg text-xs"
                                  />
                                </div>
                                <div className="text-right pr-2">
                                  <div className="text-[9px] text-gray-400 font-semibold">Line Cost</div>
                                  <span className="text-xs font-bold text-gray-700">{formatCurrency(lineTotal)}</span>
                                </div>
                                <div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                                    onClick={() => removePartLine(index)}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-400">
                          No replacement parts added. Labor only service record.
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[var(--vs-green-800)] hover:bg-[var(--vs-green-900)] text-white font-semibold rounded-xl px-6"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin mr-2" />
                            Registering Record...
                          </>
                        ) : (
                          'Save Service Record'
                        )}
                      </Button>
                    </div>

                  </form>
                </CardContent>
              </Card>

              {/* Side Calculation Summary card */}
              <div className="space-y-6">
                <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-b from-gray-50 to-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold text-gray-800">Job Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Labor Charge:</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(Number(form.laborCharge || 0))}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Parts Cost:</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(partsCharge)}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm font-bold text-gray-900">
                      <span>Estimated Total:</span>
                      <span className="text-emerald-700 text-lg">{formatCurrency(totalCharge)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        )}

        {/* View Details Overlay Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-xl rounded-2xl shadow-xl overflow-hidden bg-white animate-in zoom-in-95 duration-200">
              <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between py-4">
                <div>
                  <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                    <FileText size={18} className="text-emerald-600" />
                    Service Log Details #{selectedRecord.serviceRecordId}
                  </CardTitle>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  onClick={() => setSelectedRecord(null)}
                >
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <span className="block text-[10px] text-gray-400 font-semibold uppercase">Customer</span>
                    <span className="font-bold text-gray-800 text-sm mt-0.5 block">{selectedRecord.customerName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-semibold uppercase">Vehicle Plate</span>
                    <span className="font-bold text-gray-800 text-sm mt-0.5 block">{selectedRecord.vehicleNumber}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-semibold uppercase">Technician</span>
                    <span className="font-medium text-gray-700 mt-0.5 block">{selectedRecord.staffName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-semibold uppercase">Date Logged</span>
                    <span className="font-medium text-gray-700 mt-0.5 block">{formatDateOnly(selectedRecord.serviceDate)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                  <div className="font-bold text-gray-800">Diagnosis:</div>
                  <div className="text-gray-600 leading-relaxed">{selectedRecord.diagnosis}</div>
                </div>

                <div className="space-y-1.5 p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                  <div className="font-bold text-gray-800">Repairs Done:</div>
                  <div className="text-gray-600 leading-relaxed">{selectedRecord.workDone}</div>
                </div>

                {selectedRecord.notes && (
                  <div className="text-xs text-gray-500 italic">
                    Note: {selectedRecord.notes}
                  </div>
                )}

                {/* Parts Used list */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <Wrench size={14} className="text-gray-500" />
                    Parts List Replaced
                  </div>
                  {selectedRecord.partsUsed.length > 0 ? (
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow>
                            <TableHead className="h-8 text-[10px] font-semibold text-gray-600">Part</TableHead>
                            <TableHead className="h-8 text-[10px] font-semibold text-gray-600 text-center w-16">Qty</TableHead>
                            <TableHead className="h-8 text-[10px] font-semibold text-gray-600 text-right w-24">Price</TableHead>
                            <TableHead className="h-8 text-[10px] font-semibold text-gray-600 text-right w-24">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedRecord.partsUsed.map((p) => (
                            <TableRow key={p.serviceRecordPartId}>
                              <TableCell className="py-2 text-[11px]">
                                <div className="font-medium text-gray-800">{p.partName}</div>
                                <div className="text-[9px] text-gray-400">{p.brand}</div>
                              </TableCell>
                              <TableCell className="py-2 text-[11px] text-center">{p.quantity}</TableCell>
                              <TableCell className="py-2 text-[11px] text-right">{formatCurrency(p.unitPrice)}</TableCell>
                              <TableCell className="py-2 text-[11px] text-right font-semibold text-gray-700">{formatCurrency(p.lineTotal)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-gray-50/30 border border-dashed border-gray-200 rounded-xl text-[11px] text-gray-400">
                      No part replacements listed.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-semibold text-gray-600">
                  <div className="space-y-1">
                    <div>Labor Charge: {formatCurrency(selectedRecord.laborCharge)}</div>
                    <div>Parts Subtotal: {formatCurrency(selectedRecord.partsCharge)}</div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-gray-400 font-semibold uppercase">Total Charge</span>
                    <span className="text-emerald-700 font-bold text-base mt-0.5 block">{formatCurrency(selectedRecord.totalCharge)}</span>
                  </div>
                </div>

                {/* Footer status link */}
                <div className="pt-2 flex justify-end gap-2">
                  {selectedRecord.serviceInvoiceId && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 select-none">
                      Linked Invoice ID: #{selectedRecord.serviceInvoiceId}
                    </Badge>
                  )}
                  <Button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="h-9 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-semibold text-xs"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Record Overlay Modal */}
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-xl rounded-2xl shadow-xl overflow-hidden bg-white animate-in zoom-in-95 duration-200">
              <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between py-4">
                <div>
                  <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                    <Edit2 size={16} className="text-amber-600" />
                    Modify Service Log #{editingRecord.serviceRecordId}
                  </CardTitle>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  onClick={() => setEditingRecord(null)}
                >
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <form onSubmit={handleEditSubmit}>
                <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {editError && (
                    <Alert variant="destructive">
                      <AlertTitle>Update failed</AlertTitle>
                      <AlertDescription>{editError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-xs p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="block text-gray-400 font-semibold">Customer</span>
                      <span className="font-bold text-gray-800 mt-0.5 block">{editingRecord.customerName}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-semibold">Vehicle</span>
                      <span className="font-bold text-gray-800 mt-0.5 block">{editingRecord.vehicleNumber}</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-diagnosis" className="font-semibold text-gray-700">Diagnosis Details</Label>
                    <Textarea
                      id="edit-diagnosis"
                      rows={2}
                      value={editForm.diagnosis}
                      onChange={(e) => updateEditField('diagnosis', e.target.value)}
                      className="border-gray-200 rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-workdone" className="font-semibold text-gray-700">Repairs Work Done</Label>
                    <Textarea
                      id="edit-workdone"
                      rows={2}
                      value={editForm.workDone}
                      onChange={(e) => updateEditField('workDone', e.target.value)}
                      className="border-gray-200 rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-labor" className="font-semibold text-gray-700">Labor Charge (NPR)</Label>
                      <Input
                        id="edit-labor"
                        type="number"
                        min="0"
                        value={editForm.laborCharge}
                        onChange={(e) => updateEditField('laborCharge', e.target.value)}
                        className="border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-notes" className="font-semibold text-gray-700">Internal Notes</Label>
                      <Input
                        id="edit-notes"
                        type="text"
                        value={editForm.notes}
                        onChange={(e) => updateEditField('notes', e.target.value)}
                        className="border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Parts List Reconciling Section */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-gray-800 text-xs">Parts Used</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[10px] rounded-lg border-gray-200 hover:bg-gray-50 flex items-center gap-1 font-semibold"
                        onClick={addEditPartLine}
                      >
                        <PlusCircle size={12} className="text-emerald-600" />
                        Add Part Line
                      </Button>
                    </div>

                    {editForm.partsUsed.length > 0 ? (
                      <div className="space-y-2">
                        {editForm.partsUsed.map((line, index) => {
                          const part = partLookupMap.get(line.partId)
                          const total = part ? part.unitPrice * Number(line.quantity || 0) : 0
                          
                          return (
                            <div key={index} className="grid grid-cols-[1fr_100px_90px_36px] items-center gap-2 p-2 bg-gray-50/50 border border-gray-100 rounded-lg">
                              <SearchableCombobox
                                emptyText="No parts available."
                                onChange={(value) => updateEditPartLine(index, 'partId', value)}
                                options={getPartOptions(index, editForm.partsUsed)}
                                placeholder="Choose part..."
                                searchPlaceholder="Search part..."
                                value={line.partId}
                              />
                              <Input
                                type="number"
                                min="1"
                                value={line.quantity}
                                onChange={(e) => updateEditPartLine(index, 'quantity', e.target.value)}
                                className="h-9 border-gray-200 rounded-lg text-xs"
                              />
                              <div className="text-right text-[11px] font-bold text-gray-700 pr-1">
                                {formatCurrency(total)}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                                onClick={() => removeEditPartLine(index)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 border border-dashed border-gray-200 rounded-xl text-[10px] text-gray-400">
                        No parts added.
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-emerald-50/30 rounded-xl flex justify-between items-center text-xs font-semibold text-gray-600 border border-emerald-100/50">
                    <span>New Total Charge:</span>
                    <span className="text-emerald-800 text-sm font-bold">{formatCurrency(editTotalCharge)}</span>
                  </div>

                </CardContent>
                <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-4 rounded-xl font-semibold text-xs border-gray-200"
                    onClick={() => setEditingRecord(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="h-9 px-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-semibold text-xs"
                  >
                    {isEditSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

      </div>
    </PageSection>
  )
}
