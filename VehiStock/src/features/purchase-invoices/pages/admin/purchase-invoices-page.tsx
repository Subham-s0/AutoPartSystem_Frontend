import * as React from 'react'
import { Plus, Search, FileText, Loader2, Calendar, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getAllPurchaseInvoices, type PurchaseInvoiceDto, paymentStatusLabel, isPaid } from '../../api/purchase-invoices-api'

export function PurchaseInvoicesPage() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = React.useState<PurchaseInvoiceDto[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [toast, setToast] = React.useState<string | null>(null)

  const fetchInvoices = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getAllPurchaseInvoices()
      setInvoices(res || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchInvoices()
    // Show success toast if redirected back after saving
    const saved = sessionStorage.getItem('invoice_saved')
    if (saved) {
      setToast('Purchase invoice saved and stock updated!')
      sessionStorage.removeItem('invoice_saved')
      setTimeout(() => setToast(null), 3000)
    }
  }, [fetchInvoices])

  const filteredInvoices = invoices.filter(inv =>
    (inv.invoiceNo ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (inv.vendorName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 bg-emerald-600 text-white">
          <CheckCircle className="size-4 shrink-0" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Purchase Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Create purchase invoices and automatically update inventory stock.</p>
        </div>
        <Button
          onClick={() => navigate('/admin/purchase-invoices/add')}
          className="bg-[#1f734a] hover:bg-[#165a38] text-white rounded-lg self-start sm:self-auto"
        >
          <Plus className="size-4 mr-2" />
          Add Invoice
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Search by invoice number or vendor..."
          className="pl-9 bg-gray-50/50 border-gray-200 rounded-xl h-11 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">INVOICE NO</th>
                <th className="px-6 py-4">VENDOR</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">TOTAL AMOUNT</th>
                <th className="px-6 py-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Loader2 className="size-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">No purchase invoices found.</td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.purchaseInvoiceId} className="hover:bg-gray-50/30 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-bold text-emerald-800">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-emerald-600 shrink-0" />
                        {invoice.invoiceNo}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{invoice.vendorName || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        {invoice.purchaseDate
                          ? new Date(invoice.purchaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-700">Rs. {(invoice.totalAmount ?? 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Badge className={isPaid(invoice.paymentStatus)
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-50 border-none'}>
                        {paymentStatusLabel(invoice.paymentStatus)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredInvoices.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between text-xs text-gray-500">
            <div>Showing 1 to {filteredInvoices.length} of {filteredInvoices.length} results</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 rounded-lg bg-white" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="h-8 rounded-lg bg-white" disabled>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
