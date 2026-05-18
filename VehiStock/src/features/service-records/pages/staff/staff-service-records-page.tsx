import { useState } from 'react'
import { FileText, Car, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateOnly } from '@/utils/date'

// Mock Data
const MOCK_RECORDS = [
  { id: 5001, customer: 'John Doe', vehicle: 'Toyota Corolla (BA 1 PA 1234)', serviceDate: new Date().toISOString(), status: 'ReadyForBilling', laborCharge: 1500, partsCharge: 5000, totalCharge: 6500, diagnosis: 'Brake pads worn out', workDone: 'Replaced front brake pads' },
  { id: 5002, customer: 'Alice Smith', vehicle: 'Honda Civic (BA 2 PA 5678)', serviceDate: new Date(Date.now() - 86400000).toISOString(), status: 'Invoiced', laborCharge: 2000, partsCharge: 0, totalCharge: 2000, diagnosis: 'General Service', workDone: 'Oil change, filter cleaning' },
]

export function StaffServiceRecordsPage() {
  const [records] = useState(MOCK_RECORDS)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Service Records</h1>
        <p className="text-sm text-gray-500 mt-1">Review records generated from completed service appointments.</p>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <FileText size={20} className="text-[var(--vs-green-600)]" />
              Service History
            </CardTitle>
            <CardDescription className="mt-1">Showing {records.length} recent records.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                  <TableHead className="w-24">Record ID</TableHead>
                  <TableHead>Customer & Vehicle</TableHead>
                  <TableHead>Service Details</TableHead>
                  <TableHead>Charges (NPR)</TableHead>
                  <TableHead>Date & Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id} className="hover:bg-gray-50/40">
                    <TableCell className="font-mono text-gray-500">#{r.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{r.customer}</span>
                        <span className="text-xs flex items-center gap-1 text-gray-500 mt-0.5">
                          <Car size={12} /> {r.vehicle}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-800 truncate" title={r.diagnosis}>Dx: {r.diagnosis}</p>
                        <p className="text-xs text-gray-500 truncate" title={r.workDone}>Tx: {r.workDone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="text-gray-500">Labor: {r.laborCharge}</span>
                        <span className="text-gray-500">Parts: {r.partsCharge}</span>
                        <span className="font-bold text-gray-900 mt-1 flex items-center gap-0.5"><DollarSign size={12}/>{r.totalCharge.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="text-sm text-gray-600">{formatDateOnly(r.serviceDate)}</span>
                        <Badge variant="outline" className={r.status === 'ReadyForBilling' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                          {r.status}
                        </Badge>
                      </div>
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
