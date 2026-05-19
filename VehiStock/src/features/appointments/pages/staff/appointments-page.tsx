import * as React from 'react'
import { CalendarDays, CheckCircle2, AlertTriangle, Search, UserCheck, Wrench } from 'lucide-react'
import { toast } from 'sonner'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageSection } from '@/components/shared/page-section'
import {
  getStaffAppointments,
  updateAppointmentStatus,
  assignStaffToAppointment,
  createServiceRecordFromAppointment,
  type StaffAppointment,
} from '@/features/appointments/api/appointments-api'
import { getStaff } from '@/features/staff-management/api/staff-management-api'
import type { StaffSummary } from '@/features/staff-management/types/staff-management'
import { formatDateOnly } from '@/utils/date'
import { ApiError } from '@/types/api'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

function CompleteServiceJobForm({ 
  appointment, 
  onSuccess, 
  onCancel 
}: { 
  appointment: StaffAppointment, 
  onSuccess: () => void, 
  onCancel: () => void 
}) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    diagnosis: '',
    workDone: '',
    laborCharge: 0,
    partsCharge: 0,
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await createServiceRecordFromAppointment({
        appointmentId: appointment.appointmentId,
        diagnosis: formData.diagnosis,
        workDone: formData.workDone,
        laborCharge: Number(formData.laborCharge),
        partsCharge: Number(formData.partsCharge),
        notes: formData.notes
      })
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create service job')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-700">Diagnosis</label>
          <textarea required value={formData.diagnosis} onChange={e => setFormData(p => ({...p, diagnosis: e.target.value}))} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="What was wrong with the vehicle?" rows={2} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Work Done</label>
          <textarea required value={formData.workDone} onChange={e => setFormData(p => ({...p, workDone: e.target.value}))} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="What repairs were performed?" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700">Labor Charge (NPR)</label>
            <input required type="number" min="0" step="0.01" value={formData.laborCharge} onChange={e => setFormData(p => ({...p, laborCharge: Number(e.target.value)}))} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Parts Charge (NPR)</label>
            <input required type="number" min="0" step="0.01" value={formData.partsCharge} onChange={e => setFormData(p => ({...p, partsCharge: Number(e.target.value)}))} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Additional Notes (Optional)</label>
          <input value={formData.notes} onChange={e => setFormData(p => ({...p, notes: e.target.value}))} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Mechanic notes..." />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Service Record
        </Button>
      </div>
    </form>
  )
}

