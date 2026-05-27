import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SearchableCombobox } from '@/components/shared/searchable-combobox'
import {
  DEFAULT_VEHICLE_LIST_SORTS,
  getCustomerVehicles,
} from '@/features/vehicles/api/vehicles-api'
import type { CreatePartRequestInput } from '@/features/part-requests/types/part-requests'
import type { CustomerVehicle } from '@/features/vehicles/types/vehicles'
import {
  buildCustomerVehicleComboboxOptions,
  mergeSelectedVehicleForCombobox,
} from '@/features/vehicles/utils/vehicle-combobox-options'
import { ApiError } from '@/types/api'

interface PartRequestFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreatePartRequestInput) => Promise<void>
}

export function PartRequestFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: PartRequestFormDialogProps) {
  const [vehicleId, setVehicleId] = React.useState('')
  const [requestedPartName, setRequestedPartName] = React.useState('')
  const [quantity, setQuantity] = React.useState('1')
  const [details, setDetails] = React.useState('')
  const [partImage, setPartImage] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [vehicles, setVehicles] = React.useState<CustomerVehicle[]>([])
  const [selectedVehicleSnapshot, setSelectedVehicleSnapshot] =
    React.useState<CustomerVehicle | null>(null)
  const [vehicleComboSearch, setVehicleComboSearch] = React.useState('')
  const [debouncedVehicleSearch, setDebouncedVehicleSearch] = React.useState('')
  const [isVehiclesLoading, setIsVehiclesLoading] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedVehicleSearch(vehicleComboSearch), 300)
    return () => clearTimeout(timer)
  }, [vehicleComboSearch])

  React.useEffect(() => {
    if (!open) {
      return
    }

    let isMounted = true

    async function loadVehicles() {
      try {
        setIsVehiclesLoading(true)
        const nextVehicles = await getCustomerVehicles({
          searchText: debouncedVehicleSearch.trim() || undefined,
          sorts: DEFAULT_VEHICLE_LIST_SORTS,
        })
        if (!isMounted) {
          return
        }

        setError(null)
        setVehicles(nextVehicles)
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load vehicles.',
        )
      } finally {
        if (isMounted) {
          setIsVehiclesLoading(false)
        }
      }
    }

    void loadVehicles()

    return () => {
      isMounted = false
    }
  }, [open, debouncedVehicleSearch])

  React.useEffect(() => {
    if (open) {
      setVehicleId('')
      setRequestedPartName('')
      setQuantity('1')
      setDetails('')
      setPartImage(null)
      setImagePreview(null)
      setPhoto(null)
      setPreviewUrl(null)
      setError(null)
      setVehicleComboSearch('')
      setDebouncedVehicleSearch('')
      setSelectedVehicleSnapshot(null)
      let isActive = true
      queueMicrotask(() => {
        if (!isActive) {
          return
        }

        setVehicleId('')
        setRequestedPartName('')
        setQuantity('1')
        setDetails('')
        setError(null)
        setVehicleComboSearch('')
        setDebouncedVehicleSearch('')
        setSelectedVehicleSnapshot(null)
      })

      return () => {
        isActive = false
      }
    }
  }, [open])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPartImage(file)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImagePreview(null)
    }
  }

  React.useEffect(() => {
    const id = Number(vehicleId)
    if (!id) {
      return
    }

    const found = vehicles.find((v) => v.vehicleId === id)
    if (found) {
      queueMicrotask(() => setSelectedVehicleSnapshot(found))
    }
  }, [vehicles, vehicleId])

  const vehiclesForCombobox = React.useMemo(
    () => mergeSelectedVehicleForCombobox(vehicles, selectedVehicleSnapshot),
    [vehicles, selectedVehicleSnapshot],
  )

  const vehicleComboboxOptions = React.useMemo(
    () => buildCustomerVehicleComboboxOptions(vehiclesForCombobox, { includeGeneric: true }),
    [vehiclesForCombobox],
  )

  function handleVehicleChange(nextId: string) {
    setVehicleId(nextId)
    const num = Number(nextId)
    if (!num) {
      setSelectedVehicleSnapshot(null)
      return
    }

    const merged = mergeSelectedVehicleForCombobox(vehicles, selectedVehicleSnapshot)
    const found = merged.find((v) => v.vehicleId === num)
    setSelectedVehicleSnapshot(found ?? null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        vehicleId: vehicleId ? Number(vehicleId) : null,
        requestedPartName,
        quantity: Number(quantity),
        details: details.trim() || undefined,
        partImage: partImage ?? undefined,
        photo,
      })
      onOpenChange(false)
    } catch (submitError) {
      setError(
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Unable to submit part request.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New part request</DialogTitle>
          <DialogDescription>
            Request a part for a specific vehicle or as a general enquiry. Staff will review and update the status.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="form-label">
            Vehicle
            <SearchableCombobox
              disabled={isVehiclesLoading && vehiclesForCombobox.length === 0}
              emptyText={isVehiclesLoading ? 'Loading…' : 'No matches.'}
              formSelectTrigger
              onChange={handleVehicleChange}
              onSearchChange={setVehicleComboSearch}
              options={vehicleComboboxOptions}
              placeholder={
                isVehiclesLoading && vehiclesForCombobox.length === 0
                  ? 'Loading vehicles…'
                  : 'Select vehicle or general request'
              }
              searchLoading={isVehiclesLoading}
              searchPlaceholder="Search plate, make, model…"
              serverSearch
              value={vehicleId}
            />
          </label>

          <label className="form-label">
            Quantity
            <input
              className="form-input"
              min={1}
              onChange={(event) => setQuantity(event.target.value)}
              required
              type="number"
              value={quantity}
            />
          </label>

          <label className="form-label md:col-span-2">
            Requested part name
            <input
              className="form-input"
              onChange={(event) => setRequestedPartName(event.target.value)}
              placeholder="e.g. OEM brake disc"
              required
              type="text"
              value={requestedPartName}
            />
          </label>

          <label className="form-label md:col-span-2">
            Details
            <textarea
              className="form-textarea"
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Brand preference, compatibility notes…"
              rows={3}
              value={details}
            />
          </label>

          <label className="form-label md:col-span-2">
            Part image (optional)
            <input
              accept="image/*"
              className="mt-1 block w-full text-sm text-[var(--vs-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--vs-green-100)] file:px-3 file:py-1 file:text-xs file:font-medium"
              onChange={handleImageChange}
              type="file"
            />
            {imagePreview && (
              <img
                alt="Part preview"
                className="mt-2 h-32 w-32 rounded-xl object-cover ring-1 ring-[var(--vs-border)]"
                src={imagePreview}
              />
            Part Image (Optional)
            <input
              accept="image/jpeg,image/png,image/webp"
              className="form-input mt-1"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setPhoto(file)
                if (previewUrl) URL.revokeObjectURL(previewUrl)
                setPreviewUrl(file ? URL.createObjectURL(file) : null)
              }}
              type="file"
            />
            {previewUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-[var(--vs-border)] bg-[var(--vs-bg)] flex items-center justify-center" style={{ maxHeight: 140 }}>
                <img
                  alt="Part preview"
                  className="max-h-36 max-w-full object-contain"
                  src={previewUrl}
                />
              </div>
            )}
          </label>

          {error ? (
            <div className="md:col-span-2 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
              {error}
            </div>
          ) : null}

          <DialogFooter className="md:col-span-2">
            <button
              className="tb-btn"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </button>
            <button className="tb-btn primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Submitting…' : 'Submit request'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
