import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DollarSign, Package, TrendingUp, Calendar as CalendarIcon, Loader2, Download, FileText, Plus, PieChart as PieChartIcon, Wrench } from 'lucide-react'
import { getDailyReport, getMonthlyReport, getYearlyReport, type FinancialReport } from '../../api/reports-api'
import { formatCurrency } from '@/utils/format'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function formatChartCurrency(value: unknown) {
  return typeof value === 'number' ? formatCurrency(value) : formatCurrency(Number(value) || 0)
}

export function ReportsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('daily')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<FinancialReport | null>(null)

  // Breakdown table pagination
  const [breakdownPage, setBreakdownPage] = useState(1)
  const breakdownPageSize = 5

  useEffect(() => {
    queueMicrotask(() => {
      setBreakdownPage(1)
    })
  }, [reportData])

  // Filters
  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().split('T')[0])
  const [monthlyMonth, setMonthlyMonth] = useState(() => (new Date().getMonth() + 1).toString())
  const [monthlyYear, setMonthlyYear] = useState(() => new Date().getFullYear().toString())
  const [yearlyYear, setYearlyYear] = useState(() => new Date().getFullYear().toString())

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      let data
      if (activeTab === 'daily') {
        data = await getDailyReport(dailyDate)
      } else if (activeTab === 'monthly') {
        data = await getMonthlyReport(parseInt(monthlyYear), parseInt(monthlyMonth))
      } else {
        data = await getYearlyReport(parseInt(yearlyYear))
      }
      setReportData(data)
    } catch (error) {
      console.error('Failed to fetch report', error)
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }, [activeTab, dailyDate, monthlyMonth, monthlyYear, yearlyYear])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchReport()
    })
  }, [fetchReport])

  const handleExportCSV = () => {
    if (!reportData || !reportData.breakdown) return
    const headers = ['Date/Label', 'Parts Sales', 'Services Revenue', 'Combined Revenue', 'Cost', 'Profit']
    const rows = reportData.breakdown.map(row => 
      [row.label, row.salesRevenue, row.serviceRevenue, row.revenue, row.cost, row.profit].join(',')
    )
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Financial_Report_${activeTab}_${new Date().getTime()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    if (!reportData) return
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    // 1. Header (Bank Style)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(6, 78, 59) // emerald-900
    doc.text('VehiStock Auto Parts', 14, 25)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(4, 120, 87) // emerald-700
    doc.text('Kamalpokhari, Kathmandu', 14, 32)
    doc.text('Email: vehistock@gmail.com', 14, 37)

    // Document Title (Top Right)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(6, 78, 59) // emerald-900
    const title = 'FINANCIAL REPORT'
    const titleWidth = doc.getTextWidth(title)
    doc.text(title, pageWidth - titleWidth - 14, 25)

    // Date Generated
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    const dateText = `Generated: ${new Date().toLocaleDateString()}`
    const dateWidth = doc.getTextWidth(dateText)
    doc.text(dateText, pageWidth - dateWidth - 14, 32)

    // Divider
    doc.setDrawColor(16, 185, 129) // emerald-500
    doc.line(14, 45, pageWidth - 14, 45)

    // 2. Account Summary Box
    const periodText = activeTab === 'daily' 
      ? `Daily Report: ${dailyDate}` 
      : activeTab === 'monthly'
        ? `Monthly Report: ${monthlyYear}-${monthlyMonth.padStart(2, '0')}`
        : `Yearly Report: ${yearlyYear}`

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(6, 78, 59) // emerald-900
    doc.text('REPORT SUMMARY', 14, 55)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(`Reporting Period:`, 14, 63)
    doc.text(periodText, 50, 63)

    // Draw a green-tinted box for totals
    doc.setFillColor(240, 253, 244) // emerald-50
    doc.roundedRect(14, 70, pageWidth - 28, 40, 2, 2, 'F')
    doc.setDrawColor(16, 185, 129) // emerald-500
    doc.roundedRect(14, 70, pageWidth - 28, 40, 2, 2, 'S')

    doc.text(`Parts Sales:`, 20, 80)
    doc.text(formatCurrency(reportData.totalSalesRevenue), 65, 80)

    doc.text(`Services Revenue:`, 20, 90)
    doc.text(formatCurrency(reportData.totalServiceRevenue), 65, 90)

    doc.text(`Combined Revenue:`, 115, 80)
    doc.text(formatCurrency(reportData.totalCombinedRevenue), 160, 80)

    doc.text(`Total Cost:`, 115, 90)
    doc.text(formatCurrency(reportData.totalPurchaseCost), 160, 90)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(4, 120, 87) // emerald-700
    doc.text(`Net Profit:`, 20, 102)
    doc.text(formatCurrency(reportData.totalProfit), 65, 102)
    doc.setFont('helvetica', 'normal')
    
    // 3. Details Table
    if (reportData.breakdown && reportData.breakdown.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(6, 78, 59) // emerald-900
      doc.text('TRANSACTION BREAKDOWN', 14, 125)
      
      const tableData = reportData.breakdown.map(row => [
        row.label,
        formatCurrency(row.salesRevenue),
        formatCurrency(row.serviceRevenue),
        formatCurrency(row.revenue),
        formatCurrency(row.cost),
        formatCurrency(row.profit)
      ])
      
      autoTable(doc, {
        startY: 130,
        head: [['Period/Label', 'Parts Sales', 'Services', 'Combined', 'Cost', 'Profit']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [16, 185, 129], // emerald-500
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          lineColor: [5, 150, 105], // emerald-600
          lineWidth: 0.1
        },
        bodyStyles: {
          textColor: [15, 23, 42],
          lineColor: [167, 243, 208], // emerald-200
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        },
        margin: { left: 14, right: 14 },
      })
    }

    // 4. Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        'CONFIDENTIAL - For Internal Accounting Use Only',
        14,
        doc.internal.pageSize.height - 10
      )
      const pageNumText = `Page ${i} of ${pageCount}`
      const pageNumWidth = doc.getTextWidth(pageNumText)
      doc.text(
        pageNumText,
        pageWidth - pageNumWidth - 14,
        doc.internal.pageSize.height - 10
      )
    }

    // Save
    doc.save(`VehiStock_Report_${activeTab}_${new Date().getTime()}.pdf`)
  }

  const paginatedBreakdown = reportData?.breakdown
    ? reportData.breakdown.slice((breakdownPage - 1) * breakdownPageSize, breakdownPage * breakdownPageSize)
    : []

  const breakdownTotalPages = reportData?.breakdown
    ? Math.ceil(reportData.breakdown.length / breakdownPageSize)
    : 1

  const pieData = reportData ? [
    { name: 'Parts Sales', value: reportData.totalSalesRevenue },
    { name: 'Services', value: reportData.totalServiceRevenue },
    { name: 'Cost', value: reportData.totalPurchaseCost }
  ] : []
  const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b']

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Financial Reports</h1>
        <p className="text-emerald-700/80 mt-2">
          Monitor your daily, monthly, and yearly business performance and profits.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border border-emerald-100 shadow-sm p-1">
          <TabsTrigger value="daily" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Daily</TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Monthly</TabsTrigger>
          <TabsTrigger value="yearly" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Yearly</TabsTrigger>
        </TabsList>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm mb-6 flex items-end gap-4">
          {activeTab === 'daily' && (
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Input 
                type="date" 
                value={dailyDate} 
                onChange={(e) => setDailyDate(e.target.value)}
                className="w-auto"
              />
            </div>
          )}

          {activeTab === 'monthly' && (
            <>
              <div className="space-y-2">
                <Label>Month</Label>
                <select 
                  value={monthlyMonth}
                  onChange={(e) => setMonthlyMonth(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2020, i, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input 
                  type="number" 
                  value={monthlyYear} 
                  onChange={(e) => setMonthlyYear(e.target.value)}
                  className="w-24"
                />
              </div>
            </>
          )}

          {activeTab === 'yearly' && (
            <div className="space-y-2">
              <Label>Year</Label>
              <Input 
                type="number" 
                value={yearlyYear} 
                onChange={(e) => setYearlyYear(e.target.value)}
                className="w-32"
              />
            </div>
          )}

          <Button onClick={fetchReport} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarIcon className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {reportData && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card 
              className="border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.98]"
              onClick={() => navigate('/admin')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800">Parts Sales Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{formatCurrency(reportData.totalSalesRevenue)}</div>
                <p className="text-xs text-emerald-600/80 mt-1">
                  Revenue from direct part sales
                </p>
              </CardContent>
            </Card>

            <Card 
              className="border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.98]"
              onClick={() => navigate('/admin/service-records')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800">Services Revenue</CardTitle>
                <Wrench className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{formatCurrency(reportData.totalServiceRevenue)}</div>
                <p className="text-xs text-emerald-600/80 mt-1">
                  Revenue from vehicle services
                </p>
              </CardContent>
            </Card>

            <Card 
              className="border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.98]"
              onClick={() => navigate('/admin')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800">Combined Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{formatCurrency(reportData.totalCombinedRevenue)}</div>
                <p className="text-xs text-emerald-600/80 mt-1">
                  Gross revenue (Parts + Services)
                </p>
              </CardContent>
            </Card>

            <Card 
              className="border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.98]"
              onClick={() => navigate('/admin/inventory')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800">Total Purchase Cost</CardTitle>
                <Package className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{formatCurrency(reportData.totalPurchaseCost)}</div>
                <p className="text-xs text-emerald-600/80 mt-1">
                  Cost of inventory purchased
                </p>
              </CardContent>
            </Card>

            <Card 
              className="border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 relative overflow-hidden cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.98]"
              onClick={() => navigate('/admin/reports')}
            >
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-emerald-800">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(reportData.totalProfit)}</div>
                <p className="text-xs text-emerald-600/80 mt-1">
                  Combined Revenue - Purchase Cost
                </p>
              </CardContent>
            </Card>

            <Card 
              className="border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.98]"
              onClick={() => navigate('/admin/inventory')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800">Items Sold</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{reportData.totalItemsSold} Units</div>
                <p className="text-xs text-emerald-600/80 mt-1">
                  Total individual parts sold
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts & Data Table Section */}
        {reportData && reportData.breakdown && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            
            {/* Left: Detailed Data Table */}
            <Card className="col-span-1 border-emerald-100 shadow-sm bg-white overflow-hidden flex flex-col">
              <CardContent className="p-0 flex-1 overflow-auto max-h-[400px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-emerald-800 uppercase bg-emerald-50/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Period</th>
                      <th className="px-4 py-3 font-semibold text-right">Parts Sales</th>
                      <th className="px-4 py-3 font-semibold text-right">Services</th>
                      <th className="px-4 py-3 font-semibold text-right">Combined</th>
                      <th className="px-4 py-3 font-semibold text-right">Cost</th>
                      <th className="px-4 py-3 font-semibold text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBreakdown.map((row, i) => (
                      <tr key={i} className="border-b border-emerald-50 hover:bg-emerald-50/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-emerald-950">{row.label}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(row.salesRevenue)}</td>
                        <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(row.serviceRevenue)}</td>
                        <td className="px-4 py-3 text-right text-emerald-700 font-semibold">{formatCurrency(row.revenue)}</td>
                        <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(row.cost)}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-800">{formatCurrency(row.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
              {reportData.breakdown.length > 0 && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-emerald-100 bg-emerald-50/10">
                  <p className="text-[11px] font-semibold text-emerald-800">
                    Showing {Math.min(reportData.breakdown.length, (breakdownPage - 1) * 5 + 1)} to {Math.min(reportData.breakdown.length, breakdownPage * 5)} of {reportData.breakdown.length} records
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      disabled={breakdownPage <= 1}
                      onClick={() => setBreakdownPage(p => Math.max(1, p - 1))}
                      size="sm" variant="outline" className="h-7 px-2 text-[10px] border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      Prev
                    </Button>
                    
                    {Array.from({ length: breakdownTotalPages || 1 }).map((_, index) => {
                      const p = index + 1
                      return (
                        <Button
                          type="button"
                          key={p}
                          onClick={() => setBreakdownPage(p)}
                          variant={breakdownPage === p ? 'default' : 'outline'}
                          size="sm"
                          className={`h-7 w-7 p-0 text-[10px] font-bold ${
                            breakdownPage === p 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white border-emerald-600 shadow-sm' 
                              : 'text-emerald-800 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900'
                          }`}
                        >
                          {p}
                        </Button>
                      )
                    })}

                    <Button
                      type="button"
                      disabled={breakdownPage >= breakdownTotalPages}
                      onClick={() => setBreakdownPage(p => p + 1)}
                      size="sm" variant="outline" className="h-7 px-2 text-[10px] border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Right: Charts */}
            <Card className="col-span-1 lg:col-span-2 border-emerald-100 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="h-[350px] w-full xl:col-span-2 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={reportData.breakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#064e3b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#064e3b'}} tickFormatter={(val) => `NPR ${val/1000}k`} />
                        <Tooltip cursor={{fill: '#f0fdf4'}} formatter={formatChartCurrency} />
                        <Legend />
                        <Bar dataKey="salesRevenue" name="Parts Sales" fill="#10b981" radius={[4, 4, 0, 0]} minPointSize={5} />
                        <Bar dataKey="serviceRevenue" name="Services" fill="#3b82f6" radius={[4, 4, 0, 0]} minPointSize={5} />
                        <Bar dataKey="cost" name="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} minPointSize={5} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-[350px] w-full xl:col-span-1 min-w-0 flex flex-col items-center justify-center xl:border-l xl:border-emerald-50 xl:pl-6">
                    {reportData?.totalSalesRevenue === 0 && reportData?.totalPurchaseCost === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[85%] text-emerald-800/40">
                        <PieChartIcon size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">No data for this period</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="85%" minWidth={0}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={formatChartCurrency} />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    <div className="text-sm font-medium text-center text-emerald-800/80 mt-2">
                      Total Share
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>
      
      {/* Topbar Actions Portal */}
      {document.getElementById('topbar-actions-portal') && createPortal(
        <>
          <button className="tb-btn" type="button" onClick={handleExportCSV}>
            <FileText size={13} />
            Export CSV
          </button>
          <button className="tb-btn" type="button" onClick={handleExportPDF}>
            <Download size={13} />
            Export PDF
          </button>
          <button className="tb-btn primary" type="button" onClick={() => navigate('/admin/inventory')}>
            <Plus size={13} />
            Add Part
          </button>
        </>,
        document.getElementById('topbar-actions-portal')!
      )}
    </div>
  )
}
