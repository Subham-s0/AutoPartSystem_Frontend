import * as React from 'react'
import { Plus, ReceiptText, Trash2 } from 'lucide-react'
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
import { createSalesInvoice } from '@/features/sales-invoices/api/sales-invoices-api'
import type { SalesInvoice } from '@/features/sales-invoices/types/sales-invoices'
import { useAuth } from '@/hooks/use-auth'
import { formatDateOnly } from '@/lib/date'
import { ApiError } from '@/types/api'

interface InvoiceLineDraft {
  partId: string
  quantity: string
  discountAmount: string
}

interface InvoiceFormState {
  invoiceNo: string
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
  invoiceNo: '',
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

export function SalesInvoicesPage() {
  const { user } = useAuth()
  const [form, setForm] = React.useState<InvoiceFormState>(initialForm)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [createdInvoice, setCreatedInvoice] = React.useState<SalesInvoice | null>(null)

  function updateForm<K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function updateItem(index: number, key: keyof InvoiceLineDraft, value: string) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await createSalesInvoice({
        invoiceNo: form.invoiceNo,
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
      setForm({
        ...initialForm,
        invoiceDate: new Date().toISOString().slice(0, 10),
      })
    } catch (submitError) {
      setError(
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Unable to create sales invoice.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const lineCount = form.items.length
  const totalQuantity = form.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  )

  return (
    <PageSection
      description="Create staff-side sales invoices using the current authenticated staff account."
      title="Sales Invoices"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="size-4" />
              Create sales invoice
            </CardTitle>
            <CardDescription>
              Signed in as {user?.fullName ?? 'staff user'}
              {user?.staffMemberId ? ` · Staff ID #${user.staffMemberId}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Request failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="invoice-number">Invoice number</Label>
                  <Input
                    id="invoice-number"
                    onChange={(event) => updateForm('invoiceNo', event.target.value)}
                    placeholder="INV-1001"
                    required
                    value={form.invoiceNo}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invoice-date">Invoice date</Label>
                  <Input
                    id="invoice-date"
                    onChange={(event) => updateForm('invoiceDate', event.target.value)}
                    required
                    type="date"
                    value={form.invoiceDate}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer-id">Customer ID</Label>
                  <Input
                    id="customer-id"
                    min={1}
                    onChange={(event) => updateForm('customerId', event.target.value)}
                    placeholder="1"
                    required
                    type="number"
                    value={form.customerId}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vehicle-id">Vehicle ID</Label>
                  <Input
                    id="vehicle-id"
                    min={1}
                    onChange={(event) => updateForm('vehicleId', event.target.value)}
                    placeholder="1"
                    required
                    type="number"
                    value={form.vehicleId}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="grid gap-2">
                  <Label htmlFor="discount-percent">Discount %</Label>
                  <Input
                    id="discount-percent"
                    min={0}
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
                    min={0}
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
                    min={0}
                    onChange={(event) => updateForm('amountPaid', event.target.value)}
                    step="0.01"
                    type="number"
                    value={form.amountPaid}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credit-due-date">Credit due date</Label>
                  <Input
                    id="credit-due-date"
                    onChange={(event) => updateForm('creditDueDate', event.target.value)}
                    type="date"
                    value={form.creditDueDate}
                  />
                </div>
              </div>

              <div className="grid gap-2 md:max-w-xs">
                <Label htmlFor="payment-type">Payment type</Label>
                <Select
                  onValueChange={(value) => updateForm('paymentType', value)}
                  value={form.paymentType}
                >
                  <SelectTrigger id="payment-type" className="w-full">
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Khalti</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium">Invoice items</h3>
                    <p className="text-sm text-muted-foreground">
                      Use the existing backend part IDs and quantities.
                    </p>
                  </div>
                  <Button onClick={addItem} size="sm" type="button" variant="outline">
                    <Plus className="size-4" />
                    Add line
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <Card key={`${index}-${item.partId}-${item.quantity}`} size="sm">
                      <CardContent className="pt-3">
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                          <div className="grid gap-2">
                            <Label htmlFor={`part-id-${index}`}>Part ID</Label>
                            <Input
                              id={`part-id-${index}`}
                              min={1}
                              onChange={(event) =>
                                updateItem(index, 'partId', event.target.value)
                              }
                              placeholder="Part ID"
                              required
                              type="number"
                              value={item.partId}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                            <Input
                              id={`quantity-${index}`}
                              min={1}
                              onChange={(event) =>
                                updateItem(index, 'quantity', event.target.value)
                              }
                              required
                              type="number"
                              value={item.quantity}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`discount-${index}`}>Discount amount</Label>
                            <Input
                              id={`discount-${index}`}
                              min={0}
                              onChange={(event) =>
                                updateItem(index, 'discountAmount', event.target.value)
                              }
                              step="0.01"
                              type="number"
                              value={item.discountAmount}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              disabled={form.items.length === 1}
                              onClick={() => removeItem(index)}
                              size="icon-sm"
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Creating invoice...' : 'Create invoice'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Draft overview</CardTitle>
              <CardDescription>
                Quick check before sending the request.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Invoice lines</p>
                <p className="mt-1 text-2xl font-semibold">{lineCount}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Requested quantity</p>
                <p className="mt-1 text-2xl font-semibold">{totalQuantity}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Last created invoice</CardTitle>
              <CardDescription>
                Displays the actual totals returned by the backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {createdInvoice ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{createdInvoice.paymentStatus}</Badge>
                    <Badge variant="outline">{createdInvoice.invoiceNo}</Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Invoice date</p>
                      <p className="mt-1 font-medium">
                        {formatDateOnly(createdInvoice.invoiceDate)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Staff member</p>
                      <p className="mt-1 font-medium">#{createdInvoice.staffMemberId}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Total amount</p>
                      <p className="mt-1 font-medium">
                        {formatCurrency(createdInvoice.totalAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Balance due</p>
                      <p className="mt-1 font-medium">
                        {formatCurrency(createdInvoice.balanceDue)}
                      </p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Line total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {createdInvoice.items.map((item) => (
                        <TableRow key={`${createdInvoice.salesInvoiceId}-${item.partId}`}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.partName}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.brand}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>{formatCurrency(item.discountAmount)}</TableCell>
                          <TableCell>{formatCurrency(item.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Create an invoice to review the saved response here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageSection>
  )
}
