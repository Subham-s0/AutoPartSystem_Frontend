import * as React from 'react'
import {
  CalendarDays,
  CarFront,
  History,
  Star,
  Wrench,
  CreditCard,
  Clock,
  Car,
  PackageSearch,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
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
import { PageSection } from '@/components/shared/page-section'
import {
  getCustomerDashboardSummary,
  type CustomerDashboardResponse,
} from '@/features/dashboard/api/customer-dashboard-api'
import { formatCurrency } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import { ApiError } from '@/types/api'

const customerRoutes = [
  {
    title: 'My vehicles',
    description: 'Review the vehicles linked to your account.',
    icon: CarFront,
    href: ROUTE_PATHS.customer.vehicles,
    gradient: 'from-emerald-400 to-emerald-600',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    title: 'Book appointment',
    description: 'Schedule your next workshop visit.',
    icon: CalendarDays,
    href: ROUTE_PATHS.customer.bookAppointment,
    gradient: 'from-blue-400 to-blue-600',
    accent: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: 'Part requests',
    description: 'Request parts that are not currently available.',
    icon: Wrench,
    href: ROUTE_PATHS.customer.partRequests,
    gradient: 'from-purple-400 to-purple-600',
    accent: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    title: 'History',
    description: 'View purchase and service records in one place.',
    icon: History,
    href: ROUTE_PATHS.customer.history,
    gradient: 'from-amber-400 to-amber-600',
    accent: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    title: 'Reviews',
    description: 'Submit feedback for completed services.',
    icon: Star,
    href: ROUTE_PATHS.customer.reviews,
    gradient: 'from-rose-400 to-rose-600',
    accent: 'text-rose-600',
    bg: 'bg-rose-50',
  },
]

function getActivityMeta(type: string) {
  switch (type) {
    case 'Payment':
      return { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' }
    case 'Appointment':
      return { icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' }
    case 'Service':
      return { icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50' }
    default:
      return { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-50' }
  }
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-900">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function CustomerDashboardPage() {
  const [data, setData] = React.useState<CustomerDashboardResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadSummary = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const summary = await getCustomerDashboardSummary()
      setData(summary)
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Unable to retrieve dashboard insights.',
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
      description="Your personalized overview of vehicles, spending, and recent activity."
      title="Customer Overview"
      actions={
        <Button
          type="button"
          onClick={() => void loadSummary()}
          variant="outline"
          className="flex items-center gap-2 border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 rounded-full shadow-sm"
          disabled={isLoading}
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Error banner */}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900 rounded-xl">
            <AlertTitle className="font-semibold flex items-center gap-2">
              <AlertCircle className="size-4" />
              Connection Error
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse h-28 border-gray-100 rounded-2xl" />
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-5">
              <Card className="animate-pulse h-72 border-gray-100 rounded-2xl md:col-span-3" />
              <Card className="animate-pulse h-72 border-gray-100 rounded-2xl md:col-span-2" />
            </div>
          </div>
        ) : (
          data && (
            <>
              {/* KPI cards */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {/* Active Vehicles */}
                <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400 to-emerald-600" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Active Vehicles
                    </CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-gray-900 mt-1">
                      {data.kpis.activeVehiclesCount}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <Link
                      to={ROUTE_PATHS.customer.vehicles}
                      className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Car className="size-3.5" />
                      View my vehicles <ArrowRight className="size-3" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Upcoming Appointments */}
                <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-400 to-blue-600" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Upcoming Appointments
                    </CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-gray-900 mt-1 flex items-baseline gap-1">
                      {data.kpis.upcomingAppointmentsCount}
                      <span className="text-sm font-semibold text-gray-400">scheduled</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <Link
                      to={ROUTE_PATHS.customer.bookAppointment}
                      className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Clock className="size-3.5" />
                      Manage bookings <ArrowRight className="size-3" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Outstanding Balance */}
                <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-400 to-amber-600" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Outstanding Balance
                    </CardDescription>
                    <CardTitle className="text-2xl font-extrabold text-gray-900 mt-1">
                      {formatCurrency(data.kpis.outstandingBalance)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <Link
                      to={ROUTE_PATHS.customer.payments}
                      className="text-xs text-amber-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <CreditCard className="size-3.5" />
                      View payments <ArrowRight className="size-3" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Pending Part Requests */}
                <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-400 to-purple-600" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Pending Requests
                    </CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-gray-900 mt-1 flex items-baseline gap-1">
                      {data.kpis.pendingPartRequestsCount}
                      <span className="text-sm font-semibold text-gray-400">active</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <Link
                      to={ROUTE_PATHS.customer.partRequests}
                      className="text-xs text-purple-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <PackageSearch className="size-3.5" />
                      Track requests <ArrowRight className="size-3" />
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Spending chart and recent activity */}
              <div className="grid gap-6 md:grid-cols-5">
                {/* Spending Trend Chart */}
                <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden md:col-span-3">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-gray-800 font-bold">
                      <TrendingUp className="size-4.5 text-emerald-600" />
                      Annual Spending Trend
                    </CardTitle>
                    <CardDescription>
                      Your combined parts and service spending over the past 12 months.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 pb-4 pr-6 pl-2">
                    {data.spendingTrend.every((m) => m.amount === 0) ? (
                      <div className="flex items-center justify-center h-52 text-xs text-muted-foreground">
                        No spending data recorded in the last 12 months.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.spendingTrend} barCategoryGap="20%">
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f4f0" />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: '#9dab9d' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#9dab9d' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) =>
                              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                            }
                            width={42}
                          />
                          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(46, 160, 94, 0.06)' }} />
                          <Bar
                            dataKey="amount"
                            radius={[6, 6, 0, 0]}
                            fill="url(#barGradient)"
                            maxBarSize={36}
                          />
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2ea05e" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#97c459" stopOpacity={0.7} />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity Feed */}
                <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden md:col-span-2 flex flex-col">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-gray-800 font-bold">
                      <Activity className="size-4.5 text-blue-600" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Your latest payments, bookings, and services.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 py-3 px-4">
                    {data.recentActivities.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground py-12">
                        No recent activity to display.
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-gray-50">
                        {data.recentActivities.map((act, idx) => {
                          const meta = getActivityMeta(act.type)
                          return (
                            <div key={idx} className="flex items-start gap-3 py-3">
                              <div
                                className={`size-8 flex items-center justify-center rounded-lg ${meta.bg} ${meta.color} flex-shrink-0 mt-0.5`}
                              >
                                <meta.icon className="size-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">
                                  {act.description}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {formatDateTime(act.date)}
                                </p>
                              </div>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${meta.color} flex-shrink-0`}
                              >
                                {act.type}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )
        )}

        {/* Quick navigation */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {customerRoutes.map((route) => (
              <Link
                key={route.title}
                className="info-card border border-gray-100 bg-white p-5 rounded-2xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-gray-200 block"
                to={route.href}
              >
                <div
                  className={`size-10 flex items-center justify-center rounded-xl ${route.bg} ${route.accent} mb-3`}
                >
                  <route.icon className="size-5" />
                </div>
                <div className="font-bold text-gray-900 text-sm mb-1">{route.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{route.description}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageSection>
  )
}
