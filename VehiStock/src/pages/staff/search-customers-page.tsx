import * as React from 'react'
import { Loader2, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  listCustomers,
  type StaffCustomerSearchField,
} from '@/features/staff-customer-sales/api/customer-desk-api'
import type { CustomerDeskDetails } from '@/features/staff-customer-sales/types/customer-desk'
import {
  errorMessage,
  filterCustomers,
  SEARCH_FIELDS,
} from '@/features/staff-customer-sales/utils/customer-desk-ui'

export function SearchCustomersPage() {
  const [searchField, setSearchField] = React.useState<StaffCustomerSearchField>('fullname')
  const [searchValue, setSearchValue] = React.useState('')
  const [allCustomers, setAllCustomers] = React.useState<CustomerDeskDetails[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const displayedCustomers = React.useMemo(
    () => filterCustomers(allCustomers, searchField, searchValue),
    [allCustomers, searchField, searchValue],
  )

  React.useEffect(() => {
    let cancelled = false

    async function loadAll() {
      try {
        setLoadError(null)
        setIsLoading(true)
        const rows = await listCustomers()
        if (!cancelled) {
          setAllCustomers(rows)
        }
      } catch (error) {
        if (!cancelled) {
          setAllCustomers([])
          setLoadError(errorMessage(error, 'Unable to load customers.'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadAll()
    return () => {
      cancelled = true
    }
  }, [])

  function handleSearch(event: React.FormEvent) {
    event.preventDefault()
  }

  const emptyMessage = isLoading
    ? 'Loading customers…'
    : loadError
      ? null
      : allCustomers.length === 0
        ? 'No customers registered yet.'
        : displayedCustomers.length === 0
          ? 'No customers match your search.'
          : null

  return (
    <PageSection
      description="All customers are listed below. Use search to filter by name, phone, vehicle number, ID, or email."
      title="Search customers"
    >
      <Card>
        <CardHeader>
          <CardTitle>Find customer</CardTitle>
          <CardDescription>
            The full list loads automatically. Enter a value and search to filter, or clear the
            value to show everyone again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSearch}>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,160px)_1fr] sm:items-end">
              <div className="grid gap-2">
                <Label htmlFor="search-field">Search by</Label>
                <Select
                  onValueChange={(v) => setSearchField(v as StaffCustomerSearchField)}
                  value={searchField}
                >
                  <SelectTrigger id="search-field">
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEARCH_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="search-value">Value</Label>
                <div className="flex gap-2">
                  <Input
                    autoComplete="off"
                    id="search-value"
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={
                      searchField === 'customerId'
                        ? 'e.g. 12'
                        : searchField === 'emailID'
                          ? 'name@example.com'
                          : 'Filter list…'
                    }
                    value={searchValue}
                  />
                  <Button className="shrink-0 gap-2" disabled={isLoading} type="submit">
                    <Search className="size-4" />
                    <span className="hidden sm:inline">Search</span>
                  </Button>
                </div>
              </div>
            </div>
            {loadError ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            ) : null}
          </form>

          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={6}>
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Loading customers…
                      </span>
                    </TableCell>
                  </TableRow>
                ) : emptyMessage ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={6}>
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedCustomers.map((row) => (
                    <TableRow key={row.customerId}>
                      <TableCell className="font-medium">{row.customerId}</TableCell>
                      <TableCell>{row.fullname}</TableCell>
                      <TableCell>{row.phone || '—'}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{row.email || '—'}</TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {row.vehicles?.length ? row.vehicles.join(', ') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to={ROUTE_PATHS.staff.customerDetailsWithId(row.customerId)}>
                              Details
                            </Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link to={ROUTE_PATHS.staff.sellPartsWithId(row.customerId)}>
                              Sell
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageSection>
  )
}
