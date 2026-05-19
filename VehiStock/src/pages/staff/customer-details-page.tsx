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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageSection } from '@/components/shared/page-section'
import {
  getCustomerDetails,
  getCustomerHistory,
} from '@/features/staff-customer-sales/api/customer-desk-api'
import type {
  CustomerDeskDetails,
  CustomerDeskHistory,
} from '@/features/staff-customer-sales/types/customer-desk'
import {
  errorMessage,
  formatCurrency,
  parseCustomerIdParam,
} from '@/features/staff-customer-sales/utils/customer-desk-ui'
import { formatDateTime } from '@/lib/date'

export function CustomerDetailsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const customerId = parseCustomerIdParam(searchParams.get('customerId'))
  const [customerIdInput, setCustomerIdInput] = React.useState(
    customerId != null ? String(customerId) : '',
  )

  const [details, setDetails] = React.useState<CustomerDeskDetails | null>(null)
  const [history, setHistory] = React.useState<CustomerDeskHistory[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (customerId == null) {
      setDetails(null)
      setHistory([])
      setLoadError(null)
      return
    }

    const id = customerId
    let cancelled = false

    async function load() {
      try {
        setLoadError(null)
        setIsLoading(true)
        const [nextDetails, nextHistory] = await Promise.all([
          getCustomerDetails(id),
          getCustomerHistory(id),
        ])
        if (!cancelled) {
          setDetails(nextDetails)
          setHistory(nextHistory)
        }
      } catch (error) {
        if (!cancelled) {
          setDetails(null)
          setHistory([])
          setLoadError(errorMessage(error, 'Unable to load customer.'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [customerId])

  function handleLoadCustomer(event: React.FormEvent) {
    event.preventDefault()
    const id = parseCustomerIdParam(customerIdInput)
    if (id == null) {
      setLoadError('Enter a valid customer ID.')
      return
    }

    setSearchParams({ customerId: String(id) })
  }

  return (
    <PageSection
      description="View customer profile, registered vehicles, and part purchase history."
      title="Customer details"
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Load customer</CardTitle>
          <CardDescription>
            Enter a customer ID or use{' '}
            <Link className="text-primary underline" to={ROUTE_PATHS.staff.searchCustomers}>
              Search customers
            </Link>{' '}
            to find one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={handleLoadCustomer}>
            <div className="grid gap-2">
              <Label htmlFor="customer-id">Customer ID</Label>
              <Input
                autoComplete="off"
                id="customer-id"
                inputMode="numeric"
                onChange={(e) => setCustomerIdInput(e.target.value)}
                placeholder="e.g. 12"
                value={customerIdInput}
              />
            </div>
            <Button type="submit">Load</Button>
            {customerId != null ? (
              <Button asChild variant="outline">
                <Link to={ROUTE_PATHS.staff.sellPartsWithId(customerId)}>Sell parts</Link>
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      {customerId == null ? (
        <p className="text-sm text-muted-foreground">No customer selected.</p>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading customer…
        </div>
      ) : loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load customer</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer profile</CardTitle>
              <CardDescription>Details and registered vehicles.</CardDescription>
            </CardHeader>
            <CardContent>
              {details ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Customer ID</dt>
                    <dd className="font-medium">{details.customerId}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{details.phone}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{details.fullname}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Vehicle numbers on file</dt>
                    <dd className="font-medium">
                      {details.vehicles?.length ? details.vehicles.join(', ') : '—'}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase history</CardTitle>
              <CardDescription>Prior part sales for this customer.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Part</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-muted-foreground" colSpan={4}>
                        No purchase history for this customer.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((line, index) => (
                      <TableRow key={`${line.date}-${index}`}>
                        <TableCell>{formatDateTime(line.date)}</TableCell>
                        <TableCell>{line.partName}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(line.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </PageSection>
  )
}
