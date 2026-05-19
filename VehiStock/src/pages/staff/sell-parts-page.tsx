import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { PageSection } from '@/components/shared/page-section'
import { sellPart } from '@/features/staff-customer-sales/api/customer-desk-api'
import {
  errorMessage,
  formatCurrency,
  parseCustomerIdParam,
} from '@/features/staff-customer-sales/utils/customer-desk-ui'
import { getSalesInvoiceLookups } from '@/features/sales-invoices/api/sales-invoices-api'
import type { SalesInvoiceLookup } from '@/features/sales-invoices/types/sales-invoices'

export function SellPartsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const customerId = parseCustomerIdParam(searchParams.get('customerId'))
  const [customerIdInput, setCustomerIdInput] = React.useState(
    customerId != null ? String(customerId) : '',
  )

  const [lookups, setLookups] = React.useState<SalesInvoiceLookup | null>(null)
  const [lookupError, setLookupError] = React.useState<string | null>(null)
  const [isLookupLoading, setIsLookupLoading] = React.useState(true)

  const [partId, setPartId] = React.useState('')
  const [vehicleId, setVehicleId] = React.useState('')
  const [quantity, setQuantity] = React.useState('1')
  const [sellMessage, setSellMessage] = React.useState<string | null>(null)
  const [isSelling, setIsSelling] = React.useState(false)

  React.useEffect(() => {
    async function loadLookups() {
      try {
        setLookupError(null)
        setIsLookupLoading(true)
        const data = await getSalesInvoiceLookups()
        setLookups(data)
      } catch (error) {
        setLookupError(errorMessage(error, 'Unable to load parts and vehicles.'))
      } finally {
        setIsLookupLoading(false)
      }
    }

    void loadLookups()
  }, [])

  const lookupCustomer = React.useMemo(() => {
    if (!lookups || customerId == null) {
      return undefined
    }

    return lookups.customers.find((c) => c.customerId === customerId)
  }, [lookups, customerId])

  React.useEffect(() => {
    if (!lookupCustomer?.vehicles.length) {
      return
    }

    if (vehicleId) {
      return
    }

    if (lookupCustomer.vehicles.length === 1) {
      setVehicleId(String(lookupCustomer.vehicles[0].vehicleId))
    }
  }, [lookupCustomer, vehicleId])

  function handleSelectCustomer(event: React.FormEvent) {
    event.preventDefault()
    const id = parseCustomerIdParam(customerIdInput)
    if (id == null) {
      setSellMessage('Enter a valid customer ID.')
      return
    }

    setSellMessage(null)
    setSearchParams({ customerId: String(id) })
    setVehicleId('')
  }

  async function handleSell(event: React.FormEvent) {
    event.preventDefault()
    setSellMessage(null)

    if (customerId == null) {
      setSellMessage('Select a customer first.')
      return
    }

    const parsedPart = Number.parseInt(partId, 10)
    const parsedVehicle = Number.parseInt(vehicleId, 10)
    const parsedQty = Number.parseInt(quantity, 10)

    if (!Number.isFinite(parsedPart) || parsedPart <= 0) {
      setSellMessage('Choose a valid part.')
      return
    }

    if (!Number.isFinite(parsedVehicle) || parsedVehicle <= 0) {
      setSellMessage('Choose a valid vehicle.')
      return
    }

    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setSellMessage('Quantity must be a positive number.')
      return
    }

    try {
      setIsSelling(true)
      const message = await sellPart({
        customerId,
        partId: parsedPart,
        quantity: parsedQty,
        vehicleID: parsedVehicle,
      })
      setSellMessage(message)

      if (message === 'Sale completed successfully') {
        const nextLookups = await getSalesInvoiceLookups()
        setLookups(nextLookups)
      }
    } catch (error) {
      setSellMessage(errorMessage(error, 'Sale request failed.'))
    } finally {
      setIsSelling(false)
    }
  }

  return (
    <PageSection
      description="Record a part sale for a customer and vehicle."
      title="Sell parts"
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Customer</CardTitle>
          <CardDescription>
            Enter customer ID or pick from{' '}
            <Link className="text-primary underline" to={ROUTE_PATHS.staff.searchCustomers}>
              Search customers
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={handleSelectCustomer}>
            <div className="grid gap-2">
              <Label htmlFor="sell-customer-id">Customer ID</Label>
              <Input
                autoComplete="off"
                id="sell-customer-id"
                inputMode="numeric"
                onChange={(e) => setCustomerIdInput(e.target.value)}
                placeholder="e.g. 12"
                value={customerIdInput}
              />
            </div>
            <Button type="submit">Use customer</Button>
            {customerId != null ? (
              <Button asChild variant="outline">
                <Link to={ROUTE_PATHS.staff.customerDetailsWithId(customerId)}>
                  View details
                </Link>
              </Button>
            ) : null}
          </form>
          {lookupCustomer ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Selling to <span className="font-medium text-foreground">{lookupCustomer.fullName}</span>
            </p>
          ) : customerId != null && !isLookupLoading ? (
            <p className="mt-3 text-sm text-amber-700">
              Customer ID {customerId} was not found in invoice lookups. You can still enter a vehicle ID manually.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sell a part</CardTitle>
          <CardDescription>Creates a sales invoice and updates stock.</CardDescription>
        </CardHeader>
        <CardContent>
          {lookupError ? (
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>Lookups unavailable</AlertTitle>
              <AlertDescription>{lookupError}</AlertDescription>
            </Alert>
          ) : null}
          {isLookupLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading parts…
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSell}>
              <div className="grid gap-2">
                <Label htmlFor="sale-part">Part</Label>
                <Select onValueChange={setPartId} value={partId}>
                  <SelectTrigger id="sale-part">
                    <SelectValue placeholder="Select part" />
                  </SelectTrigger>
                  <SelectContent>
                    {(lookups?.parts ?? []).map((p) => (
                      <SelectItem key={p.partId} value={String(p.partId)}>
                        {p.partName} · {p.brand} · {formatCurrency(p.unitPrice)} · stock {p.stockQty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sale-vehicle">Vehicle (for sale record)</Label>
                {lookupCustomer?.vehicles.length ? (
                  <Select onValueChange={setVehicleId} value={vehicleId}>
                    <SelectTrigger id="sale-vehicle">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookupCustomer.vehicles.map((v) => (
                        <SelectItem key={v.vehicleId} value={String(v.vehicleId)}>
                          {v.vehicleNumber} · {v.make} {v.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <Input
                      autoComplete="off"
                      disabled={customerId == null}
                      id="sale-vehicle"
                      inputMode="numeric"
                      onChange={(e) => setVehicleId(e.target.value)}
                      placeholder="Enter vehicle ID"
                      value={vehicleId}
                    />
                    <p className="text-xs text-muted-foreground">
                      Select a customer first, or enter the numeric vehicle ID manually.
                    </p>
                  </>
                )}
              </div>

              <div className="grid gap-2 sm:max-w-[200px]">
                <Label htmlFor="sale-qty">Quantity</Label>
                <Input
                  id="sale-qty"
                  inputMode="numeric"
                  min={1}
                  onChange={(e) => setQuantity(e.target.value)}
                  type="number"
                  value={quantity}
                />
              </div>

              {sellMessage ? (
                <Alert
                  variant={
                    sellMessage === 'Sale completed successfully' ? 'default' : 'destructive'
                  }
                >
                  <AlertTitle>Sale result</AlertTitle>
                  <AlertDescription>{sellMessage}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                disabled={isSelling || customerId == null || !lookups?.parts.length}
                type="submit"
              >
                {isSelling ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  'Complete sale'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </PageSection>
  )
}
