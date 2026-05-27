import * as React from 'react'
import {
  AlertTriangle,
  BarChart2,
  Bell,
  Boxes,
  ClipboardList,
  ShoppingCart,
  Users,
  Wrench,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Boxes,
  ClipboardList,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  Activity,
  Loader2,
  Wrench,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { ROUTE_PATHS } from '@/app/config/routes'
import { getDashboardSummary } from '@/features/reports/api/analytics-api'
import type { DashboardSummary } from '@/features/reports/api/analytics-api'
import { ApiError } from '@/types/api'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Quick-access module cards ────────────────────────────────────────────────
const adminModules = [
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getDashboardSummary, type DashboardSummary } from '../../api/dashboard-api'

const navModules = [
  {
    title: 'Inventory',
    description: 'Parts, stock movement, and reorder controls.',
    icon: Boxes,
    href: ROUTE_PATHS.admin.inventory,
    color: 'from-emerald-500/10 to-teal-500/5 text-emerald-600 border-emerald-500/20',
    colorClass: 'bg-emerald-50 text-emerald-700',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'Purchase Invoices',
    description: 'Manage part purchases and vendor bills.',
    icon: Receipt,
    href: '/admin/purchase-invoices',
    colorClass: 'bg-indigo-50 text-indigo-700',
    iconColor: 'text-indigo-600',
  },
  {
    title: 'Analytics',
    description: 'Business metrics and performance charts.',
    icon: TrendingUp,
    href: '/admin/analytics',
    colorClass: 'bg-blue-50 text-blue-700',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Staff access',
    description: 'Staff registration and access control.',
    icon: Users,
    href: ROUTE_PATHS.admin.staff,
    color: 'from-blue-500/10 to-cyan-500/5 text-blue-600 border-blue-500/20',
    colorClass: 'bg-indigo-50 text-indigo-700',
    iconColor: 'text-indigo-600',
  },
  {
    title: 'Part Requests',
    description: 'Review and update customer part requests.',
    icon: Wrench,
    href: ROUTE_PATHS.admin.partRequests,
    color: 'from-indigo-500/10 to-violet-500/5 text-indigo-600 border-indigo-500/20',
    colorClass: 'bg-purple-50 text-purple-700',
    iconColor: 'text-purple-600',
  },
  {
    title: 'Reports',
    description: 'Business, financial, and operational reporting.',
    icon: ClipboardList,
    href: ROUTE_PATHS.admin.reports,
    color: 'from-amber-500/10 to-orange-500/5 text-amber-600 border-amber-500/20',
    colorClass: 'bg-amber-50 text-amber-700',
    iconColor: 'text-amber-600',
  },
  {
    title: 'Alerts',
    description: 'Low-stock and overdue-credit notifications.',
    icon: Bell,
    href: ROUTE_PATHS.admin.notifications,
    color: 'from-rose-500/10 to-pink-500/5 text-rose-600 border-rose-500/20',
    colorClass: 'bg-rose-50 text-rose-700',
    iconColor: 'text-rose-600',
  },
]

// ─── Premium Custom Tooltip ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--vs-surface)] border border-[var(--vs-border)] rounded-xl shadow-lg p-3 text-xs">
        <p className="font-bold text-[var(--vs-text)] mb-1">{payload[0].payload.month}</p>
        <div className="flex items-center gap-2 text-emerald-600 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Purchases: Rs {payload[0].value.toLocaleString()}</span>
        </div>
      </div>
    )
  }
  return null
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function DashboardStat({
  label,
  value,
  icon: Icon,
  accentClass,
  iconBg,
  href,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  accentClass: string
  iconBg: string
  href?: string
}) {
  const inner = (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-[var(--vs-muted)] uppercase tracking-wider">{label}</span>
        <span className="text-3xl font-extrabold text-[var(--vs-text)] tracking-tight tabular-nums mt-1">{value}</span>
      </div>
      <div className={`p-3 rounded-2xl ${iconBg} ${accentClass} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={22} className="stroke-[2.2]" />
      </div>
    </div>
  )

  const cardClasses = "group p-6 bg-white rounded-2xl shadow-sm border border-[var(--vs-border)] transition-all duration-300 hover:shadow-md hover:border-[var(--primary)] hover:-translate-y-0.5"

  if (href) {
    return (
      <Link to={href} className={cardClasses}>
        {inner}
      </Link>
    )
  }
  return (
    <div className={cardClasses}>
      {inner}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    getDashboardSummary()
      .then((data) => { if (mounted) setSummary(data) })
      .catch((err) => {
        if (!mounted) return
        setError(
          err instanceof ApiError || err instanceof Error
            ? err.message
            : 'Failed to load dashboard summary.',
        )
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  // Format monthly data for Recharts
  const chartData = React.useMemo(() => {
    if (!summary?.monthlyPurchases) return []
    return summary.monthlyPurchases.map(m => ({
      month: m.month.replace('Month ', 'Month '),
      amount: m.amount
    }))
  }, [summary])

  return (
    <div className="container mx-auto px-4 py-6 flex flex-col gap-6">
      
      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#155c35] to-[#1e7a46] rounded-3xl p-6 sm:p-8 text-white shadow-md flex justify-between items-center">
        {/* Glowing radial backdrops */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome to Admin Portal</h1>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-sm text-[var(--vs-muted)] bg-white rounded-2xl border border-[var(--vs-border)]">
          <Activity className="animate-spin mx-auto mb-2 text-[var(--primary)]" size={24} />
          Loading dashboard metrics...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] p-5 text-sm text-[var(--vs-red)] flex items-start gap-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-bold">Dashboard Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ── Main Dashboard Content ────────────────────────────────────────── */}
      {summary && (
        <>
          {/* ── Stat Cards Grid ────────────────────────────────────────────── */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStat
              label="Total Parts"
              value={summary.totalParts}
              icon={Boxes}
              accentClass="text-emerald-600"
              iconBg="bg-emerald-50"
              href={ROUTE_PATHS.admin.inventory}
            />
            <DashboardStat
              label="Total Vendors"
              value={summary.totalVendors}
              icon={Users}
              accentClass="text-blue-600"
              iconBg="bg-blue-50"
              href={ROUTE_PATHS.admin.vendors}
            />
            <DashboardStat
              label="Purchase Invoices"
              value={summary.totalPurchaseInvoices}
              icon={ShoppingCart}
              accentClass="text-indigo-600"
              iconBg="bg-indigo-50"
              href={ROUTE_PATHS.admin.reports}
            />
            <DashboardStat
              label="Low Stock Alerts"
              value={summary.lowStockParts}
              icon={AlertTriangle}
              accentClass={summary.lowStockParts > 0 ? "text-rose-600" : "text-emerald-600"}
              iconBg={summary.lowStockParts > 0 ? "bg-rose-50" : "bg-emerald-50"}
              href={ROUTE_PATHS.admin.inventory}
            />
          </div>

          {/* ── Visual Charts & Insights ────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recharts Area Chart Card (2/3 width) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-[var(--vs-border)] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-lg font-bold text-[var(--vs-text)]">Monthly Purchases Trend</h3>
                  <p className="text-xs text-[var(--vs-muted)]">Analysis of procurement expenditures over past months</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full text-xs font-bold text-emerald-700">
                  <TrendingUp size={13} />
                  <span>Spend: Rs {summary.totalPurchaseAmount.toLocaleString()}</span>
                </div>
              </div>

               <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e7a46" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#1e7a46" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--vs-soft-border)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--vs-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--vs-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val > 0 ? `${Math.round(val / 1000)}k` : '0'} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="amount" stroke="#1e7a46" strokeWidth={2.5} fillOpacity={1} fill="url(#spendGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[var(--vs-muted)]">
                    No purchase invoice history to visualize.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Analytics & Insights Card (1/3 width) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--vs-border)] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-[var(--vs-text)]">System Health</h3>
                <p className="text-xs text-[var(--vs-muted)]">Real-time status indexes</p>
              </div>

              <div className="flex flex-col gap-4">
                {/* Stock Level Progress */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--vs-text)]">Healthy Items Ratio</span>
                    <span className="text-emerald-600 font-bold">
                      {summary.totalParts > 0 ? Math.round(((summary.totalParts - summary.lowStockParts) / summary.totalParts) * 100) : 100}%
                    </span>
                  </div>
                  <div className="w-full bg-[var(--vs-soft-border)] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${summary.totalParts > 0 ? ((summary.totalParts - summary.lowStockParts) / summary.totalParts) * 100 : 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Purchase Invoices Progress */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--vs-text)]">Procurement Target</span>
                    <span className="text-blue-600 font-bold">85%</span>
                  </div>
                  <div className="w-full bg-[var(--vs-soft-border)] rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--vs-soft-border)]">
                <Link
                  to={ROUTE_PATHS.admin.reports}
                  className="flex items-center justify-between text-xs font-bold text-[var(--primary)] hover:text-emerald-700 transition-colors group/link"
                >
                  <span>Open Deep Reports & Logs</span>
                  <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>

          </div>

          {/* ── Table & Activity Rows ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Low-Stock Parts Table Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--vs-border)] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-lg font-bold text-[var(--vs-text)]">Low-Stock Warnings</h3>
                  <p className="text-xs text-[var(--vs-muted)]">Parts requiring immediate restock</p>
                </div>
                {summary.lowStockItems.length > 0 && (
                  <span className="badge br">{summary.lowStockItems.length} Critical</span>
                )}
              </div>

              {summary.lowStockItems.length > 0 ? (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Part Identifier / Name</th>
                        <th className="text-right">Current Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.lowStockItems.map((item, i) => (
                        <tr
                          key={i}
                          className="cursor-pointer"
                          onClick={() => window.location.assign(ROUTE_PATHS.admin.inventory)}
                          title="Click to manage stock"
                        >
                          <td className="font-semibold text-[var(--vs-text)]">{item.partName}</td>
                          <td className="text-right">
                            <span className="badge br font-extrabold flex items-center justify-end gap-1 max-w-[80px] ml-auto">
                              <AlertTriangle size={11} className="stroke-[2.5]" />
                              {item.stockQty} Qty
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[var(--vs-muted)] border border-dashed rounded-2xl flex flex-col items-center justify-center gap-2">
                  <Activity size={20} className="text-emerald-500" />
                  <span>All parts are healthy! No low stock alerts.</span>
                </div>
              )}
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--vs-border)] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-lg font-bold text-[var(--vs-text)]">System Activity Log</h3>
                  <p className="text-xs text-[var(--vs-muted)]">Real-time action audit trail</p>
                </div>
                <span className="badge bg flex items-center gap-1">
                  <Activity size={10} className="animate-pulse" /> Live
                </span>
              </div>

              {summary.recentActivities.length > 0 ? (
                <div className="overflow-hidden">
                  <ul className="flex flex-col gap-3">
                    {summary.recentActivities.map((act, i) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-4 p-3.5 bg-[var(--vs-surface-1)] hover:bg-[var(--vs-surface-2)] rounded-2xl border border-[var(--vs-border)] transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600 mt-0.5">
                            <ClipboardList size={15} />
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-bold text-[var(--vs-text)]">{act.activity}</p>
                            <p className="text-[10px] text-[var(--vs-muted)]">Module: {act.module}</p>
                          </div>
                        </div>
                        <span className={`badge ${act.status.toLowerCase() === 'completed' || act.status.toLowerCase() === 'active' || act.status.toLowerCase() === 'paid' ? 'bg' : 'ba'} text-[10px] uppercase font-bold shrink-0`}>
                          {act.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[var(--vs-muted)] border border-dashed rounded-2xl">
                  No recent activities recorded.
                </div>
              )}
            </div>

          </div>

          {/* ── Quick-Access Admin Modules ─────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-lg font-bold text-[var(--vs-text)]">System Navigation</h3>
              <p className="text-xs text-[var(--vs-muted)]">Access administrative control areas</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {adminModules.map((module) => {
                const Icon = module.icon
                return (
                  <Link
                    key={module.title}
                    to={module.href}
                    className={`group p-5 bg-gradient-to-br ${module.color} border rounded-2xl flex flex-col gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-1`}
                  >
                    <div className="p-2.5 bg-white/95 rounded-xl w-10 h-10 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <Icon size={20} className="stroke-[2.2]" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-[var(--vs-text)] tracking-tight">{module.title}</span>
                      <span className="text-[11px] text-[var(--vs-muted)] leading-tight">{module.description}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchSummary() {
      try {
        setIsLoading(true)
        const data = await getDashboardSummary()
        setSummary(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard statistics.')
      } finally {
        setIsLoading(false)
      }
    }
    void fetchSummary()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-gray-500">
        <Loader2 className="size-10 animate-spin text-[var(--vs-green-800)]" />
        <p>Loading admin portal...</p>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <Alert variant="destructive" className="mt-6 rounded-2xl">
        <AlertTriangle className="size-5" />
        <AlertTitle>Dashboard Error</AlertTitle>
        <AlertDescription>{error ?? 'No data found.'}</AlertDescription>
      </Alert>
    )
  }

  // Derived metrics
  const totalItems = summary.totalParts
  const healthyItems = totalItems - summary.lowStockParts
  const healthyRatio = totalItems > 0 ? Math.round((healthyItems / totalItems) * 100) : 100
  const procurementTarget = 85 // Mock target for UI purposes

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Welcome Banner */}
      <div className="bg-[#1f734a] text-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Welcome to Admin Portal</h1>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Parts */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">TOTAL PARTS</p>
              <div className="text-3xl font-bold text-gray-900">{summary.totalParts}</div>
            </div>
            <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Package className="size-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Vendors */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">TOTAL VENDORS</p>
              <div className="text-3xl font-bold text-gray-900">{summary.totalVendors}</div>
            </div>
            <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="size-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Purchase Invoices */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">PURCHASE INVOICES</p>
              <div className="text-3xl font-bold text-gray-900">{summary.totalPurchaseInvoices}</div>
            </div>
            <div className="size-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <ShoppingCart className="size-5 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">LOW STOCK ALERTS</p>
              <div className="text-3xl font-bold text-gray-900">{summary.lowStockParts}</div>
            </div>
            <div className="size-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <AlertTriangle className="size-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Trend & Health */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Monthly Purchases Trend */}
        <Card className="md:col-span-2 rounded-2xl border border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Monthly Purchases Trend</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Analysis of procurement expenditures over past months</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
              <TrendingUp className="size-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">Spend: Rs {summary.totalPurchaseAmount.toLocaleString()}</span>
            </div>
          </CardHeader>
          <CardContent className="min-h-[220px] flex items-center justify-center">
            {summary.monthlyPurchases.length === 0 ? (
              <p className="text-sm text-gray-400">No purchase invoice history to visualize.</p>
            ) : (
              <div className="w-full flex items-end justify-between px-4 h-[180px] gap-2 pt-8">
                 {/* Basic mock bar chart for demonstration based on the image's empty state or if data exists */}
                 {summary.monthlyPurchases.map((m, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 gap-2">
                       <div className="w-full bg-emerald-100 rounded-t-sm relative flex items-end justify-center group" style={{ height: `${Math.max(10, (m.amount / summary.totalPurchaseAmount) * 100)}%` }}>
                          <div className="absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Rs {m.amount}</div>
                          <div className="w-full bg-emerald-500 rounded-t-sm" style={{ height: '100%' }}></div>
                       </div>
                       <span className="text-[10px] text-gray-500">{m.month.substring(0, 3)}</span>
                    </div>
                 ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white flex flex-col">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg font-bold text-gray-900">System Health</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Real-time status indexes</p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center space-y-6">
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">Healthy Items Ratio</span>
                <span className="text-xs font-bold text-emerald-600">{healthyRatio}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${healthyRatio}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">Procurement Target</span>
                <span className="text-xs font-bold text-blue-600">{procurementTarget}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${procurementTarget}%` }} />
              </div>
            </div>

          </CardContent>
          <div className="border-t border-gray-100 p-4">
             <Link to={ROUTE_PATHS.admin.reports} className="flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-800">
                Open Deep Reports & Logs
                <ArrowRight className="size-4" />
             </Link>
          </div>
        </Card>
      </div>

      {/* Third Row: Warnings & Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Low-Stock Warnings */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-gray-900">Low-Stock Warnings</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Parts requiring immediate restock</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
               {summary.lowStockItems.length === 0 ? (
                 <>
                   <Activity className="size-6 text-emerald-500 mb-3" />
                   <p className="text-sm text-gray-500">All parts are healthy! No low stock alerts.</p>
                 </>
               ) : (
                 <div className="w-full text-left space-y-3">
                   {summary.lowStockItems.slice(0, 4).map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between">
                       <span className="text-sm font-medium text-gray-800">{item.partName}</span>
                       <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">{item.stockQty} left</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </CardContent>
        </Card>

        {/* System Activity Log */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">System Activity Log</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Real-time action audit trail</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full">
               <Activity className="size-3 text-emerald-600" />
               <span className="text-[10px] font-bold text-emerald-700 uppercase">Live</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 max-h-[220px] overflow-y-auto">
             {summary.recentActivities.length === 0 ? (
               <div className="text-center py-6 text-sm text-gray-400">No recent activity.</div>
             ) : (
               summary.recentActivities.map((activity, idx) => (
                 <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                   <div className="flex items-center gap-3">
                     <div className="size-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                       <ClipboardList className="size-4 text-emerald-600" />
                     </div>
                     <div>
                       <p className="text-xs font-bold text-gray-900">{activity.activity}</p>
                       <p className="text-[10px] text-gray-500 mt-0.5">Module: {activity.module}</p>
                     </div>
                   </div>
                   <div className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-1 rounded tracking-wide">
                     {activity.status.toUpperCase()}
                   </div>
                 </div>
               ))
             )}
          </CardContent>
        </Card>
      </div>

      {/* System Navigation Row */}
      <div className="pt-4">
         <h2 className="text-lg font-bold text-gray-900">System Navigation</h2>
         <p className="text-xs text-gray-500 mt-1 mb-4">Access administrative control areas</p>
         
         <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
           {navModules.map((module) => (
             <Link
               key={module.title}
               to={module.href}
               className={`rounded-2xl p-5 transition-transform hover:-translate-y-1 ${module.colorClass} flex flex-col h-full`}
             >
               <div className="mb-4 bg-white/60 w-8 h-8 rounded-full flex items-center justify-center">
                 <module.icon className={`size-4 ${module.iconColor}`} />
               </div>
               <h3 className="font-bold text-sm mb-1">{module.title}</h3>
               <p className="text-[10px] opacity-80 leading-relaxed mt-auto">
                 {module.description}
               </p>
             </Link>
           ))}
         </div>
      </div>

    </div>
  )
}
