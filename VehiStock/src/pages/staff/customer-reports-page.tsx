import * as React from 'react'
import { BarChart3 } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageSection } from '@/components/shared/page-section'
import {
  getHighSpenders,
  getPendingCredits,
  getRegularCustomers,
} from '@/features/reports/api/customer-reports-api'
import type {
  HighSpenderReportItem,
  PendingCreditReportItem,
  RegularCustomerReportItem,
} from '@/features/reports/types/customer-reports'
import { formatDateOnly } from '@/lib/date'
import { ApiError, type PaginatedResponse } from '@/types/api'

type ReportTab = 'regulars' | 'highSpenders' | 'pendingCredits'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 2,
  }).format(value)
}

export function CustomerReportsPage() {
  const [activeTab, setActiveTab] = React.useState<ReportTab>('regulars')
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [regularPage, setRegularPage] = React.useState(1)
  const [highSpenderPage, setHighSpenderPage] = React.useState(1)
  const [pendingCreditPage, setPendingCreditPage] = React.useState(1)
  const [minimumInvoicesInput, setMinimumInvoicesInput] = React.useState('2')
  const [appliedMinimumInvoices, setAppliedMinimumInvoices] = React.useState(2)
  const [regulars, setRegulars] = React.useState<PaginatedResponse<RegularCustomerReportItem> | null>(null)
  const [highSpenders, setHighSpenders] = React.useState<PaginatedResponse<HighSpenderReportItem> | null>(null)
  const [pendingCredits, setPendingCredits] = React.useState<PaginatedResponse<PendingCreditReportItem> | null>(null)

  const loadRegularCustomers = React.useCallback(async (page = regularPage, minimumInvoices = appliedMinimumInvoices) => {
    const result = await getRegularCustomers(page, 10, minimumInvoices)
    setRegulars(result)
  }, [appliedMinimumInvoices, regularPage])

  const loadHighSpenders = React.useCallback(async (page = highSpenderPage) => {
    const result = await getHighSpenders(page, 10)
    setHighSpenders(result)
  }, [highSpenderPage])

  const loadPendingCredits = React.useCallback(async (page = pendingCreditPage) => {
    const result = await getPendingCredits(page, 10)
    setPendingCredits(result)
  }, [pendingCreditPage])

  const loadActiveReport = React.useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)

      switch (activeTab) {
        case 'regulars':
          await loadRegularCustomers(regularPage, appliedMinimumInvoices)
          break
        case 'highSpenders':
          await loadHighSpenders(highSpenderPage)
          break
        case 'pendingCredits':
          await loadPendingCredits(pendingCreditPage)
          break
      }
    } catch (loadError) {
      setError(
        loadError instanceof ApiError || loadError instanceof Error
          ? loadError.message
          : 'Unable to load customer report.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    activeTab,
    appliedMinimumInvoices,
    highSpenderPage,
    loadHighSpenders,
    loadPendingCredits,
    loadRegularCustomers,
    pendingCreditPage,
    regularPage,
  ])

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadActiveReport()
    })
  }, [loadActiveReport])

  async function applyRegularFilter() {
    setRegularPage(1)
    setAppliedMinimumInvoices(Math.max(1, Number(minimumInvoicesInput || 1)))
  }

  const currentCount =
    activeTab === 'regulars'
      ? regulars?.items.length ?? 0
      : activeTab === 'highSpenders'
        ? highSpenders?.items.length ?? 0
        : pendingCredits?.items.length ?? 0

  const currentTotalRecords =
    activeTab === 'regulars'
      ? regulars?.totalRecords ?? 0
      : activeTab === 'highSpenders'
        ? highSpenders?.totalRecords ?? 0
        : pendingCredits?.totalRecords ?? 0

  return (
    <PageSection
      description="Review customer activity patterns and credit exposure from the staff reporting endpoints."
      title="Customer Reports"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Visible records</CardDescription>
              <CardTitle>{currentCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Total matching records</CardDescription>
              <CardTitle>{currentTotalRecords}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Regulars threshold</CardDescription>
              <CardTitle>{appliedMinimumInvoices} invoices</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Tabs onValueChange={(value) => setActiveTab(value as ReportTab)} value={activeTab}>
          <TabsList>
            <TabsTrigger value="regulars">
              <BarChart3 className="size-4" />
              Regulars
            </TabsTrigger>
            <TabsTrigger value="highSpenders">High spenders</TabsTrigger>
            <TabsTrigger value="pendingCredits">Pending credits</TabsTrigger>
          </TabsList>

          <TabsContent value="regulars">
            <Card>
              <CardHeader>
                <CardTitle>Regular customers</CardTitle>
                <CardDescription>
                  Customers with repeated invoice activity above the selected threshold.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="grid gap-2 sm:w-52">
                    <Label htmlFor="minimum-invoices">Minimum invoices</Label>
                    <Input
                      id="minimum-invoices"
                      min={1}
                      onChange={(event) => setMinimumInvoicesInput(event.target.value)}
                      type="number"
                      value={minimumInvoicesInput}
                    />
                  </div>
                  <Button onClick={() => void applyRegularFilter()} type="button" variant="outline">
                    Apply filter
                  </Button>
                </div>

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
                    {regulars?.items.length ? (
                      regulars.items.map((item) => (
                        <TableRow key={item.customerId}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.fullName}</span>
                              <span className="text-muted-foreground">{item.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{item.invoiceCount}</TableCell>
                          <TableCell>{formatCurrency(item.totalSpent)}</TableCell>
                          <TableCell>{formatDateOnly(item.lastInvoiceDate ?? '')}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="text-muted-foreground" colSpan={4}>
                          {isLoading ? 'Loading regular customers...' : 'No regular customers found.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Page {regulars?.pageNumber ?? regularPage} of {regulars?.totalPages ?? 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      disabled={regularPage <= 1}
                      onClick={() => {
                        setIsLoading(true)
                        setRegularPage((current) => Math.max(1, current - 1))
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <Button
                      disabled={regularPage >= (regulars?.totalPages ?? 1)}
                      onClick={() => {
                        setIsLoading(true)
                        setRegularPage((current) => current + 1)
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="highSpenders">
            <Card>
              <CardHeader>
                <CardTitle>High spenders</CardTitle>
                <CardDescription>
                  Highest-value customers based on invoice totals and payments recorded.
                </CardDescription>
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
                    {highSpenders?.items.length ? (
                      highSpenders.items.map((item) => (
                        <TableRow key={item.customerId}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.fullName}</span>
                              <span className="text-muted-foreground">{item.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.invoiceCount}</Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(item.totalSpent)}</TableCell>
                          <TableCell>{formatCurrency(item.totalPaid)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="text-muted-foreground" colSpan={4}>
                          {isLoading ? 'Loading high spenders...' : 'No high spenders found.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Page {highSpenders?.pageNumber ?? highSpenderPage} of {highSpenders?.totalPages ?? 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      disabled={highSpenderPage <= 1}
                      onClick={() => {
                        setIsLoading(true)
                        setHighSpenderPage((current) => Math.max(1, current - 1))
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <Button
                      disabled={highSpenderPage >= (highSpenders?.totalPages ?? 1)}
                      onClick={() => {
                        setIsLoading(true)
                        setHighSpenderPage((current) => current + 1)
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pendingCredits">
            <Card>
              <CardHeader>
                <CardTitle>Pending credits</CardTitle>
                <CardDescription>
                  Outstanding invoices that still carry unpaid balances.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Invoice date</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead>Balance due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingCredits?.items.length ? (
                      pendingCredits.items.map((item) => (
                        <TableRow key={item.salesInvoiceId}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.invoiceNo}</span>
                              <span className="text-xs text-muted-foreground">
                                #{item.salesInvoiceId}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.fullName}</span>
                              <span className="text-muted-foreground">{item.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDateOnly(item.invoiceDate)}</TableCell>
                          <TableCell>{formatDateOnly(item.creditDueDate ?? '')}</TableCell>
                          <TableCell>{formatCurrency(item.balanceDue)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="text-muted-foreground" colSpan={5}>
                          {isLoading ? 'Loading pending credits...' : 'No pending credits found.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Page {pendingCredits?.pageNumber ?? pendingCreditPage} of {pendingCredits?.totalPages ?? 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      disabled={pendingCreditPage <= 1}
                      onClick={() => {
                        setIsLoading(true)
                        setPendingCreditPage((current) => Math.max(1, current - 1))
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <Button
                      disabled={pendingCreditPage >= (pendingCredits?.totalPages ?? 1)}
                      onClick={() => {
                        setIsLoading(true)
                        setPendingCreditPage((current) => current + 1)
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageSection>
  )
}
