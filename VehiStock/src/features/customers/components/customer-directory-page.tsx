import * as React from 'react'
import {
  CarFront,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageSection } from '@/components/shared/page-section'
import { PaginationFooter } from '@/components/shared/pagination-footer'
import { registerCustomer } from '@/features/auth/api/auth-api'
import { getManagedCustomerDetail, searchManagedCustomers } from '@/features/customers/api/customers-api'
import type { CustomerDirectoryDetail, CustomerDirectoryItem } from '@/features/customers/types/customer-directory'
import { createVehicleForCustomer } from '@/features/vehicles/api/vehicles-api'
import { formatDateOnly } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError } from '@/types/api'

interface CustomerDirectoryPageProps {
  scope: 'admin' | 'staff'
  title: string
  description: string
  allowCreate?: boolean
}

interface RegisterCustomerFormState {
  fullName: string
  email: string
  password: string
  phoneNumber: string
  address: string
  vehicleNumber: string
  make: string
  model: string
  manufactureYear: string
  mileageKm: string
}

const initialRegisterForm: RegisterCustomerFormState = {
  fullName: '',
  email: '',
  password: '',
  phoneNumber: '',
  address: '',
  vehicleNumber: '',
  make: '',
  model: '',
  manufactureYear: String(new Date().getFullYear()),
  mileageKm: '0',
}

function CustomerRegistrationDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void> | void
}) {
  const [form, setForm] = React.useState<RegisterCustomerFormState>(initialRegisterForm)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  function update<K extends keyof RegisterCustomerFormState>(key: K, value: RegisterCustomerFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await registerCustomer({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber || undefined,
        address: form.address,
      })

      if (!result.succeeded || !result.customerId) {
        throw new Error(result.errors?.join(' ') || 'Customer registration failed.')
      }

      await createVehicleForCustomer(result.customerId, {
        vehicleNumber: form.vehicleNumber,
        make: form.make,
        model: form.model,
        manufactureYear: Number(form.manufactureYear),
        mileageKm: Number(form.mileageKm),
        engineNo: '',
        chassisNo: '',
        notes: '',
      })

      toast.success('Customer profile created successfully.')
      setForm(initialRegisterForm)
      onOpenChange(false)
      await onSuccess()
    } catch (error) {
      toast.error(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Unable to register customer.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Register customer</DialogTitle>
          <DialogDescription>
            Create a customer account and capture the primary vehicle in one flow.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="customer-full-name">Full name</Label>
              <Input
                id="customer-full-name"
                onChange={(event) => update('fullName', event.target.value)}
                required
                value={form.fullName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                onChange={(event) => update('email', event.target.value)}
                required
                type="email"
                value={form.email}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-password">Password</Label>
              <Input
                id="customer-password"
                minLength={8}
                onChange={(event) => update('password', event.target.value)}
                required
                type="password"
                value={form.password}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Phone number</Label>
              <Input
                id="customer-phone"
                onChange={(event) => update('phoneNumber', event.target.value)}
                value={form.phoneNumber}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                onChange={(event) => update('address', event.target.value)}
                required
                value={form.address}
              />
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-foreground">Primary vehicle</h3>
              <p className="text-xs text-muted-foreground">
                This keeps the customer usable for sales invoices immediately after creation.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicle-number">Vehicle number</Label>
              <Input
                id="vehicle-number"
                onChange={(event) => update('vehicleNumber', event.target.value)}
                required
                value={form.vehicleNumber}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicle-make">Make</Label>
              <Input
                id="vehicle-make"
                onChange={(event) => update('make', event.target.value)}
                required
                value={form.make}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicle-model">Model</Label>
              <Input
                id="vehicle-model"
                onChange={(event) => update('model', event.target.value)}
                required
                value={form.model}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicle-year">Manufacture year</Label>
              <Input
                id="vehicle-year"
                onChange={(event) => update('manufactureYear', event.target.value)}
                required
                type="number"
                value={form.manufactureYear}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicle-mileage">Mileage (km)</Label>
              <Input
                id="vehicle-mileage"
                min="0"
                onChange={(event) => update('mileageKm', event.target.value)}
                required
                type="number"
                value={form.mileageKm}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Creating customer...' : 'Create customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CustomerDetailDialog({
  customerId,
  open,
  onOpenChange,
  scope,
}: {
  customerId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  scope: 'admin' | 'staff'
}) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [detail, setDetail] = React.useState<CustomerDirectoryDetail | null>(null)

  React.useEffect(() => {
    if (!open || !customerId) {
      return
    }

    const targetCustomerId = customerId
    let cancelled = false

    async function loadDetail() {
      try {
        setIsLoading(true)
        setError(null)
        const result = await getManagedCustomerDetail(scope, targetCustomerId)
        if (!cancelled) {
          setDetail(result)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError || loadError instanceof Error
              ? loadError.message
              : 'Unable to load customer profile.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDetail()
    return () => {
      cancelled = true
    }
  }, [customerId, open, scope])

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Customer profile</DialogTitle>
          <DialogDescription>
            Detailed account, vehicle, invoice, and payment view for the selected customer.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : detail ? (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Account overview</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <UserRound className="size-4 text-primary" />
                      {detail.fullName}
                    </div>
                    <p className="text-xs text-muted-foreground">Customer ID #{detail.customerId}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-4" />
                      {detail.email}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-4" />
                      {detail.phoneNumber || 'No phone number'}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4" />
                      {detail.address}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total spent</CardDescription>
                    <CardTitle className="text-xl">{formatCurrency(detail.reportSnapshot.totalSpent)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Outstanding balance</CardDescription>
                    <CardTitle className="text-xl">{formatCurrency(detail.reportSnapshot.outstandingBalance)}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>

              <TabsContent className="space-y-4" value="overview">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card><CardHeader className="pb-2"><CardDescription>Vehicles</CardDescription><CardTitle>{detail.reportSnapshot.totalVehicles}</CardTitle></CardHeader></Card>
                  <Card><CardHeader className="pb-2"><CardDescription>Invoices</CardDescription><CardTitle>{detail.reportSnapshot.totalInvoices}</CardTitle></CardHeader></Card>
                  <Card><CardHeader className="pb-2"><CardDescription>Total paid</CardDescription><CardTitle>{formatCurrency(detail.reportSnapshot.totalPaid)}</CardTitle></CardHeader></Card>
                  <Card><CardHeader className="pb-2"><CardDescription>Last invoice</CardDescription><CardTitle className="text-base">{detail.reportSnapshot.lastInvoiceDate ? formatDateOnly(detail.reportSnapshot.lastInvoiceDate) : 'N/A'}</CardTitle></CardHeader></Card>
                </div>
              </TabsContent>

              <TabsContent value="vehicles">
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Mileage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.vehicles.map((vehicle) => (
                          <TableRow key={vehicle.vehicleId}>
                            <TableCell className="font-medium">{vehicle.vehicleNumber}</TableCell>
                            <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                            <TableCell>{vehicle.manufactureYear}</TableCell>
                            <TableCell>{vehicle.mileageKm.toLocaleString()} km</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invoices">
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.salesInvoices.length ? detail.salesInvoices.map((invoice) => (
                          <TableRow key={invoice.salesInvoiceId}>
                            <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                            <TableCell>{formatDateOnly(invoice.invoiceDate)}</TableCell>
                            <TableCell>{invoice.vehicleNumber}</TableCell>
                            <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                            <TableCell>{formatCurrency(invoice.balanceDue)}</TableCell>
                            <TableCell><Badge variant="outline">{invoice.paymentStatus}</Badge></TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell className="text-muted-foreground" colSpan={6}>No invoices available.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.payments.length ? detail.payments.map((payment) => (
                          <TableRow key={payment.paymentId}>
                            <TableCell className="font-medium">#{payment.paymentId}</TableCell>
                            <TableCell>{formatDateOnly(payment.paymentDate)}</TableCell>
                            <TableCell>{payment.invoiceNo || 'N/A'}</TableCell>
                            <TableCell>{payment.paymentType}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell className="text-muted-foreground" colSpan={5}>No payments available.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function CustomerDirectoryPage({
  scope,
  title,
  description,
  allowCreate = true,
}: CustomerDirectoryPageProps) {
  const [customers, setCustomers] = React.useState<CustomerDirectoryItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchText, setSearchText] = React.useState('')
  const [appliedSearch, setAppliedSearch] = React.useState('')
  const [pageNumber, setPageNumber] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalRecords, setTotalRecords] = React.useState(0)
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<number | null>(null)
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false)

  const pageSize = 10

  const loadCustomers = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await searchManagedCustomers(scope, pageNumber, pageSize, appliedSearch || undefined)
      setCustomers(response.items)
      setTotalPages(response.totalPages)
      setTotalRecords(response.totalRecords)
    } catch (loadError) {
      setError(
        loadError instanceof ApiError || loadError instanceof Error
          ? loadError.message
          : 'Unable to load customers.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, pageNumber, scope])

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadCustomers()
    })
  }, [loadCustomers])

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPageNumber(1)
    setAppliedSearch(searchText.trim())
  }

  return (
    <PageSection description={description} title={title}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total customers</CardDescription>
              <CardTitle>{totalRecords}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Customers on this page</CardDescription>
              <CardTitle>{customers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Registered vehicles</CardDescription>
              <CardTitle>{customers.reduce((sum, customer) => sum + customer.vehicles.length, 0)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Directory</CardTitle>
                <CardDescription>
                  Search customers, open their profile, and review invoice or payment context.
                </CardDescription>
              </div>
              {allowCreate ? (
                <Button onClick={() => setIsRegisterOpen(true)} type="button">
                  <Plus className="size-4" />
                  Add customer
                </Button>
              ) : null}
            </div>

            <form className="relative" onSubmit={handleSearchSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by customer, vehicle, phone, address, or email"
                value={searchText}
              />
            </form>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length ? customers.map((customer) => (
                  <TableRow key={customer.customerId}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{customer.fullName}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">#{customer.customerId}</Badge>
                          <span>{customer.registrationSource}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="size-3.5" />
                          {customer.phoneNumber || 'No phone'}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5" />
                          {customer.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {customer.vehicles.length ? customer.vehicles.slice(0, 3).map((vehicle) => (
                          <Badge key={vehicle.vehicleId} variant="secondary">
                            <CarFront className="mr-1 size-3" />
                            {vehicle.vehicleNumber}
                          </Badge>
                        )) : (
                          <span className="text-sm text-muted-foreground">No vehicles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateOnly(customer.registeredAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => setSelectedCustomerId(customer.customerId)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Eye className="size-4" />
                        View profile
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          Loading customers...
                        </span>
                      ) : (
                        'No customers matched the current filters.'
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <PaginationFooter
              isLoading={isLoading}
              itemCount={customers.length}
              onNext={() => setPageNumber((current) => current + 1)}
              onPrevious={() => setPageNumber((current) => Math.max(1, current - 1))}
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalPages={totalPages}
              totalRecords={totalRecords}
            />
          </CardContent>
        </Card>

        <CustomerRegistrationDialog
          onOpenChange={setIsRegisterOpen}
          onSuccess={loadCustomers}
          open={isRegisterOpen}
        />

        <CustomerDetailDialog
          customerId={selectedCustomerId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCustomerId(null)
            }
          }}
          open={selectedCustomerId !== null}
          scope={scope}
        />
      </div>
    </PageSection>
  )
}
