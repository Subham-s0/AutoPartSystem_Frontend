import * as React from 'react'
import { CalendarDays, ShoppingCart, Users, ClipboardList, Boxes, Landmark, AlertCircle, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageSection } from '@/components/shared/page-section'
import { getStaffDashboardSummary, type StaffDashboardResponse } from '@/features/reports/api/staff-dashboard-api'
import { formatDateOnly } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError } from '@/types/api'

const staffModules = [
  {
    title: 'Customer sales',
    description: 'Counter sales and walk-in order handling.',
    icon: ShoppingCart,
    href: ROUTE_PATHS.staff.customerSales,
    color: 'border-emerald-200 hover:border-emerald-500',
  },
  {
    title: 'Appointments',
    description: 'Workshop scheduling and service queue handling.',
    icon: CalendarDays,
    href: ROUTE_PATHS.staff.appointments,
    color: 'border-blue-200 hover:border-blue-500',
  },
  {
    title: 'Sales invoices',
    description: 'Invoice creation and payment workflow.',
    icon: ClipboardList,
    href: ROUTE_PATHS.staff.salesInvoices,
    color: 'border-purple-200 hover:border-purple-500',
  },
  {
    title: 'Customer reports',
    description: 'Regular buyers, high spenders, and pending credits.',
    icon: Users,
    href: ROUTE_PATHS.staff.customerReports,
    color: 'border-amber-200 hover:border-amber-500',
  },
]

export function StaffDashboardPage() {
  const [data, setData] = React.useState<StaffDashboardResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadSummary = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const summary = await getStaffDashboardSummary()
      setData(summary)
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Unable to retrieve dashboard summary metrics.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadSummary()
    })
  }, [loadSummary])

  return (
    <PageSection
      description="Business analytics, low-stock reorder warnings, and workshop schedule entries."
      title="Staff Portal Overview"
      actions={
        <Button
          type="button"
          onClick={() => void loadSummary()}
          variant="outline"
          className="flex items-center gap-2 border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 rounded-full shadow-sm"
          disabled={isLoading}
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Error Banner */}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900 rounded-xl">
            <AlertTitle className="font-semibold flex items-center gap-2">
              <AlertCircle className="size-4" />
              Connection Error
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse h-28 border-gray-100 rounded-2xl" />
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="animate-pulse h-64 border-gray-100 rounded-2xl" />
              <Card className="animate-pulse h-64 border-gray-100 rounded-2xl" />
            </div>
          </div>
        ) : (
          data && (
            <>
              {/* Premium KPI Cards */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {/* Daily Revenue */}
                <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400 to-emerald-600" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Revenue</CardDescription>
                    <CardTitle className="text-2xl font-extrabold text-gray-900 mt-1">
                      {formatCurrency(data.todayRevenue)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                      <TrendingUp className="size-3.5" />
                      {data.todaySalesInvoiceCount} sales recorded today
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Service Bookings */}
                <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-400 to-blue-600" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Bookings</CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-gray-900 mt-1 flex items-baseline gap-1">
                      {data.pendingServiceAppointments}
                      <span className="text-sm font-semibold text-gray-400">active</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <Link to={ROUTE_PATHS.staff.appointments} className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1">
                      Manage booking board <ArrowRight className="size-3" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Parts in Catalog */}
                <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-400 to-purple-600" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Parts Catalog</CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-gray-900 mt-1">
                      {data.totalPartsInCatalog}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                      <Boxes className="size-3.5" />
                      Active inventory stock items
                    </div>
                  </CardContent>
                </Card>

                {/* Active Customers */}
                <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-400 to-amber-600" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Customers</CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-gray-900 mt-1">
                      {data.totalActiveCustomers}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <Users className="size-3.5" />
                      Registered customer accounts
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Invoices and Stock alerts Tables */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Invoices */}
                <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-gray-800 font-bold">
                      <Landmark className="size-4.5 text-emerald-600" />
                      Recent Sales Invoices
                    </CardTitle>
                    <CardDescription>Latest finalized consumer and workshop invoice summaries.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                    <Table>
                      <TableHeader className="bg-gray-50/30">
                        <TableRow>
                          <TableHead className="font-semibold text-xs text-gray-700">Invoice No</TableHead>
                          <TableHead className="font-semibold text-xs text-gray-700">Customer</TableHead>
                          <TableHead className="font-semibold text-xs text-gray-700">Date</TableHead>
                          <TableHead className="font-semibold text-xs text-gray-700 text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentSalesInvoices && data.recentSalesInvoices.length > 0 ? (
                          data.recentSalesInvoices.map((inv) => (
                            <TableRow key={inv.salesInvoiceId} className="hover:bg-gray-50/30 transition-colors">
                              <TableCell className="font-mono text-xs font-semibold text-gray-700">{inv.invoiceNo}</TableCell>
                              <TableCell className="font-medium text-gray-800 text-xs">{inv.customerName}</TableCell>
                              <TableCell className="text-gray-600 text-xs">{formatDateOnly(inv.invoiceDate)}</TableCell>
                              <TableCell className="font-bold text-gray-900 text-xs text-right">{formatCurrency(inv.totalAmount)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-28 text-center text-xs text-muted-foreground">
                              No invoices created today yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Low Stock Warning */}
                <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <CardHeader className="bg-red-50/10 border-b border-red-50/30 pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-red-800 font-bold">
                      <AlertCircle className="size-4.5 text-red-500 animate-pulse" />
                      Critical Stock Warnings
                    </CardTitle>
                    <CardDescription>Parts in inventory running below reorder threshold.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                    <Table>
                      <TableHeader className="bg-gray-50/30">
                        <TableRow>
                          <TableHead className="font-semibold text-xs text-gray-700">Part Name</TableHead>
                          <TableHead className="font-semibold text-xs text-gray-700">Brand</TableHead>
                          <TableHead className="font-semibold text-xs text-gray-700 text-right">Qty Remaining</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.lowStockParts && data.lowStockParts.length > 0 ? (
                          data.lowStockParts.map((part) => (
                            <TableRow key={part.partId} className="hover:bg-red-50/10 transition-colors">
                              <TableCell className="font-medium text-gray-800 text-xs">{part.partName}</TableCell>
                              <TableCell className="text-gray-600 text-xs">{part.brand}</TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-red-100 text-red-800 border-red-200 font-semibold hover:bg-red-100">
                                  {part.stockQty} left
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-28 text-center text-xs text-muted-foreground">
                              No low-stock parts warnings. All catalogs are healthy!
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )
        )}

        {/* Quick Nav Modules Grid */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Quick Actions Portal</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {staffModules.map((module) => (
              <Link
                key={module.title}
                className={`info-card border border-gray-100 bg-white p-5 rounded-2xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-gray-200 block`}
                to={module.href}
              >
                <div className={`info-card-icon size-10 flex items-center justify-center rounded-xl bg-gray-50 text-[var(--vs-green-600)] mb-3`}>
                  <module.icon className="size-5" />
                </div>
                <div className="font-bold text-gray-900 text-sm mb-1">{module.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{module.description}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageSection>
  )
}
