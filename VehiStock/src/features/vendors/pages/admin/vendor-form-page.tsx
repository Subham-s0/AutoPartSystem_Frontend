import * as React from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Building2, Save } from 'lucide-react'
import { PageSection } from '@/components/shared/page-section'
import { ErrorAlert } from '@/components/shared/error-alert'
import { ROUTE_PATHS } from '@/app/config/routes'
import {
  createVendor,
  getVendorById,
  updateVendor,
} from '@/features/vendors/api/vendors-api'
import type { VendorUpsertRequest } from '@/features/vendors/types'
import { ApiError } from '@/types/api'

const EMPTY_FORM: VendorUpsertRequest = {
  vendorName: '',
  vendorCode: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
}

export function VendorFormPage() {
  const navigate = useNavigate()
  const { vendorId } = useParams<{ vendorId: string }>()
  const isEdit = Boolean(vendorId)

  const [formData, setFormData] = React.useState<VendorUpsertRequest>(EMPTY_FORM)
  const [loading, setLoading] = React.useState(isEdit)
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!isEdit || !vendorId) return

    setLoading(true)
    setError(null)
    getVendorById(Number(vendorId))
      .then((vendor) => {
        setFormData({
          vendorName: vendor.vendorName,
          vendorCode: vendor.vendorCode,
          contactPerson: vendor.contactPerson,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
        })
      })
      .catch((err) => {
        setError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to load vendor details.')
      })
      .finally(() => setLoading(false))
  }, [isEdit, vendorId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (isEdit && vendorId) {
        await updateVendor(Number(vendorId), formData)
      } else {
        await createVendor(formData)
      }
      navigate(ROUTE_PATHS.admin.vendors)
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to save vendor details.')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-[var(--vs-muted)]">
        Loading vendor details...
      </div>
    )
  }

  return (
    <PageSection
      title={isEdit ? 'Edit Vendor' : 'Add New Vendor'}
      description={isEdit ? 'Update supplier configuration details.' : 'Register a new supplier profile.'}
      actions={(
        <Link className="tb-btn inline-flex items-center gap-1.5" to={ROUTE_PATHS.admin.vendors}>
          <ArrowLeft size={15} /> Back to List
        </Link>
      )}
    >
      <div className="max-w-2xl mx-auto mt-4">
        {error && <ErrorAlert message={error} className="mb-6" />}

        <div className="rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-card-bg)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--vs-border)] pb-5 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--vs-green-100)] text-[var(--vs-green-800)]">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--vs-foreground)]">Vendor Information</h3>
              <p className="text-xs text-[var(--vs-muted)]">Enter the identity and contact detail of the supplier.</p>
            </div>
          </div>

          <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--vs-muted)]">
                Vendor Name <span className="text-[var(--vs-red)]">*</span>
              </label>
              <input
                className="form-input w-full"
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                placeholder="e.g. Acme Auto Parts"
                required
                type="text"
                value={formData.vendorName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--vs-muted)]">
                Vendor Code <span className="text-[var(--vs-red)]">*</span>
              </label>
              <input
                className="form-input w-full font-mono uppercase"
                disabled={isEdit}
                onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value.toUpperCase() })}
                placeholder="e.g. ACM-01"
                required
                type="text"
                value={formData.vendorCode}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--vs-muted)]">
                Contact Person <span className="text-[var(--vs-red)]">*</span>
              </label>
              <input
                className="form-input w-full"
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. John Doe"
                required
                type="text"
                value={formData.contactPerson}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--vs-muted)]">
                Phone Number <span className="text-[var(--vs-red)]">*</span>
              </label>
              <input
                className="form-input w-full"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +977-9801234567"
                required
                type="tel"
                value={formData.phone}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--vs-muted)]">
                Email Address <span className="text-[var(--vs-red)]">*</span>
              </label>
              <input
                className="form-input w-full"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. contact@acme.com"
                required
                type="email"
                value={formData.email}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--vs-muted)]">
                Business Address <span className="text-[var(--vs-red)]">*</span>
              </label>
              <textarea
                className="form-input w-full resize-none min-h-[100px]"
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address, City, Country"
                required
                rows={3}
                value={formData.address}
              />
            </div>

            <div className="flex justify-end gap-3 sm:col-span-2 border-t border-[var(--vs-border)] pt-5 mt-4">
              <Link className="tb-btn" to={ROUTE_PATHS.admin.vendors}>
                Cancel
              </Link>
              <button
                className="tb-btn primary inline-flex items-center gap-1.5"
                disabled={isSubmitting}
                type="submit"
              >
                <Save size={15} />
                {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Vendor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageSection>
  )
}
