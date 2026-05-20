import * as React from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getDashboardSummary, type DashboardSummary } from '../../api/dashboard-api'

const navModules = [
  {
    title: 'Inventory',
    description: 'Parts, stock movement, and reorder controls.',
    icon: Boxes,
    href: ROUTE_PATHS.admin.inventory,
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
    colorClass: 'bg-indigo-50 text-indigo-700',
    iconColor: 'text-indigo-600',
  },
  {
    title: 'Part Requests',
    description: 'Review and update customer part requests.',
    icon: Wrench,
    href: ROUTE_PATHS.admin.partRequests,
    colorClass: 'bg-purple-50 text-purple-700',
    iconColor: 'text-purple-600',
  },
  {
    title: 'Reports',
    description: 'Business, financial, and operational reporting.',
    icon: ClipboardList,
    href: ROUTE_PATHS.admin.reports,
    colorClass: 'bg-amber-50 text-amber-700',
    iconColor: 'text-amber-600',
  },
  {
    title: 'Alerts',
    description: 'Low-stock and overdue-credit notifications.',
    icon: Bell,
    href: ROUTE_PATHS.admin.notifications,
    colorClass: 'bg-rose-50 text-rose-700',
    iconColor: 'text-rose-600',
  },
]

export function AdminDashboardPage() {
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null)
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
