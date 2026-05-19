import * as React from 'react'
import { Check, ChevronsUpDown, Plus, ReceiptText, Trash2 } from 'lucide-react'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  createSalesInvoice,
  getSalesInvoiceLookups,
} from '@/features/sales-invoices/api/sales-invoices-api'
import type {
  SalesInvoice,
  SalesInvoiceLookup,
} from '@/features/sales-invoices/types/sales-invoices'
import { formatDateOnly } from '@/lib/date'
import { cn } from '@/lib/utils'
import { ApiError } from '@/types/api'

interface ComboboxOption {
  value: string
  label: string
  searchText: string
  secondaryText?: string
}

interface SearchableComboboxProps {
  emptyText: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder: string
  searchPlaceholder: string
  value: string
}

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 2,
  }).format(value)
}

function SearchableCombobox({
  emptyText,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  value,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="justify-between"
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className="truncate">
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  value={`${option.label} ${option.searchText}`}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.secondaryText ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {option.secondaryText}
                      </span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function SalesInvoicesPage() {
  const [form, setForm] = React.useState<InvoiceFormState>(initialForm)
  const [lookups, setLookups] = React.useState<SalesInvoiceLookup | null>(null)
  const [lookupError, setLookupError] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isLookupLoading, setIsLookupLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [createdInvoice, setCreatedInvoice] = React.useState<SalesInvoice | null>(null)

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

  const selectedVehicle = React.useMemo(
    () =>
      selectedCustomer?.vehicles.find(
        (vehicle) => String(vehicle.vehicleId) === form.vehicleId,
      ) ?? null,
    [form.vehicleId, selectedCustomer],
  )

  const partLookupMap = React.useMemo(() => {
    return new Map(
      (lookups?.parts ?? []).map((part) => [String(part.partId), part]),
    )
  }, [lookups])

  const customerOptions = React.useMemo<ComboboxOption[]>(
    () =>
      (lookups?.customers ?? []).map((customer) => ({
        value: String(customer.customerId),
        label: customer.fullName,
        searchText: `${customer.fullName} ${customer.email} ${customer.phoneNumber ?? ''}`,
        secondaryText: `${customer.email}${customer.phoneNumber ? ` | ${customer.phoneNumber}` : ''}`,
      })),
    [lookups],
  )

  const vehicleOptions = React.useMemo<ComboboxOption[]>(
    () =>
      (selectedCustomer?.vehicles ?? []).map((vehicle) => ({
        value: String(vehicle.vehicleId),
        label: vehicle.vehicleNumber,
        searchText: `${vehicle.vehicleNumber} ${vehicle.make} ${vehicle.model}`,
        secondaryText: `${vehicle.make} ${vehicle.model}`,
      })),
    [selectedCustomer],
  )

  function getPartOptions(excludeLineIndex: number) {
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
    setForm((current) => ({
      ...current,
      customerId: value,
      vehicleId: '',
    }))
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
      description="Create sales invoices with customer-linked vehicles and current in-stock parts."
      title="Sales Invoices"
    >
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
                      emptyText={
                        selectedCustomer
                          ? 'No vehicles found for this customer.'
                          : 'Choose a customer first.'
                      }
                      onChange={(value) => updateForm('vehicleId', value)}
                      options={vehicleOptions}
                      placeholder={
                        selectedCustomer
                          ? 'Select vehicle'
                          : 'Choose a customer first'
                      }
                      searchPlaceholder="Search vehicles..."
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
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </PageSection>
  )
}
