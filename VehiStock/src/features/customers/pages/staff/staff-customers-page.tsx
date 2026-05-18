import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Users, Loader2, Car, MapPin, Mail, Phone, Calendar, History, FileText, Settings, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { registerCustomer } from '@/features/auth/api/auth-api'
import { createVehicleForCustomer } from '@/features/vehicles/api/vehicles-api'
import { searchStaffCustomers, getCustomerHistory, type StaffCustomer, type StaffCustomerHistoryResponse } from '@/features/customers/api/customers-api'
import { formatDateOnly, formatDateTime } from '@/utils/date'
import { ApiError } from '@/types/api'

function CustomerHistoryModal({ customerId, onClose }: { customerId: number, onClose: () => void }) {
  const [history, setHistory] = useState<StaffCustomerHistoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getCustomerHistory(customerId)
        setHistory(data)
      } catch (err: any) {
        toast.error(err.message || 'Failed to load customer history')
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [customerId])

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-[var(--vs-green-600)]" /></div>
  }

  if (!history) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-1">Total Lifetime Spent</h4>
          <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
            <DollarSign size={20} className="text-[var(--vs-green-600)]" />
            {history.totalSpent.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-sm text-gray-600">
          <span className="flex items-center gap-2"><Mail size={14} /> {history.email}</span>
          <span className="flex items-center gap-2"><Phone size={14} /> {history.phoneNumber || 'N/A'}</span>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <History size={16} /> Interaction History
        </h4>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {history.historyItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No past interactions found for this customer.</p>
          ) : (
            history.historyItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${item.type === 'SalesInvoice' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {item.type === 'SalesInvoice' ? <FileText size={16} /> : <Settings size={16} />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(item.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-900">NPR {item.amount.toLocaleString()}</p>
                  <Badge variant="outline" className="mt-1 text-[10px] bg-gray-50">{item.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="flex justify-end border-t pt-4">
        <Button onClick={onClose} variant="outline">Close History</Button>
      </div>
    </div>
  )
}

function RegisterCustomerForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phoneNumber: '', address: '',
    vehicleNumber: '', make: '', model: '', manufactureYear: new Date().getFullYear(), mileageKm: 0,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const authRes = await registerCustomer({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
      })

      if (!authRes.succeeded || !authRes.customerId) {
        toast.error(authRes.errors?.join(', ') || 'Failed to register customer')
        return
      }

      await createVehicleForCustomer(authRes.customerId, {
        vehicleNumber: formData.vehicleNumber,
        make: formData.make,
        model: formData.model,
        manufactureYear: Number(formData.manufactureYear),
        mileageKm: Number(formData.mileageKm),
        engineNo: '',
        chassisNo: '',
        notes: '',
      })

      toast.success('Customer and vehicle registered successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during registration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Full Name</label>
          <input required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Email</label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Password</label>
          <input required type="password" minLength={8} name="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Phone</label>
          <input required name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-gray-700">Address</label>
          <input required name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
      </div>
      
      <div className="border-t pt-4 mt-2">
        <h4 className="font-semibold text-sm mb-3 text-gray-700">Vehicle Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Vehicle Number</label>
            <input required name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="e.g. BA 1 PA 1234" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Make</label>
            <input required name="make" value={formData.make} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="e.g. Toyota" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Model</label>
            <input required name="model" value={formData.model} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="e.g. Corolla" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Year</label>
            <input required type="number" name="manufactureYear" value={formData.manufactureYear} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <DialogClose asChild>
          <Button variant="outline" type="button">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register Customer
        </Button>
      </div>
    </form>
  )
}

export function StaffCustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewingHistoryId, setViewingHistoryId] = useState<number | null>(null)
  
  const [customers, setCustomers] = useState<StaffCustomer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await searchStaffCustomers(page, 10, appliedSearch || undefined)
      setCustomers(res.items)
      setTotalPages(res.totalPages)
      setTotalRecords(res.totalRecords)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }, [page, appliedSearch])

  useEffect(() => {
    queueMicrotask(() => {
      void loadData()
    })
  }, [loadData])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customers Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Search customers by ID, Name, Phone, or Vehicle Number.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button className="tb-btn primary shadow-md hover:shadow-lg transition-all duration-300">
              <Plus size={16} className="mr-2" />
              Register Customer
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Register New Customer</DialogTitle>
              <DialogDescription>
                Fill in the details below to register a new customer and their vehicle.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <RegisterCustomerForm onSuccess={() => {
                setIsModalOpen(false)
                void loadData()
              }} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 bg-gray-50/50 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <Users size={20} className="text-[var(--vs-green-600)]" />
                Customer Database
              </CardTitle>
              <CardDescription className="mt-1">Total {totalRecords} records found.</CardDescription>
            </div>
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by ID, Name, Phone, or Vehicle..."
                className="w-full pl-9 pr-20 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vs-green-500)]/50 transition-all duration-300 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button type="submit" size="sm" className="absolute right-1 top-1 h-7 rounded-full bg-[var(--vs-green-800)] hover:bg-[var(--vs-green-900)] text-xs px-3">
                Search
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700 w-20">ID</TableHead>
                  <TableHead className="font-semibold text-gray-700">Customer Details</TableHead>
                  <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                  <TableHead className="font-semibold text-gray-700 min-w-[200px]">Vehicles</TableHead>
                  <TableHead className="font-semibold text-gray-700">Registered</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[var(--vs-green-600)]" />
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : customers.length > 0 ? (
                  customers.map((c) => (
                    <TableRow key={c.customerId} className="hover:bg-gray-50/40 transition-colors">
                      <TableCell className="font-mono text-gray-500">#{c.customerId}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{c.fullName}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {c.address}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm flex items-center gap-1.5 text-gray-600">
                            <Mail size={12} /> {c.email}
                          </span>
                          <span className="text-sm flex items-center gap-1.5 text-gray-600">
                            <Phone size={12} /> {c.phoneNumber || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 py-1">
                          {c.vehicles.length > 0 ? c.vehicles.map((v) => (
                            <div key={v.vehicleId} className="flex items-center gap-2 border border-gray-100 bg-white px-2 py-1 rounded-md shadow-sm">
                              <Car size={12} className="text-gray-400" />
                              <Badge variant="outline" className="text-[10px] font-mono tracking-wider bg-gray-50">{v.vehicleNumber}</Badge>
                              <span className="text-xs text-gray-600 font-medium">{v.make} {v.model}</span>
                            </div>
                          )) : (
                            <span className="text-xs text-muted-foreground italic">No vehicles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm flex items-center gap-1.5 text-gray-600">
                          <Calendar size={12} /> {formatDateOnly(c.registeredAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setViewingHistoryId(c.customerId)}
                          className="h-8 text-xs text-[var(--vs-green-700)] border-[var(--vs-green-200)] hover:bg-[var(--vs-green-50)]"
                        >
                          <History size={14} className="mr-1.5" /> History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-gray-500">
                      <Users size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
                      <p className="text-sm mt-1">Try adjusting your search criteria.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalRecords > 0 && (
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/20">
              <p className="text-xs font-semibold text-gray-500">
                Showing {Math.min(totalRecords, (page - 1) * 10 + 1)} to {Math.min(totalRecords, page * 10)} of {totalRecords} records
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  size="sm" variant="outline" className="h-8 px-3"
                >
                  Previous
                </Button>
                
                {Array.from({ length: totalPages || 1 }).map((_, index) => {
                  const p = index + 1
                  return (
                    <Button
                      type="button"
                      key={p}
                      onClick={() => setPage(p)}
                      variant={page === p ? 'default' : 'outline'}
                      size="sm"
                      className={`h-8 w-8 p-0 font-semibold ${
                        page === p 
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white border-emerald-600 shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-gray-200'
                      }`}
                    >
                      {p}
                    </Button>
                  )
                })}

                <Button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  size="sm" variant="outline" className="h-8 px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer History Modal */}
      <Dialog open={!!viewingHistoryId} onOpenChange={(open) => !open && setViewingHistoryId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Profile & History</DialogTitle>
            <DialogDescription>
              A complete overview of the customer's interactions, purchases, and services.
            </DialogDescription>
          </DialogHeader>
          {viewingHistoryId && (
            <div className="py-2">
              <CustomerHistoryModal 
                customerId={viewingHistoryId} 
                onClose={() => setViewingHistoryId(null)} 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
