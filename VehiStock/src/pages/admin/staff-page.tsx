import * as React from 'react'
import { ShieldCheck } from 'lucide-react'
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
import { registerStaff } from '@/features/auth/api/auth-api'
import { getStaff, updateStaffRole } from '@/features/staff-management/api/staff-management-api'
import type { RegisterStaffInput, StaffSummary } from '@/features/staff-management/types/staff-management'
import { formatDateOnly } from '@/lib/date'
import { ROLE_NAMES } from '@/constants/roles'
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

function getRoleBadgeVariant(role: string) {
  return role === ROLE_NAMES.admin ? 'default' : 'secondary'
}

export function StaffPage() {
  const [form, setForm] = React.useState<RegisterStaffInput>(initialForm)
  const [staffResult, setStaffResult] = React.useState<PaginatedResponse<StaffSummary> | null>(null)
  const [pageNumber, setPageNumber] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [roleDrafts, setRoleDrafts] = React.useState<Record<string, string>>({})
  const [savingRoleFor, setSavingRoleFor] = React.useState<string | null>(null)

  const loadStaff = React.useCallback(async (nextPage = pageNumber) => {
    try {
      setError(null)
      const result = await getStaff(nextPage, 10)
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
  }, [pageNumber])

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadStaff(pageNumber)
    })
  }, [loadStaff, pageNumber])

  function updateForm<K extends keyof RegisterStaffInput>(
    key: K,
    value: RegisterStaffInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
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
      setSuccessMessage('Staff account created successfully.')
      setPageNumber(1)
      setIsLoading(true)
      await loadStaff(1)
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
              items: current.items.map((item) =>
                item.userId === userId ? updated : item,
              ),
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

  const totalPages = staffResult?.totalPages ?? 1

  return (
    <PageSection
      description="Register staff accounts and manage the assigned access role for active team members."
      title="Staff Access"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Register staff
            </CardTitle>
            <CardDescription>
              Create staff accounts through the current backend auth flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="staff-full-name">Full name</Label>
                  <Input
                    id="staff-full-name"
                    onChange={(event) => updateForm('fullName', event.target.value)}
                    placeholder="Staff full name"
                    required
                    value={form.fullName}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    onChange={(event) => updateForm('email', event.target.value)}
                    placeholder="staff@vehistock.com"
                    required
                    type="email"
                    value={form.email}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="staff-password">Password</Label>
                  <Input
                    id="staff-password"
                    minLength={8}
                    onChange={(event) => updateForm('password', event.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    type="password"
                    value={form.password}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="staff-phone">Phone number</Label>
                    <Input
                      id="staff-phone"
                      onChange={(event) => updateForm('phoneNumber', event.target.value)}
                      placeholder="Optional"
                      value={form.phoneNumber ?? ''}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="staff-job-title">Job title</Label>
                    <Input
                      id="staff-job-title"
                      onChange={(event) => updateForm('jobTitle', event.target.value)}
                      placeholder="Service advisor"
                      required
                      value={form.jobTitle}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="staff-hire-date">Hire date</Label>
                    <Input
                      id="staff-hire-date"
                      onChange={(event) => updateForm('hireDate', event.target.value)}
                      type="date"
                      value={form.hireDate ?? ''}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="staff-photo-url">Profile photo URL</Label>
                    <Input
                      id="staff-photo-url"
                      onChange={(event) => updateForm('profilePhotoUrl', event.target.value)}
                      placeholder="Optional"
                      value={form.profilePhotoUrl ?? ''}
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Creating account...' : 'Create staff account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current staff</CardTitle>
            <CardDescription>
              Review active staff records and update role assignments.
            </CardDescription>
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
                  <TableHead>Role</TableHead>
                  <TableHead>Job title</TableHead>
                  <TableHead>Hire date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffResult?.items.length ? (
                  staffResult.items.map((item) => (
                    <TableRow key={item.userId}>
                      <TableCell className="align-top">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.fullName}</span>
                          <span className="text-muted-foreground">{item.email}</span>
                          <span className="text-xs text-muted-foreground">
                            Staff ID #{item.staffMemberId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <Badge variant={getRoleBadgeVariant(item.role)}>
                            {item.role}
                          </Badge>
                          <Select
                            onValueChange={(value) =>
                              setRoleDrafts((current) => ({
                                ...current,
                                [item.userId]: value,
                              }))
                            }
                            value={roleDrafts[item.userId] ?? item.role}
                          >
                            <SelectTrigger className="w-full min-w-32">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ROLE_NAMES.staff}>Staff</SelectItem>
                              <SelectItem value={ROLE_NAMES.admin}>Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>{item.jobTitle}</TableCell>
                      <TableCell>{formatDateOnly(item.hireDate)}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'secondary' : 'outline'}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          disabled={savingRoleFor === item.userId}
                          onClick={() => void handleRoleSave(item.userId)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          {savingRoleFor === item.userId ? 'Saving...' : 'Save'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={6}>
                      {isLoading ? 'Loading staff members...' : 'No staff members found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {staffResult?.pageNumber ?? pageNumber} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  disabled={pageNumber <= 1}
                  onClick={() => {
                    setIsLoading(true)
                    setPageNumber((current) => Math.max(1, current - 1))
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  disabled={pageNumber >= totalPages}
                  onClick={() => {
                    setIsLoading(true)
                    setPageNumber((current) => current + 1)
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
      </div>
    </PageSection>
  )
}
