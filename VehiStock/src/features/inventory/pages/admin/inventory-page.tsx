import * as React from 'react'
import { Plus, Search, Image as ImageIcon, Loader2, Edit, Trash2, CheckCircle, Package, AlertTriangle, ArrowLeft, Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { getAllParts, createPart, updatePart, deletePart, getPartCategories } from '../../api/inventory-api'
import type { Part } from '../../types/inventory'

const BASE_URL = 'http://localhost:5000'

function fullPhotoUrl(url?: string | null) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${BASE_URL}${url}`
}

const EMPTY_FORM = {
  partCode: '',
  partName: '',
  brand: '',
  partCategoryId: 1,
  unitCost: '',
  unitPrice: '',
  stockQty: '',
  minimumStock: '',
  isActive: true,
}

export function InventoryPage() {
  const [parts, setParts] = React.useState<Part[]>([])
  const [totalRecords, setTotalRecords] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  // View state: 'list' | 'add' | 'edit'
  const [view, setView] = React.useState<'list' | 'add' | 'edit'>('list')
  const [editTarget, setEditTarget] = React.useState<Part | null>(null)

  const [categories, setCategories] = React.useState<{ id: number; name: string }[]>([])
  const [formData, setFormData] = React.useState(EMPTY_FORM)
  const [photoFile, setPhotoFile] = React.useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = React.useState<Part | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Toast
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchParts = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getAllParts(search, 1, 100)
      setParts(res.items || [])
      setTotalRecords(res.totalRecords || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [search])

  React.useEffect(() => {
    void fetchParts()
  }, [fetchParts])

  React.useEffect(() => {
    getPartCategories().then(setCategories).catch(console.error)
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setPhotoFile(null)
    setPhotoPreview(null)
    setEditTarget(null)
  }

  const openAdd = () => {
    resetForm()
    setView('add')
  }

  const openEdit = (part: Part) => {
    setEditTarget(part)
    setFormData({
      partCode: part.partCode,
      partName: part.partName,
      brand: part.brand ?? '',
      partCategoryId: part.partCategoryId ?? 1,
      unitCost: String(part.unitCost),
      unitPrice: String(part.unitPrice),
      stockQty: String(part.stockQty),
      minimumStock: String(part.minimumStock),
      isActive: part.isActive ?? true,
    })
    setPhotoFile(null)
    setPhotoPreview(fullPhotoUrl(part.partPhotoUrl))
    setView('edit')
  }

  const buildFormData = (): FormData => {
    const fd = new FormData()
    fd.append('PartCode', formData.partCode)
    fd.append('PartName', formData.partName)
    fd.append('Brand', formData.brand)
    fd.append('PartCategoryId', String(formData.partCategoryId))
    fd.append('UnitCost', String(formData.unitCost))
    fd.append('UnitPrice', String(formData.unitPrice))
    fd.append('StockQty', String(formData.stockQty))
    fd.append('MinimumStock', String(formData.minimumStock))
    fd.append('IsActive', String(formData.isActive))
    if (photoFile) fd.append('PartPhoto', photoFile)
    return fd
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (view === 'edit' && editTarget) {
        const fd = buildFormData()
        fd.append('PartId', String(editTarget.partId))
        await updatePart(editTarget.partId, fd)
        showToast('Part updated successfully!')
      } else {
        await createPart(buildFormData())
        showToast('Part added successfully!')
      }
      resetForm()
      setView('list')
      await fetchParts()
    } catch (err: any) {
      console.error(err)
      showToast(err?.message || 'Failed to save part.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deletePart(deleteTarget.partId)
      showToast('Part deleted successfully!')
      setDeleteTarget(null)
      await fetchParts()
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete part.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }



  // ─────────── ADD / EDIT FORM VIEW ───────────
  if (view === 'add' || view === 'edit') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
        {toast && (
          <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
            <CheckCircle className="size-4" /> {toast.message}
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => { resetForm(); setView('list') }}
            className="size-9 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{view === 'edit' ? 'Edit Part' : 'Add New Part'}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{view === 'edit' ? 'Update part details and parameters.' : 'Register a new auto part in stock.'}</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

            {/* Left: Image Card */}
            <div className="space-y-4">
              <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden bg-white">
                <div className="p-5">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-3">Part Photo</span>
                  <label className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center aspect-square text-gray-400 hover:bg-emerald-50/20 hover:border-emerald-300 transition-all cursor-pointer overflow-hidden relative group">
                    {photoPreview ? (
                      <>
                        <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <Upload className="size-5 text-white" />
                          <span className="text-white text-xs font-semibold">Change Photo</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="size-10 mb-2 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-xs font-semibold text-gray-600">Upload Photo</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG up to 5MB</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                  </label>
                </div>
              </Card>

              {/* Status info card */}
              <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden bg-white p-5 space-y-4">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Visibility Status</span>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs font-medium text-gray-700">Active in Catalog</span>
                  <input
                    type="checkbox"
                    className="size-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                </div>
              </Card>
            </div>

            {/* Right: Input fields */}
            <div className="space-y-6">
              {/* Part Identity */}
              <Card className="rounded-2xl border-gray-100 shadow-sm bg-white p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="size-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Package className="size-3.5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Part Identity</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-600">Part Code *</Label>
                    <Input required placeholder="e.g. Bosch-103" className="h-11 rounded-xl border-gray-200"
                      value={formData.partCode} onChange={e => setFormData({ ...formData, partCode: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-600">Part Name *</Label>
                    <Input required placeholder="e.g. Platinum Spark Plug" className="h-11 rounded-xl border-gray-200"
                      value={formData.partName} onChange={e => setFormData({ ...formData, partName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-600">Brand *</Label>
                    <Input required placeholder="e.g. Bosch" className="h-11 rounded-xl border-gray-200"
                      value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-600">Category *</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={formData.partCategoryId}
                      onChange={e => setFormData({ ...formData, partCategoryId: Number(e.target.value) })}
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Pricing & Stock parameters */}
              <Card className="rounded-2xl border-gray-100 shadow-sm bg-white p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="size-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Coins className="size-3.5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Pricing & Stock Parameters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-600">Unit Cost (Buy Price) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">Rs.</span>
                      <Input required type="number" min="0" step="0.01" className="h-11 rounded-xl border-gray-200 pl-8 shadow-sm"
                        value={formData.unitCost} onChange={e => setFormData({ ...formData, unitCost: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-600">Unit Price (Sell Price) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">Rs.</span>
                      <Input required type="number" min="0" step="0.01" className="h-11 rounded-xl border-gray-200 pl-8 shadow-sm"
                        value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-600">Stock Quantity *</Label>
                    <Input required type="number" min="0" className="h-11 rounded-xl border-gray-200"
                      value={formData.stockQty} onChange={e => setFormData({ ...formData, stockQty: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-600">Minimum Stock Warning Level *</Label>
                    <Input required type="number" min="0" className="h-11 rounded-xl border-gray-200"
                      value={formData.minimumStock} onChange={e => setFormData({ ...formData, minimumStock: e.target.value })} />
                  </div>
                </div>
              </Card>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { resetForm(); setView('list') }} className="rounded-xl px-6 h-11 text-sm font-medium">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-[#1f734a] hover:bg-[#165a38] text-white rounded-xl px-8 h-11 text-sm font-bold shadow-sm">
                  {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  {view === 'edit' ? 'Save Changes' : 'Add Part'}
                </Button>
              </div>
            </div>

          </div>
        </form>
      </div>
    )
  }

  // ─────────── LIST VIEW ───────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          <CheckCircle className="size-4" /> {toast.message}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-12 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="size-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Part</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3 mb-6">
              Are you sure you want to delete <strong>{deleteTarget.partName}</strong> ({deleteTarget.partCode})?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-lg" disabled={isDeleting}>
                Cancel
              </Button>
              <Button onClick={handleDelete} disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg">
                {isDeleting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Parts Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vehicle spare parts, stock levels, catalog pricing, and photos.</p>
        </div>
        <Button onClick={openAdd} className="bg-[#1f734a] hover:bg-[#165a38] text-white rounded-xl h-11 px-5 font-bold shadow-sm self-start sm:self-auto transition-transform hover:scale-[1.02]">
          <Plus className="size-4 mr-2" />
          Add New Part
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search parts by name, code or brand..."
            className="pl-10 bg-gray-50/50 border-gray-200 rounded-xl h-11 max-w-md shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">ITEM DETAILS</th>
                <th className="px-6 py-4">CODE & BRAND</th>
                <th className="px-6 py-4">COST / PRICE</th>
                <th className="px-6 py-4">STOCK LEVEL</th>
                <th className="px-6 py-4">CATALOG STATUS</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <Loader2 className="size-7 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading inventory registry...
                  </td>
                </tr>
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <Package className="size-10 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-500">No matching parts found</p>
                    <p className="text-xs text-gray-400 mt-1">Try modifying your query or add a new part.</p>
                  </td>
                </tr>
              ) : (
                parts.map((part) => (
                  <tr key={part.partId} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                          {fullPhotoUrl(part.partPhotoUrl) ? (
                            <img src={fullPhotoUrl(part.partPhotoUrl)!} alt={part.partName} className="size-full object-cover" />
                          ) : (
                            <ImageIcon className="size-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{part.partName}</div>
                          <div className="text-[10px] text-gray-400 font-medium mt-0.5">DB-REF ID: #{part.partId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 bg-gray-100 rounded px-1.5 py-0.5 w-max text-xs font-mono">{part.partCode}</div>
                      <div className="text-xs text-gray-500 mt-1">{part.brand || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500">Cost: Rs. {part.unitCost}</div>
                      <div className="text-xs font-bold text-emerald-700 mt-0.5">Sell: Rs. {part.unitPrice}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 font-bold text-sm">
                          <span className={part.stockQty <= part.minimumStock ? 'text-rose-600 font-black' : 'text-gray-900'}>{part.stockQty}</span>
                          <span className="text-xs text-gray-400 font-normal">/ min {part.minimumStock}</span>
                        </div>
                        {part.stockQty <= part.minimumStock && (
                          <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-none shadow-none font-bold text-[9px] w-max px-2 py-0">
                            Low Stock Alert
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={part.isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none shadow-none font-bold text-[10px] px-2.5 py-0.5'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-100 border-none shadow-none font-bold text-[10px] px-2.5 py-0.5'}>
                        {part.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl" onClick={() => openEdit(part)}>
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => setDeleteTarget(part)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && parts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between text-xs text-gray-500">
            <div>Showing 1 to {parts.length} of {totalRecords} results</div>
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
