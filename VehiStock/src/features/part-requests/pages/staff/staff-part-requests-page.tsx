import { useState } from 'react'
import { ShoppingCart, CheckCircle, XCircle, Clock } from 'lucide-react'
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

// Mock Data
const MOCK_REQUESTS = [
  { id: 101, customerName: 'John Doe', partName: 'Toyota Corolla 2020 Alternator', quantity: 1, status: 'Pending', date: new Date().toISOString(), notes: 'Urgent' },
  { id: 102, customerName: 'Alice Smith', partName: 'Honda Civic Brake Pads', quantity: 4, status: 'Approved', date: new Date(Date.now() - 86400000).toISOString(), notes: '' },
  { id: 103, customerName: 'Bob Johnson', partName: 'Nissan Sunny AC Compressor', quantity: 1, status: 'Rejected', date: new Date(Date.now() - 172800000).toISOString(), notes: 'Too expensive' },
]

export function StaffPartRequestsPage() {
  const [requests, setRequests] = useState(MOCK_REQUESTS)

  const handleUpdateStatus = (id: number, newStatus: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    toast.success(`Request #${id} marked as ${newStatus}`)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Part Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage special part requests from customers.</p>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <ShoppingCart size={20} className="text-[var(--vs-green-600)]" />
              Customer Requests
            </CardTitle>
            <CardDescription className="mt-1">Showing all recent requests.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                  <TableHead className="w-20">Req ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Part Details</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-gray-500">#{r.id}</TableCell>
                    <TableCell className="font-medium text-gray-900">{r.customerName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{r.partName}</span>
                        <span className="text-xs text-gray-500">Qty: {r.quantity} {r.notes && `• Note: ${r.notes}`}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDateOnly(r.date)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'Pending' ? 'outline' : r.status === 'Approved' ? 'default' : 'destructive'}
                        className={r.status === 'Pending' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' : r.status === 'Approved' ? 'bg-emerald-500' : ''}>
                        {r.status === 'Pending' && <Clock size={12} className="mr-1 inline" />}
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleUpdateStatus(r.id, 'Approved')}>
                            <CheckCircle size={16} />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleUpdateStatus(r.id, 'Rejected')}>
                            <XCircle size={16} />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
