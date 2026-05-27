import { useState, useEffect } from 'react'
import { ShoppingCart, CheckCircle, XCircle, Clock, Truck, PackageCheck, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateOnly } from '@/utils/date'
import { toast } from 'sonner'
import { getAdminPartRequests, updatePartRequestStatus } from '../../api/part-requests-api'
import type { PartRequest } from '../../types/part-requests'

export function StaffPartRequestsPage() {
  const [requests, setRequests] = useState<PartRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await getAdminPartRequests({
        pageNumber,
        pageSize: 10,
        status: statusFilter || undefined,
      })
      setRequests(res.items)
      setTotalPages(res.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch part requests', error)
      toast.error('Failed to load part requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [pageNumber, statusFilter])

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const updated = await updatePartRequestStatus(id, newStatus)
      setRequests(prev => prev.map(r => r.partRequestId === id ? updated : r))
      toast.success(`Request #${id} marked as ${newStatus}`)
    } catch (error) {
      console.error('Failed to update status', error)
      toast.error('Failed to update request status')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <Badge variant="outline" className="border-yellow-200 text-yellow-700 bg-yellow-50">
            <Clock size={12} className="mr-1 inline" />
            Pending
          </Badge>
        )
      case 'Ordered':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            <Truck size={12} className="mr-1 inline" />
            Ordered
          </Badge>
        )
      case 'Fulfilled':
        return (
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
            <PackageCheck size={12} className="mr-1 inline" />
            Fulfilled
          </Badge>
        )
      case 'Cancelled':
        return (
          <Badge variant="destructive">
            <XCircle size={12} className="mr-1 inline" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Part Requests Management</h1>
          <p className="text-sm text-gray-500 mt-1">Review customer part requests and update fulfillment status.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => { setPageNumber(1); fetchRequests(); }} 
            disabled={loading}
            className="flex items-center gap-2 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <ShoppingCart size={20} className="text-emerald-600" />
              Customer Requests
            </CardTitle>
            <CardDescription className="mt-1">Showing all customer part orders and inquiries.</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPageNumber(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Ordered">Ordered</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                  <TableHead className="w-20">Req ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle Details</TableHead>
                  <TableHead>Requested Part</TableHead>
                  <TableHead className="w-20">Photo</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading requests...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                      No part requests found matching your filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((r) => (
                    <TableRow key={r.partRequestId} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-mono text-gray-500">#{r.partRequestId}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{r.customerName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{r.customerPhone || r.customerEmail}</div>
                      </TableCell>
                      <TableCell>
                        {r.vehicleNumber ? (
                          <div>
                            <div className="font-semibold text-gray-800">{r.vehicleNumber}</div>
                            <div className="text-xs text-gray-500">{r.vehicleMake} {r.vehicleModel}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">General Request</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{r.requestedPartName}</span>
                          <span className="text-xs text-gray-500">
                            Qty: {r.quantity} {r.details && `• Note: ${r.details}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.photoUrl ? (
                          <a href={r.photoUrl} target="_blank" rel="noreferrer">
                            <img
                              src={r.photoUrl}
                              alt="Part"
                              className="h-10 w-10 rounded-lg object-cover border border-gray-200 hover:opacity-80 transition-opacity"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDateOnly(r.requestDate)}</TableCell>
                      <TableCell>
                        {getStatusBadge(r.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {r.status === 'Pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2.5 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50" 
                                onClick={() => handleUpdateStatus(r.partRequestId, 'Ordered')}
                              >
                                <Truck size={14} className="mr-1" />
                                Order
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2.5 text-xs font-medium text-emerald-600 border-emerald-200 hover:bg-emerald-50" 
                                onClick={() => handleUpdateStatus(r.partRequestId, 'Fulfilled')}
                              >
                                <PackageCheck size={14} className="mr-1" />
                                Fulfill
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2.5 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50" 
                                onClick={() => handleUpdateStatus(r.partRequestId, 'Cancelled')}
                              >
                                <XCircle size={14} className="mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {r.status === 'Ordered' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2.5 text-xs font-medium text-emerald-600 border-emerald-200 hover:bg-emerald-50" 
                                onClick={() => handleUpdateStatus(r.partRequestId, 'Fulfilled')}
                              >
                                <PackageCheck size={14} className="mr-1" />
                                Fulfill
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2.5 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50" 
                                onClick={() => handleUpdateStatus(r.partRequestId, 'Cancelled')}
                              >
                                <XCircle size={14} className="mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
              <div className="text-xs text-gray-500">
                Page {pageNumber} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber === 1}
                  onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                  className="text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber === totalPages}
                  onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