export function AppointmentsPage() {
  const [appointments, setAppointments] = React.useState<StaffAppointment[]>([])
  const [staffList, setStaffList] = React.useState<StaffSummary[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  // Query parameters
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalRecords, setTotalRecords] = React.useState(0)
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [searchText, setSearchText] = React.useState('')
  const [appliedSearch, setAppliedSearch] = React.useState('')
  const [completingAppointment, setCompletingAppointment] = React.useState<StaffAppointment | null>(null)

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const statusParam = statusFilter === 'all' ? undefined : statusFilter
      const searchParam = appliedSearch.trim() || undefined

      const [appointmentsRes, staffRes] = await Promise.all([
        getStaffAppointments(page, 10, statusParam, searchParam),
        getStaff(1, 100).catch(() => ({ items: [] })), // Gracefully fallback if staff management fails
      ])

      setAppointments(appointmentsRes.items)
      setTotalPages(appointmentsRes.totalPages)
      setTotalRecords(appointmentsRes.totalRecords)
      setStaffList(staffRes.items)
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Unable to retrieve appointments database.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, appliedSearch])

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadData()
    })
  }, [loadData])

  const handleStatusChange = async (appointmentId: number, nextStatus: string) => {
    try {
      setError(null)
      await updateAppointmentStatus(appointmentId, nextStatus)
      void loadData()
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Failed to update appointment status.',
      )
    }
  }

  const handleAssignStaff = async (appointmentId: number, staffId: number) => {
    try {
      setError(null)
      await assignStaffToAppointment(appointmentId, staffId)
      void loadData()
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Failed to assign staff member.',
      )
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setAppliedSearch(searchText)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Confirmed</Badge>
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <PageSection
      description="Real-time scheduling and service queue handling connected directly to your workshop database."
      title="Interactive Appointment Board"
    >
      <div className="space-y-6">
        {/* KPI Summaries */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover:border-[var(--vs-green-600)] transition-all">
            <CardHeader className="pb-2">
              <CardDescription>Total Bookings</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <CalendarDays className="size-6 text-[var(--vs-green-600)]" />
                {totalRecords}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="hover:border-[var(--vs-green-600)] transition-all">
            <CardHeader className="pb-2">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle className="text-3xl font-bold text-yellow-600 flex items-center gap-2">
                <AlertTriangle className="size-6 text-yellow-500" />
                {appointments.filter(a => a.status.toLowerCase() === 'pending').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="hover:border-[var(--vs-green-600)] transition-all">
            <CardHeader className="pb-2">
              <CardDescription>Active Confirmed</CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-600 flex items-center gap-2">
                <UserCheck className="size-6 text-blue-500" />
                {appointments.filter(a => a.status.toLowerCase() === 'confirmed').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="hover:border-[var(--vs-green-600)] transition-all">
            <CardHeader className="pb-2">
              <CardDescription>Completed Jobs</CardDescription>
              <CardTitle className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="size-6 text-emerald-500" />
                {appointments.filter(a => a.status.toLowerCase() === 'completed').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Global Error Banner */}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900 rounded-xl">
            <AlertTitle className="font-semibold">Operation Failure</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search & Filter bar */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between">
              {/* Text Search */}
              <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9 rounded-full border-gray-200"
                    placeholder="Search vehicle, service type, or customer..."
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                <Button type="submit" className="rounded-full bg-[var(--vs-green-800)] hover:bg-[var(--vs-green-900)] text-white px-5">
                  Search
                </Button>
              </form>

              {/* Status Filters */}
              <div className="flex flex-wrap gap-1 bg-gray-50 p-1.5 rounded-full border border-gray-100">
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setPage(1)
                      setStatusFilter(filter)
                    }}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full capitalize transition-all ${
                      statusFilter === filter
                        ? 'bg-[var(--vs-green-800)] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workshop Queue Board */}
        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800 font-bold">
              <Wrench className="size-5 text-[var(--vs-green-600)]" />
              Active Servicing Queue
            </CardTitle>
            <CardDescription>Live incoming customer booking entries and assignment controls.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/30">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-700">Vehicle No</TableHead>
                    <TableHead className="font-semibold text-gray-700">Service Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">Problem Description</TableHead>
                    <TableHead className="font-semibold text-gray-700">Preferred Date</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Assigned Staff</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        <span className="animate-pulse">Loading active workshop schedules...</span>
                      </TableCell>
                    </TableRow>
                  ) : appointments.length > 0 ? (
                    appointments.map((a) => (
                      <TableRow key={a.appointmentId} className="hover:bg-gray-50/40 transition-colors">
                        {/* Customer */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{a.customerName}</span>
                            <span className="text-xs text-muted-foreground">{a.customerEmail}</span>
                          </div>
                        </TableCell>
                        
                        {/* Vehicle */}
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-50 border-gray-200">
                            {a.vehicleNumber}
                          </Badge>
                        </TableCell>
                        
                        {/* Service Type */}
                        <TableCell className="font-medium text-gray-800">{a.serviceType}</TableCell>
                        
                        {/* Description */}
                        <TableCell className="max-w-xs truncate text-gray-600 text-sm" title={a.problemDescription}>
                          {a.problemDescription || <span className="text-muted-foreground italic">None provided</span>}
                        </TableCell>
                        
                        {/* Date */}
                        <TableCell className="font-medium text-gray-800">{formatDateOnly(a.preferredDate)}</TableCell>
                        
                        {/* Status */}
                        <TableCell>{getStatusBadge(a.status)}</TableCell>
                        
                        {/* Assigned Staff Selector */}
                        <TableCell>
                          <div className="w-48">
                            <Select
                              value={a.assignedStaffId ? String(a.assignedStaffId) : 'unassigned'}
                              onValueChange={(val) => {
                                if (val !== 'unassigned') {
                                  void handleAssignStaff(a.appointmentId, Number(val))
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200">
                                <SelectValue placeholder="Unassigned" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned" disabled className="text-xs text-muted-foreground">Unassigned</SelectItem>
                                {staffList.map((s) => (
                                  <SelectItem key={s.staffMemberId} value={String(s.staffMemberId)} className="text-xs">
                                    {s.fullName} ({s.jobTitle})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>

                        {/* Status Actions */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {a.status.toLowerCase() === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50"
                                  onClick={() => void handleStatusChange(a.appointmentId, 'Confirmed')}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 rounded-lg border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => void handleStatusChange(a.appointmentId, 'Cancelled')}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {a.status.toLowerCase() === 'confirmed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => setCompletingAppointment(a)}
                                >
                                  Complete Service Job
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 rounded-lg border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => void handleStatusChange(a.appointmentId, 'Cancelled')}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {(a.status.toLowerCase() === 'completed' || a.status.toLowerCase() === 'cancelled') && (
                              <span className="text-xs text-muted-foreground italic px-2">Archived</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        No appointments found matching the filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/20">
                <p className="text-xs font-semibold text-gray-500">
                  Page {page} of {totalPages} ({totalRecords} entries)
                </p>
                <div className="flex gap-2">
                  <Button
                    disabled={page <= 1}
                    onClick={() => {
                      setPage((current) => Math.max(1, current - 1))
                    }}
                    size="sm"
                    className="h-8 px-3 rounded-lg border-gray-200 hover:bg-gray-100"
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={page >= totalPages}
                    onClick={() => {
                      setPage((current) => current + 1)
                    }}
                    size="sm"
                    className="h-8 px-3 rounded-lg border-gray-200 hover:bg-gray-100"
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!completingAppointment} onOpenChange={(open) => !open && setCompletingAppointment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Service Job</DialogTitle>
            <DialogDescription>
              Record the diagnosis and charges for {completingAppointment?.vehicleNumber}. This will generate a Service Record ready for billing.
            </DialogDescription>
          </DialogHeader>
          {completingAppointment && (
            <CompleteServiceJobForm
              appointment={completingAppointment}
              onCancel={() => setCompletingAppointment(null)}
              onSuccess={() => {
                toast.success('Service job completed successfully!')
                setCompletingAppointment(null)
                void loadData()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageSection>
  )
}
