import * as React from 'react'
import { Plus, Loader2, FileText, X, ArrowLeft, Building2, Hash, CalendarDays, CreditCard, ReceiptText, Tag, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPurchaseInvoice, PaymentStatus } from '../../api/purchase-invoices-api'
import { getAllParts } from '@/features/inventory/api/inventory-api'
import { getAllVendors } from '@/features/vendors/api/vendors-api'

export function AddPurchaseInvoicePage() {
  const navigate = useNavigate()

  const [vendors, setVendors] = React.useState<{ vendorId: number; vendorName: string }[]>([])
  const [parts, setParts] = React.useState<{ partId: number; partName: string; unitCost: number; unitPrice: number }[]>([])

  const [formData, setFormData] = React.useState({
    vendorId: '',
    invoiceNo: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    taxAmount: '0',
    discountAmount: '0',
    paymentStatus: PaymentStatus.Paid as number,
    notes: '',
  })
  const [invoiceItems, setInvoiceItems] = React.useState<{ partId: string; quantity: string; unitCost: string; unitPrice: string }[]>([])
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    getAllVendors('', 1, 100).then(res => setVendors(res?.items || [])).catch(console.error)
    getAllParts('', 1, 100).then(res => setParts(res?.items || [])).catch(console.error)
  }, [])

  const handleAddItem = () => {
    setInvoiceItems(prev => [...prev, { partId: '', quantity: '1', unitCost: '0', unitPrice: '0' }])
  }

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: string) => {
    setInvoiceItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      if (field === 'partId' && value) {
        const p = parts.find(p => p.partId.toString() === value)
        if (p) {
          next[index].unitCost = p.unitCost.toString()
          next[index].unitPrice = (p.unitPrice ?? 0).toString()
        }
      }
      return next
    })
  }

  const subtotal = invoiceItems.reduce((s, i) => s + Number(i.quantity) * Number(i.unitCost), 0)
  const total = subtotal + Number(formData.taxAmount) - Number(formData.discountAmount)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (invoiceItems.length === 0) { setError('Please add at least one line item.'); return }
    setError(null)
    setIsSaving(true)
    try {
      await createPurchaseInvoice({
        vendorId: Number(formData.vendorId),
        invoiceNo: formData.invoiceNo,
        purchaseDate: new Date(formData.purchaseDate).toISOString(),
        taxAmount: Number(formData.taxAmount),
        discountAmount: Number(formData.discountAmount),
        paymentStatus: Number(formData.paymentStatus),
        notes: formData.notes,
        items: invoiceItems.map(i => ({
          partId: Number(i.partId),
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
          unitPrice: Number(i.unitPrice)
        })),
      })
      sessionStorage.setItem('invoice_saved', '1')
      navigate('/admin/purchase-invoices')
    } catch (err: any) {
      setError(err?.message || 'Failed to save invoice.')
    } finally {
      setIsSaving(false)
    }
  }

  const field = (label: string, icon: React.ReactNode, children: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
        {icon}{label}
      </Label>
      {children}
    </div>
  )

  const inputCls = "h-11 bg-white border-gray-200 rounded-xl text-sm focus-visible:ring-emerald-500 shadow-sm"
  const selectCls = "flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* ── TOP BAR ── */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/purchase-invoices')}
          className="size-9 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Purchase Invoice</h1>
          <p className="text-sm text-gray-400 mt-0.5">Vendor procurement · stock auto-updates on save</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">Auto stock sync</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
          <X className="size-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* ══ LEFT COLUMN ══ */}
          <div className="space-y-5">

            {/* INVOICE DETAILS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-1 flex items-center gap-2 border-b border-gray-50">
                <div className="size-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FileText className="size-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Invoice Details</span>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {field('Vendor', <Building2 className="size-3" />,
                  <select required className={selectCls} value={formData.vendorId}
                    onChange={e => setFormData(f => ({ ...f, vendorId: e.target.value }))}>
                    <option value="">Select vendor…</option>
                    {vendors.map(v => <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>)}
                  </select>
                )}
                {field('Invoice Number', <Hash className="size-3" />,
                  <Input required placeholder="INV-001" className={inputCls}
                    value={formData.invoiceNo} onChange={e => setFormData(f => ({ ...f, invoiceNo: e.target.value }))} />
                )}
                {field('Purchase Date', <CalendarDays className="size-3" />,
                  <Input required type="date" className={inputCls}
                    value={formData.purchaseDate} onChange={e => setFormData(f => ({ ...f, purchaseDate: e.target.value }))} />
                )}
                {field('Payment Status', <CreditCard className="size-3" />,
                  <select className={selectCls} value={formData.paymentStatus}
                    onChange={e => setFormData(f => ({ ...f, paymentStatus: Number(e.target.value) }))}>
                    <option value={PaymentStatus.Paid}>Paid</option>
                    <option value={PaymentStatus.Unpaid}>Unpaid</option>
                    <option value={PaymentStatus.Partial}>Partial</option>
                  </select>
                )}
              </div>
            </div>

            {/* LINE ITEMS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-1 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <ShoppingBag className="size-3.5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Line Items</span>
                  {invoiceItems.length > 0 && (
                    <span className="size-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">{invoiceItems.length}</span>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}
                  className="h-8 text-xs rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold">
                  <Plus className="size-3 mr-1" /> Add Item
                </Button>
              </div>

              <div className="p-6">
                {invoiceItems.length === 0 ? (
                  <div onClick={handleAddItem}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400 text-sm hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                    <ShoppingBag className="size-8 mx-auto mb-2 text-gray-300 group-hover:text-emerald-400 transition-colors" />
                    <p className="font-medium">No items yet</p>
                    <p className="text-xs mt-1 text-gray-400">Click here or <strong className="text-emerald-600">Add Item</strong> to begin</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_80px_110px_110px_36px] gap-3 px-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Part</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unit Cost (Buy)</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unit Price (Sell)</span>
                      <span />
                    </div>
                    {invoiceItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_80px_110px_110px_36px] items-center gap-3 bg-gray-50/80 rounded-xl px-3 py-3 border border-gray-100 hover:border-emerald-100 transition-colors">
                        <select required className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={item.partId} onChange={e => handleItemChange(idx, 'partId', e.target.value)}>
                          <option value="">Select part…</option>
                          {parts.map(p => <option key={p.partId} value={p.partId}>{p.partName}</option>)}
                        </select>
                        <Input required type="number" min="1" className="h-10 rounded-lg text-sm border-gray-200 bg-white"
                          value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">Rs.</span>
                          <Input required type="number" min="0" className="h-10 rounded-lg text-sm border-gray-200 bg-white pl-8"
                            value={item.unitCost} onChange={e => handleItemChange(idx, 'unitCost', e.target.value)} />
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">Rs.</span>
                          <Input required type="number" min="0" className="h-10 rounded-lg text-sm border-gray-200 bg-white pl-8"
                            value={item.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} />
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(idx)}
                          className="size-9 rounded-lg flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* NOTES */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-1 flex items-center gap-2 border-b border-gray-50">
                <div className="size-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ReceiptText className="size-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Notes</span>
                <span className="text-[10px] text-gray-400 font-normal ml-1">(optional)</span>
              </div>
              <div className="p-6">
                <textarea rows={3} className="flex w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="Add internal notes about this purchase…"
                  value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* ══ RIGHT COLUMN — Summary ══ */}
          <div className="space-y-4">

            {/* Financials */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-1 flex items-center gap-2 border-b border-gray-50">
                <div className="size-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Tag className="size-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Financials</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600">Tax Amount (Rs)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">Rs.</span>
                    <Input type="number" min="0" step="0.01" className="h-11 rounded-xl border-gray-200 bg-gray-50/50 pl-8 shadow-sm"
                      value={formData.taxAmount} onChange={e => setFormData(f => ({ ...f, taxAmount: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600">Discount Amount (Rs)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">Rs.</span>
                    <Input type="number" min="0" step="0.01" className="h-11 rounded-xl border-gray-200 bg-gray-50/50 pl-8 shadow-sm"
                      value={formData.discountAmount} onChange={e => setFormData(f => ({ ...f, discountAmount: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Order Summary</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-800">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-semibold text-emerald-600">+ Rs. {Number(formData.taxAmount).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-semibold text-rose-500">− Rs. {Number(formData.discountAmount).toLocaleString()}</span>
                </div>
                <div className="h-px bg-gray-100 my-1" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-emerald-700">Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button type="submit" disabled={isSaving || invoiceItems.length === 0}
                className="w-full h-12 bg-[#1f734a] hover:bg-[#165a38] text-white rounded-xl font-bold text-sm shadow-sm">
                {isSaving
                  ? <><Loader2 className="size-4 animate-spin mr-2" /> Saving…</>
                  : <><FileText className="size-4 mr-2" /> Save Invoice</>
                }
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/admin/purchase-invoices')}
                className="w-full h-11 rounded-xl text-sm font-medium">
                Cancel
              </Button>
            </div>

            {invoiceItems.length === 0 && (
              <p className="text-center text-xs text-gray-400">Add at least one line item to save.</p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
