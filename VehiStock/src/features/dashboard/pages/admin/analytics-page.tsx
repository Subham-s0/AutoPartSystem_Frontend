import * as React from 'react'
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  RotateCw,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { getDashboardSummary, type DashboardSummary } from '../../api/dashboard-api'
import { formatCurrency } from '@/utils/format'

const BRAND_COLORS = ['#10b981', '#34d399', '#059669', '#6ee7b7']

export function AnalyticsPage() {
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchSummary() {
      try {
        setIsLoading(true)
        const data = await getDashboardSummary()
        setSummary(data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    void fetchSummary()
  }, [])

  if (isLoading || !summary) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-gray-500">
        <Loader2 className="size-10 animate-spin text-emerald-800" />
        <p>Loading analytics...</p>
      </div>
    )
  }

  // Mocking data for the charts to match the UI perfectly
  const trendData = [
    { date: '25 Nov', procurement: 1200, sales: 700 },
    { date: '26 Nov', procurement: 1800, sales: 800 },
    { date: '27 Nov', procurement: 3300, sales: 2000 },
    { date: '28 Nov', procurement: 2100, sales: 1600 },
    { date: '29 Nov', procurement: 4000, sales: 2800 },
    { date: '30 Nov', procurement: 3000, sales: 2500 },
    { date: '1 Dec', procurement: 5500, sales: 4800 },
  ]

  const brandData = [
    { name: 'Bosch', value: 50 },
    { name: 'Donaldson', value: 50 },
  ]

  const brandSummary = [
    { brand: 'Bosch', activeParts: '1 parts', avgStock: '15 units avg', revenue: 'Rs. 4,500', alerts: 'Healthy Stock', status: 'Optimal' },
    { brand: 'Donaldson', activeParts: '1 parts', avgStock: '26 units avg', revenue: 'Rs. 4,500', alerts: 'Healthy Stock', status: 'Optimal' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-700">Analytics</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Procurement & Sales Trend */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-gray-900">Procurement & Sales Trend</CardTitle>
              <p className="text-[11px] text-gray-500 mt-0.5">Comparison of procurement costs vs sales revenue over the last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full">
              <TrendingUp className="size-3 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700">+14% Growth</span>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4 px-4">
            <div style={{ width: '100%', height: 280, minHeight: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value: number) => `${value}`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="procurement" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Brand Share Breakup */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-900">Brand Share Breakup</CardTitle>
            <p className="text-[11px] text-gray-500 mt-0.5">Stock concentration and brand catalog distribution</p>
          </CardHeader>
          <CardContent className="flex items-center justify-center relative pb-4" style={{ height: 280, minHeight: 280 }}>
             <div className="w-1/2 relative" style={{ height: 280 }}>
               <ResponsiveContainer width="100%" height={280}>
                 <PieChart>
                   <Pie
                     data={brandData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {brandData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                     ))}
                   </Pie>
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                 <span className="text-2xl font-bold text-gray-900">{summary.totalParts}</span>
                 <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">TOTAL PARTS</span>
               </div>
             </div>
             
             <div className="w-1/2 pl-8 flex flex-col justify-center gap-4">
               {brandData.map((brand, idx) => (
                 <div key={idx} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="size-2 rounded-full" style={{ backgroundColor: BRAND_COLORS[idx % BRAND_COLORS.length] }}></div>
                     <span className="text-xs font-bold text-gray-700">{brand.name}</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <span className="text-xs font-bold text-gray-900">1</span>
                     <span className="text-[10px] text-gray-400">({brand.value}%)</span>
                   </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-6">
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">PURCHASES</p>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[9px] px-1.5 py-0 border-none rounded">+12%</Badge>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalPurchaseAmount)}</div>
              <p className="text-[9px] text-gray-400 mt-0.5">Procurement value</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">CATALOG PARTS</p>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[9px] px-1.5 py-0 border-none rounded">+5%</Badge>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{summary.totalParts}</div>
              <p className="text-[9px] text-gray-400 mt-0.5">Active item definitions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">TOTAL SUPPLIERS</p>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[9px] px-1.5 py-0 border-none rounded">+7%</Badge>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{summary.totalVendors}</div>
              <p className="text-[9px] text-gray-400 mt-0.5">Registered vendors</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">LOW STOCK</p>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[9px] px-1.5 py-0 border-none rounded">Safe</Badge>
            </div>
            <div>
              <div className="text-lg font-bold text-rose-600">{summary.lowStockParts}</div>
              <p className="text-[9px] text-gray-400 mt-0.5">Items below minimum</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">INVOICES</p>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[9px] px-1.5 py-0 border-none rounded">+10%</Badge>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{summary.totalPurchaseInvoices}</div>
              <p className="text-[9px] text-gray-400 mt-0.5">Saved transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">STOCK TURN</p>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[9px] px-1.5 py-0 border-none rounded">+9%</Badge>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">84.3%</div>
              <p className="text-[9px] text-gray-400 mt-0.5">Efficient inventory flow</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Procurement Summary Table */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold text-gray-900">Brand Procurement & Alert Summary</CardTitle>
          <p className="text-[11px] text-gray-500 mt-0.5">Aggregation of stock performance and alerts grouped by vendor brand</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-y border-gray-100">
                <tr>
                  <th className="px-6 py-3">BRAND / VENDOR</th>
                  <th className="px-6 py-3">ACTIVE PARTS</th>
                  <th className="px-6 py-3">AVERAGE STOCK QUANTITY</th>
                  <th className="px-6 py-3">ESTIMATED REVENUE CONTRIBUTION</th>
                  <th className="px-6 py-3">CRITICAL ALERTS</th>
                  <th className="px-6 py-3">STATUS BADGE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {brandSummary.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                      <div className="size-2 rounded-full" style={{ backgroundColor: BRAND_COLORS[idx % BRAND_COLORS.length] }}></div>
                      {row.brand}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{row.activeParts}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{row.avgStock}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{row.revenue}</td>
                    <td className="px-6 py-4 text-gray-500">{row.alerts}</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none shadow-none font-bold text-[10px]">
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
