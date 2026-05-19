import * as React from 'react'
import { Loader2, UserCog } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageSection } from '@/components/shared/page-section'
import { PaginationFooter } from '@/components/shared/pagination-footer'
import { registerStaff } from '@/features/auth/api/auth-api'
import { getStaff, getStaffDetail, updateStaffRole } from '@/features/staff-management/api/staff-management-api'
import type { RegisterStaffInput, StaffDetail, StaffSummary } from '@/features/staff-management/types/staff-management'
import { ROLE_NAMES } from '@/constants/roles'
import { formatDateOnly } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError, type PaginatedResponse } from '@/types/api'

const initialForm: RegisterStaffInput = {
  fullName: '',
  email: '',
  password: '',
  phoneNumber: '',
  profilePhotoUrl: '',
  jobTitle: '',
  hireDate: '',
}

function StaffProfileDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [detail, setDetail] = React.useState<StaffDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open || !userId) {
      return
    }

    const targetUserId = userId
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const result = await getStaffDetail(targetUserId)
        if (!cancelled) {
          setDetail(result)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError || loadError instanceof Error
              ? loadError.message
              : 'Unable to load staff profile.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, userId])

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Staff profile</DialogTitle>
          <DialogDescription>
            View identity, access role, and recent invoice activity for the selected staff member.
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
            <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{detail.fullName}</CardTitle>
                  <CardDescription>Staff member #{detail.staffMemberId}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-muted-foreground">
                  <div>{detail.email}</div>
                  <div>{detail.phoneNumber || 'No phone number'}</div>
                  <div>{detail.jobTitle}</div>
                  <div>Hire date: {formatDateOnly(detail.hireDate)}</div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="default">{detail.role}</Badge>
                    <Badge variant={detail.isActive ? 'secondary' : 'outline'}>
                      {detail.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Invoices created</CardDescription>
                    <CardTitle>{detail.totalInvoicesCreated}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total invoice value</CardDescription>
                    <CardTitle>{formatCurrency(detail.totalInvoiceValue)}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>

            <Tabs defaultValue="activity">
              <TabsList>
                <TabsTrigger value="activity">Recent invoices</TabsTrigger>
              </TabsList>
              <TabsContent value="activity">
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.recentInvoices.length ? detail.recentInvoices.map((invoice) => (
                          <TableRow key={invoice.salesInvoiceId}>
                            <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                            <TableCell>{invoice.customerName}</TableCell>
                            <TableCell>{formatDateOnly(invoice.invoiceDate)}</TableCell>
                            <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                            <TableCell><Badge variant="outline">{invoice.paymentStatus}</Badge></TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell className="text-muted-foreground" colSpan={5}>
                              No invoice activity has been recorded yet.
                            </TableCell>
                          </TableRow>
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

export function StaffPage() {
  const [form, setForm] = React.useState<RegisterStaffInput>(initialForm)
  const [staffResult, setStaffResult] = React.useState<PaginatedResponse<StaffSummary> | null>(null)
  const [pageNumber, setPageNumber] = React.useState(1)
  const [searchText, setSearchText] = React.useState('')
  const [appliedSearch, setAppliedSearch] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [roleDrafts, setRoleDrafts] = React.useState<Record<string, string>>({})
  const [savingRoleFor, setSavingRoleFor] = React.useState<string | null>(null)
  const [selectedStaffUserId, setSelectedStaffUserId] = React.useState<string | null>(null)
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false)

  const loadStaff = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await getStaff(pageNumber, 10, appliedSearch || undefined)
      setStaffResult(result)
      setRoleDrafts(
        result.items.reduce<Record<string, string>>((drafts, item) => {
          drafts[item.userId] = item.role
          return drafts
        }, {}),
      )
    } catch (loadError) {
      setError(
        loadError instanceof ApiError || loadError instanceof Error
          ? loadError.message
          : 'Unable to load staff members.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, pageNumber])

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadStaff()
    })
  }, [loadStaff])

  function updateForm<K extends keyof RegisterStaffInput>(key: K, value: RegisterStaffInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await registerStaff({
        ...form,
        phoneNumber: form.phoneNumber || undefined,
        profilePhotoUrl: form.profilePhotoUrl || undefined,
        hireDate: form.hireDate || undefined,
      })

      setForm(initialForm)
      setIsRegisterOpen(false)
      setSuccessMessage('Staff account created successfully.')
      setPageNumber(1)
      await loadStaff()
    } catch (submitError) {
      setError(
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Unable to create staff account.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRoleSave(userId: string) {
    const role = roleDrafts[userId]
    if (!role) {
      return
    }

    setSavingRoleFor(userId)
    setError(null)
    setSuccessMessage(null)

    try {
      const updated = await updateStaffRole(userId, { role })
      setStaffResult((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => (item.userId === userId ? updated : item)),
            }
          : current,
      )
      setSuccessMessage('Staff role updated successfully.')
    } catch (saveError) {
      setError(
        saveError instanceof ApiError || saveError instanceof Error
          ? saveError.message
          : 'Unable to update role.',
      )
    } finally {
      setSavingRoleFor(null)
    }
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPageNumber(1)
    setAppliedSearch(searchText.trim())
  }

  return (
    <PageSection
      description="Register staff accounts, review role assignments, and open detailed staff profiles with recent operational activity."
      title="Staff Management"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total staff records</CardDescription>
              <CardTitle>{staffResult?.totalRecords ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active on current page</CardDescription>
              <CardTitle>{staffResult?.items.filter((item) => item.isActive).length ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Admins on current page</CardDescription>
              <CardTitle>{staffResult?.items.filter((item) => item.role === ROLE_NAMES.admin).length ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Team access</CardTitle>
                <CardDescription>
                  Search staff, open profile details, and update role assignments from the current backend flow.
                </CardDescription>
              </div>
              <Button onClick={() => setIsRegisterOpen(true)} type="button">
                <UserCog className="size-4" />
                Register staff
              </Button>
            </div>

            <form className="relative" onSubmit={handleSearchSubmit}>
              <Input
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by name, email, phone, title, or staff ID"
                value={searchText}
              />
            </form>
          </CardHeader>

          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Request failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {successMessage ? (
              <Alert>
                <AlertTitle>Updated</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            ) : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Job title</TableHead>
                  <TableHead>Hire date</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffResult?.items.length ? staffResult.items.map((item) => (
                  <TableRow key={item.userId}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{item.fullName}</div>
                        <div className="text-xs text-muted-foreground">{item.email}</div>
                        <div className="text-xs text-muted-foreground">Staff ID #{item.staffMemberId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.jobTitle}</TableCell>
                    <TableCell>{formatDateOnly(item.hireDate)}</TableCell>
                    <TableCell>
                      <div className="flex min-w-36 flex-col gap-2">
                        <Badge variant={item.role === ROLE_NAMES.admin ? 'default' : 'secondary'}>
                          {item.role}
                        </Badge>
                        <Select
                          onValueChange={(value) => setRoleDrafts((current) => ({ ...current, [item.userId]: value }))}
                          value={roleDrafts[item.userId] ?? item.role}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ROLE_NAMES.staff}>Staff</SelectItem>
                            <SelectItem value={ROLE_NAMES.admin}>Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'secondary' : 'outline'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => setSelectedStaffUserId(item.userId)} size="sm" type="button" variant="outline">
                          View
                        </Button>
                        <Button
                          disabled={savingRoleFor === item.userId}
                          onClick={() => void handleRoleSave(item.userId)}
                          size="sm"
                          type="button"
                        >
                          {savingRoleFor === item.userId ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell className="py-10 text-center text-muted-foreground" colSpan={6}>
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          Loading staff members...
                        </span>
                      ) : (
                        'No staff members matched the current filters.'
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <PaginationFooter
              isLoading={isLoading}
              itemCount={staffResult?.items.length ?? 0}
              onNext={() => setPageNumber((current) => current + 1)}
              onPrevious={() => setPageNumber((current) => Math.max(1, current - 1))}
              pageNumber={pageNumber}
              pageSize={10}
              totalPages={staffResult?.totalPages ?? 1}
              totalRecords={staffResult?.totalRecords ?? 0}
            />
          </CardContent>
        </Card>

        <Dialog onOpenChange={setIsRegisterOpen} open={isRegisterOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register staff</DialogTitle>
              <DialogDescription>
                Create a staff account using the existing backend auth and role assignment flow.
              </DialogDescription>
            </DialogHeader>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="staff-full-name">Full name</Label>
                  <Input id="staff-full-name" onChange={(event) => updateForm('fullName', event.target.value)} required value={form.fullName} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input id="staff-email" onChange={(event) => updateForm('email', event.target.value)} required type="email" value={form.email} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-password">Password</Label>
                  <Input id="staff-password" minLength={8} onChange={(event) => updateForm('password', event.target.value)} required type="password" value={form.password} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-phone">Phone number</Label>
                  <Input id="staff-phone" onChange={(event) => updateForm('phoneNumber', event.target.value)} value={form.phoneNumber ?? ''} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-job-title">Job title</Label>
                  <Input id="staff-job-title" onChange={(event) => updateForm('jobTitle', event.target.value)} required value={form.jobTitle} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-hire-date">Hire date</Label>
                  <Input id="staff-hire-date" onChange={(event) => updateForm('hireDate', event.target.value)} type="date" value={form.hireDate ?? ''} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="staff-photo-url">Profile photo URL</Label>
                <Input id="staff-photo-url" onChange={(event) => updateForm('profilePhotoUrl', event.target.value)} value={form.profilePhotoUrl ?? ''} />
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={() => setIsRegisterOpen(false)} type="button" variant="outline">
                  Cancel
                </Button>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Creating account...' : 'Create staff account'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <StaffProfileDialog
          onOpenChange={(open) => {
            if (!open) {
              setSelectedStaffUserId(null)
            }
          }}
          open={selectedStaffUserId !== null}
          userId={selectedStaffUserId}
        />
      </div>
    </PageSection>
  )
}
