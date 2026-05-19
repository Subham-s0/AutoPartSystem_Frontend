import * as React from 'react'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { PageSection } from '@/components/shared/page-section'
import { 
  getAllVendors, 
  createVendor, 
  updateVendor, 
  deleteVendor 
} from '@/features/vendors/api/vendors-api'
import type { Vendor, VendorUpsertRequest } from '@/features/vendors/types'
import { ApiError } from '@/types/api'

export function VendorPage() {
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  
  // Server-side pagination states
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalRecords, setTotalRecords] = React.useState(0)
  const pageSize = 10

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingVendor, setEditingVendor] = React.useState<Vendor | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [formData, setFormData] = React.useState<VendorUpsertRequest>({
    vendorName: '',
    vendorCode: '',
    contactPerson: '',
    email: '',
    phoneNumber: '',
    address: ''
  })

  const fetchVendors = React.useCallback(async (q: string, targetPage: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAllVendors(q, targetPage, pageSize)
      setVendors(res.items)
      setTotalPages(res.totalPages)
      setTotalRecords(res.totalRecords)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load vendors')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchVendors(searchQuery, page)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, page, fetchVendors])

  React.useEffect(() => {
    queueMicrotask(() => {
      setPage(1)
    })
  }, [searchQuery])

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor)
      setFormData({
        vendorName: vendor.vendorName,
        vendorCode: vendor.vendorCode,
        contactPerson: vendor.contactPerson,
        email: vendor.email,
        phoneNumber: vendor.phoneNumber,
        address: vendor.address
      })
    } else {
      setEditingVendor(null)
      setFormData({
        vendorName: '',
        vendorCode: '',
        contactPerson: '',
        email: '',
        phoneNumber: '',
        address: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingVendor) {
        await updateVendor(editingVendor.vendorId, formData)
      } else {
        await createVendor(formData)
      }
      await fetchVendors(searchQuery, page)
      setIsModalOpen(false)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return
    try {
      await deleteVendor(id)
      await fetchVendors(searchQuery, page)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Delete failed')
    }
  }

  const filteredVendors = vendors

  return (
    <PageSection
      description="Manage your business suppliers and procurement codes."
      title="Vendor Management"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              className="w-full rounded-xl border border-input bg-background pl-12 pr-4 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors..."
              type="text"
              value={searchQuery}
            />
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            onClick={() => handleOpenModal()}
          >
            <Plus size={18} />
            Add Vendor
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p>Loading vendors...</p>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Building2 className="mb-4 opacity-20" size={60} />
              <p>No vendors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3 text-xs font-bold uppercase text-muted-foreground">Vendor</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase text-muted-foreground">Contact</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredVendors.map((vendor) => (
                    <tr className="hover:bg-muted/30" key={vendor.vendorId}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{vendor.vendorName}</div>
                        <div className="text-xs text-muted-foreground">#{vendor.vendorCode}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="text-muted-foreground" size={14} />
                          {vendor.contactPerson}
                        </div>
                        <div className="text-xs text-muted-foreground">{vendor.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 text-muted-foreground hover:text-primary transition"
                            onClick={() => handleOpenModal(vendor)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-2 text-muted-foreground hover:text-destructive transition"
                            onClick={() => handleDelete(vendor.vendorId)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalRecords > 0 && (
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/20">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Showing {totalRecords === 0 ? 0 : (page - 1) * 10 + 1} to {Math.min(totalRecords, page * 10)} of {totalRecords} vendors
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:bg-muted disabled:opacity-50"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: totalPages || 1 }).map((_, index) => {
                      const p = index + 1
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                            page === p
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'border border-input bg-background hover:bg-muted text-foreground'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    })}
                    
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:bg-muted disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-card shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg font-semibold">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <input
                    className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
                    required
                    type="text"
                    value={formData.vendorName}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code</label>
                  <input
                    className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    onChange={e => setFormData({ ...formData, vendorCode: e.target.value })}
                    required
                    type="text"
                    value={formData.vendorCode}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person</label>
                <input
                  className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                  required
                  type="text"
                  value={formData.contactPerson}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    type="email"
                    value={formData.email}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                    type="tel"
                    value={formData.phoneNumber}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <textarea
                  className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  required
                  rows={3}
                  value={formData.address}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted"
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-70"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                  {editingVendor ? 'Save Changes' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageSection>
  )
}
