import * as React from 'react'
import { BarChart, Bar, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, Download, Printer } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangeFilterPopover } from '@/components/shared/date-range-filter-popover'
import { PageSection } from '@/components/shared/page-section'
import { PaginationFooter } from '@/components/shared/pagination-footer'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  getCustomerReportSummary,
  getHighSpenders,
  getPendingCredits,
  getRegularCustomers,
} from '@/features/reports/api/customer-reports-api'
import type {
  CustomerReportFilters,
  CustomerReportSummary,
  HighSpenderReportItem,
  PendingCreditReportItem,
  RegularCustomerReportItem,
} from '@/features/reports/types/customer-reports'
import { CustomerDetailDialog } from '@/features/customers/components/customer-directory-page'
import { formatDateOnly } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError, type PaginatedResponse } from '@/types/api'

type ReportTab = 'regulars' | 'highSpenders' | 'pendingCredits'

interface CustomerReportsPageProps {
  title?: string
  description?: string
}

function exportTableAsCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function printReport(title: string, summary: CustomerReportSummary | null, rowsHtml: string) {
  const printWindow = window.open('', '_blank', 'width=1100,height=800')
  if (!printWindow) {
    return
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          p { margin: 0 0 20px; color: #4b5563; }
          .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 16px; }
          .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
          .value { font-size: 18px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e5e7eb; padding: 10px 12px; font-size: 13px; text-align: left; }
          th { background: #f9fafb; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated ${new Date().toLocaleString()}</p>
        ${
          summary
            ? `<div class="grid">
                <div class="card"><div class="label">Customers with invoices</div><div class="value">${summary.totalCustomersWithInvoices}</div></div>
                <div class="card"><div class="label">Invoices</div><div class="value">${summary.totalInvoices}</div></div>
                <div class="card"><div class="label">Revenue</div><div class="value">${formatCurrency(summary.totalRevenue)}</div></div>
                <div class="card"><div class="label">Outstanding</div><div class="value">${formatCurrency(summary.totalOutstandingBalance)}</div></div>
              </div>`
            : ''
        }
        ${rowsHtml}
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

export function CustomerReportsPage({
  title = 'Customer Reports',
  description = 'Track repeat customers, highest-value buyers, and credit exposure with exportable backend-driven reports.',
}: CustomerReportsPageProps) {
  const [activeTab, setActiveTab] = React.useState<ReportTab>('regulars')
  const [summary, setSummary] = React.useState<CustomerReportSummary | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [regularPage, setRegularPage] = React.useState(1)
  const [highSpenderPage, setHighSpenderPage] = React.useState(1)
  const [pendingCreditPage, setPendingCreditPage] = React.useState(1)
  const [minimumInvoicesInput, setMinimumInvoicesInput] = React.useState('2')
  const [appliedMinimumInvoices, setAppliedMinimumInvoices] = React.useState(2)
  const [filters, setFilters] = React.useState<CustomerReportFilters>({})
  const [regulars, setRegulars] = React.useState<PaginatedResponse<RegularCustomerReportItem> | null>(null)
  const [highSpenders, setHighSpenders] = React.useState<PaginatedResponse<HighSpenderReportItem> | null>(null)
  const [pendingCredits, setPendingCredits] = React.useState<PaginatedResponse<PendingCreditReportItem> | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<number | null>(null)

  const loadActiveReport = React.useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)

      const [summaryResult] = await Promise.all([
        getCustomerReportSummary(filters),
        activeTab === 'regulars'
          ? getRegularCustomers(regularPage, 10, appliedMinimumInvoices, filters).then(setRegulars)
          : activeTab === 'highSpenders'
            ? getHighSpenders(highSpenderPage, 10, filters).then(setHighSpenders)
            : getPendingCredits(pendingCreditPage, 10, filters).then(setPendingCredits),
      ])

      setSummary(summaryResult)
    } catch (loadError) {
      setError(
        loadError instanceof ApiError || loadError instanceof Error
          ? loadError.message
          : 'Unable to load customer report.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, appliedMinimumInvoices, filters, highSpenderPage, pendingCreditPage, regularPage])

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadActiveReport()
    })
  }, [loadActiveReport])

  const regularChartData = (regulars?.items ?? []).map((item) => ({
    label: item.fullName,
    invoices: item.invoiceCount,
    spent: item.totalSpent,
  }))

  const highSpenderChartData = (highSpenders?.items ?? []).map((item) => ({
    label: item.fullName,
    spent: item.totalSpent,
    paid: item.totalPaid,
  }))

  const pendingCreditsChartData = (pendingCredits?.items ?? []).map((item) => ({
    label: item.fullName,
    balance: item.balanceDue,
  }))

  function handleExportCsv() {
    if (activeTab === 'regulars') {
      exportTableAsCsv(
        'regular-customers-report.csv',
        ['Customer', 'Email', 'Invoice Count', 'Total Spent', 'Last Invoice Date'],
        (regulars?.items ?? []).map((item) => [
          item.fullName,
          item.email,
          item.invoiceCount,
          item.totalSpent,
          item.lastInvoiceDate ?? '',
        ]),
      )
      return
    }

    if (activeTab === 'highSpenders') {
      exportTableAsCsv(
        'high-spenders-report.csv',
        ['Customer', 'Email', 'Invoice Count', 'Total Spent', 'Total Paid'],
        (highSpenders?.items ?? []).map((item) => [
          item.fullName,
          item.email,
          item.invoiceCount,
          item.totalSpent,
          item.totalPaid,
        ]),
      )
      return
    }

    exportTableAsCsv(
      'pending-credits-report.csv',
      ['Invoice', 'Customer', 'Invoice Date', 'Due Date', 'Balance Due'],
      (pendingCredits?.items ?? []).map((item) => [
        item.invoiceNo,
        item.fullName,
        item.invoiceDate,
        item.creditDueDate ?? '',
        item.balanceDue,
      ]),
    )
  }

  function handlePrint() {
    if (activeTab === 'regulars') {
      const rows = (regulars?.items ?? [])
        .map((item) => `<tr><td>${item.fullName}</td><td>${item.email}</td><td>${item.invoiceCount}</td><td>${formatCurrency(item.totalSpent)}</td><td>${item.lastInvoiceDate ? formatDateOnly(item.lastInvoiceDate) : 'N/A'}</td></tr>`)
        .join('')
      printReport('Regular Customers Report', summary, `<table><thead><tr><th>Customer</th><th>Email</th><th>Invoices</th><th>Total spent</th><th>Last invoice</th></tr></thead><tbody>${rows}</tbody></table>`)
      return
    }

    if (activeTab === 'highSpenders') {
      const rows = (highSpenders?.items ?? [])
        .map((item) => `<tr><td>${item.fullName}</td><td>${item.email}</td><td>${item.invoiceCount}</td><td>${formatCurrency(item.totalSpent)}</td><td>${formatCurrency(item.totalPaid)}</td></tr>`)
        .join('')
      printReport('High Spenders Report', summary, `<table><thead><tr><th>Customer</th><th>Email</th><th>Invoices</th><th>Total spent</th><th>Total paid</th></tr></thead><tbody>${rows}</tbody></table>`)
      return
    }

    const rows = (pendingCredits?.items ?? [])
      .map((item) => `<tr><td>${item.invoiceNo}</td><td>${item.fullName}</td><td>${formatDateOnly(item.invoiceDate)}</td><td>${item.creditDueDate ? formatDateOnly(item.creditDueDate) : 'N/A'}</td><td>${formatCurrency(item.balanceDue)}</td></tr>`)
      .join('')
    printReport('Pending Credits Report', summary, `<table><thead><tr><th>Invoice</th><th>Customer</th><th>Invoice date</th><th>Due date</th><th>Balance due</th></tr></thead><tbody>${rows}</tbody></table>`)
  }

  return (
    <PageSection description={description} title={title}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilterPopover
              fromDate={filters.fromDate ?? ''}
              onApply={(fromDate, toDate) => {
                setRegularPage(1)
                setHighSpenderPage(1)
                setPendingCreditPage(1)
                setFilters({
                  fromDate: fromDate || undefined,
                  toDate: toDate || undefined,
                })
              }}
              toDate={filters.toDate ?? ''}
            />
            {activeTab === 'regulars' ? (
              <Input
                className="w-40"
                min={1}
                onChange={(event) => setMinimumInvoicesInput(event.target.value)}
                type="number"
                value={minimumInvoicesInput}
              />
            ) : null}
            {activeTab === 'regulars' ? (
              <Button onClick={() => {
                setRegularPage(1)
                setAppliedMinimumInvoices(Math.max(1, Number(minimumInvoicesInput || 1)))
              }} type="button" variant="outline">
                Apply threshold
              </Button>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportCsv} type="button" variant="outline">
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button onClick={handlePrint} type="button">
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardHeader className="pb-2"><CardDescription>Customers</CardDescription><CardTitle>{summary?.totalCustomersWithInvoices ?? 0}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Invoices</CardDescription><CardTitle>{summary?.totalInvoices ?? 0}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Revenue</CardDescription><CardTitle>{formatCurrency(summary?.totalRevenue ?? 0)}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Outstanding</CardDescription><CardTitle>{formatCurrency(summary?.totalOutstandingBalance ?? 0)}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Average spend</CardDescription><CardTitle>{formatCurrency(summary?.averageCustomerSpend ?? 0)}</CardTitle></CardHeader></Card>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Tabs onValueChange={(value) => setActiveTab(value as ReportTab)} value={activeTab}>
          <TabsList>
            <TabsTrigger value="regulars"><BarChart3 className="size-4" />Regulars</TabsTrigger>
            <TabsTrigger value="highSpenders">High spenders</TabsTrigger>
            <TabsTrigger value="pendingCredits">Pending credits</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-4" value="regulars">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Regular customers</CardTitle>
                  <CardDescription>Customers with repeated invoice activity above the selected threshold.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Invoices</TableHead>
                        <TableHead>Total spent</TableHead>
                        <TableHead>Last invoice</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(regulars?.items ?? []).length ? regulars!.items.map((item) => (
                        <TableRow className="cursor-pointer" key={item.customerId} onClick={() => setSelectedCustomerId(item.customerId)}>
                          <TableCell><div className="font-medium">{item.fullName}</div><div className="text-xs text-muted-foreground">{item.email}</div></TableCell>
                          <TableCell><Badge variant="outline">{item.invoiceCount}</Badge></TableCell>
                          <TableCell>{formatCurrency(item.totalSpent)}</TableCell>
                          <TableCell>{item.lastInvoiceDate ? formatDateOnly(item.lastInvoiceDate) : 'N/A'}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell className="text-muted-foreground" colSpan={4}>{isLoading ? 'Loading regular customers...' : 'No regular customers found.'}</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <PaginationFooter
                    isLoading={isLoading}
                    itemCount={regulars?.items.length ?? 0}
                    onNext={() => setRegularPage((current) => current + 1)}
                    onPrevious={() => setRegularPage((current) => Math.max(1, current - 1))}
                    pageNumber={regulars?.pageNumber ?? regularPage}
                    pageSize={regulars?.pageSize ?? 10}
                    totalPages={regulars?.totalPages ?? 1}
                    totalRecords={regulars?.totalRecords ?? 0}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Spending pattern</CardTitle>
                  <CardDescription>Current page distribution of repeat customers by invoice count and spend.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    className="h-[320px] w-full"
                    config={{
                      invoices: { label: 'Invoices', color: '#14532d' },
                      spent: { label: 'Spent', color: '#16a34a' },
                    }}
                  >
                    <BarChart data={regularChartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" hide />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="invoices" fill="var(--color-invoices)" radius={6} />
                      <Bar dataKey="spent" fill="var(--color-spent)" radius={6} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className="space-y-4" value="highSpenders">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>High spenders</CardTitle>
                  <CardDescription>Customers ranked by invoice value and collected payments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Invoices</TableHead>
                        <TableHead>Total spent</TableHead>
                        <TableHead>Total paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(highSpenders?.items ?? []).length ? highSpenders!.items.map((item) => (
                        <TableRow className="cursor-pointer" key={item.customerId} onClick={() => setSelectedCustomerId(item.customerId)}>
                          <TableCell><div className="font-medium">{item.fullName}</div><div className="text-xs text-muted-foreground">{item.email}</div></TableCell>
                          <TableCell><Badge variant="outline">{item.invoiceCount}</Badge></TableCell>
                          <TableCell>{formatCurrency(item.totalSpent)}</TableCell>
                          <TableCell>{formatCurrency(item.totalPaid)}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell className="text-muted-foreground" colSpan={4}>{isLoading ? 'Loading high spenders...' : 'No high spenders found.'}</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <PaginationFooter
                    isLoading={isLoading}
                    itemCount={highSpenders?.items.length ?? 0}
                    onNext={() => setHighSpenderPage((current) => current + 1)}
                    onPrevious={() => setHighSpenderPage((current) => Math.max(1, current - 1))}
                    pageNumber={highSpenders?.pageNumber ?? highSpenderPage}
                    pageSize={highSpenders?.pageSize ?? 10}
                    totalPages={highSpenders?.totalPages ?? 1}
                    totalRecords={highSpenders?.totalRecords ?? 0}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top spenders chart</CardTitle>
                  <CardDescription>Current page comparison between billed and paid values.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    className="h-[320px] w-full"
                    config={{
                      spent: { label: 'Spent', color: '#0f766e' },
                      paid: { label: 'Paid', color: '#06b6d4' },
                    }}
                  >
                    <BarChart data={highSpenderChartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" hide />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="spent" fill="var(--color-spent)" radius={6} />
                      <Bar dataKey="paid" fill="var(--color-paid)" radius={6} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className="space-y-4" value="pendingCredits">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Pending credits</CardTitle>
                  <CardDescription>Outstanding balances that still need follow-up.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Due date</TableHead>
                        <TableHead>Balance due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(pendingCredits?.items ?? []).length ? pendingCredits!.items.map((item) => (
                        <TableRow className="cursor-pointer" key={item.salesInvoiceId} onClick={() => setSelectedCustomerId(item.customerId)}>
                          <TableCell><div className="font-medium">{item.invoiceNo}</div><div className="text-xs text-muted-foreground">{formatDateOnly(item.invoiceDate)}</div></TableCell>
                          <TableCell><div className="font-medium">{item.fullName}</div><div className="text-xs text-muted-foreground">{item.email}</div></TableCell>
                          <TableCell>{item.creditDueDate ? formatDateOnly(item.creditDueDate) : 'N/A'}</TableCell>
                          <TableCell>{formatCurrency(item.balanceDue)}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell className="text-muted-foreground" colSpan={4}>{isLoading ? 'Loading pending credits...' : 'No pending credits found.'}</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <PaginationFooter
                    isLoading={isLoading}
                    itemCount={pendingCredits?.items.length ?? 0}
                    onNext={() => setPendingCreditPage((current) => current + 1)}
                    onPrevious={() => setPendingCreditPage((current) => Math.max(1, current - 1))}
                    pageNumber={pendingCredits?.pageNumber ?? pendingCreditPage}
                    pageSize={pendingCredits?.pageSize ?? 10}
                    totalPages={pendingCredits?.totalPages ?? 1}
                    totalRecords={pendingCredits?.totalRecords ?? 0}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Credit exposure</CardTitle>
                  <CardDescription>Current page balance distribution by customer.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer height={320} width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={pendingCreditsChartData}
                        dataKey="balance"
                        innerRadius={60}
                        nameKey="label"
                        outerRadius={100}
                      />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <CustomerDetailDialog
          customerId={selectedCustomerId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCustomerId(null)
            }
          }}
          open={selectedCustomerId !== null}
          scope="staff"
        />
      </div>
    </PageSection>
  )
}
