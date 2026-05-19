import * as React from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Edit3, ImagePlus, Save, Trash2, X } from 'lucide-react'
import { ROUTE_PATHS } from '@/app/config/routes'
import { PageSection } from '@/components/shared/page-section'
import {
  createCustomerVehicle,
  deleteCustomerVehicle,
  getCustomerVehicles,
  updateCustomerVehicle,
} from '@/features/vehicles/api/vehicles-api'
import type {
  CustomerVehicle,
  VehicleInput,
} from '@/features/vehicles/types/vehicles'
import {
  getVehicleImageSrc,
  handleVehicleImageError,
} from '@/features/vehicles/utils/vehicle-images'
import { ApiError } from '@/types/api'

interface VehicleFormState {
  vehicleNumber: string
  make: string
  model: string
  manufactureYear: string
  engineNo: string
  chassisNo: string
  mileageKm: string
  notes: string
  vehiclePhoto: File | null
  removeVehiclePhoto: boolean
}

const emptyForm: VehicleFormState = {
  vehicleNumber: '',
  make: '',
  model: '',
  manufactureYear: '',
  engineNo: '',
  chassisNo: '',
  mileageKm: '0',
  notes: '',
  vehiclePhoto: null,
  removeVehiclePhoto: false,
}

function mapVehicleToForm(vehicle: CustomerVehicle): VehicleFormState {
  return {
    vehicleNumber: vehicle.vehicleNumber,
    make: vehicle.make,
    model: vehicle.model,
    manufactureYear: String(vehicle.manufactureYear),
    engineNo: vehicle.engineNo ?? '',
    chassisNo: vehicle.chassisNo ?? '',
    mileageKm: String(vehicle.mileageKm),
    notes: vehicle.notes ?? '',
    vehiclePhoto: null,
    removeVehiclePhoto: false,
  }
}

function normalizeOptional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function VehicleDetailsPage() {
  const { vehicleId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const isNewVehicle = !vehicleId
  const [vehicle, setVehicle] = React.useState<CustomerVehicle | null>(null)
  const [form, setForm] = React.useState<VehicleFormState>(emptyForm)
  const [isEditing, setIsEditing] = React.useState(isNewVehicle)
  const [isLoading, setIsLoading] = React.useState(!isNewVehicle)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [previewSrc, setPreviewSrc] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isNewVehicle) {
      let isActive = true

      queueMicrotask(() => {
        if (!isActive) {
          return
        }

        setVehicle(null)
        setForm(emptyForm)
        setIsEditing(true)
        setIsLoading(false)
      })

      return () => {
        isActive = false
      }
    }

    let isMounted = true

    async function loadVehicle() {
      try {
        setError(null)
        const vehicles = await getCustomerVehicles({})
        const nextVehicle = vehicles.find((item) => String(item.vehicleId) === vehicleId)

        if (!isMounted) {
          return
        }

        if (!nextVehicle) {
          setError('Vehicle was not found.')
          setVehicle(null)
          return
        }

        setVehicle(nextVehicle)
        setForm(mapVehicleToForm(nextVehicle))
        setIsEditing(searchParams.get('mode') === 'edit')
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load vehicle.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadVehicle()

    return () => {
      isMounted = false
    }
  }, [isNewVehicle, searchParams, vehicleId])

  React.useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc)
      }
    }
  }, [previewSrc])

  function updateForm<K extends keyof VehicleFormState>(
    key: K,
    value: VehicleFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    if (previewSrc) {
      URL.revokeObjectURL(previewSrc)
    }

    updateForm('vehiclePhoto', file)
    updateForm('removeVehiclePhoto', false)
    setPreviewSrc(file ? URL.createObjectURL(file) : null)
  }

  function handleChooseImage() {
    fileInputRef.current?.click()
  }

  function handleClearImage() {
    if (previewSrc) {
      URL.revokeObjectURL(previewSrc)
    }

    setPreviewSrc(null)
    updateForm('vehiclePhoto', null)
    updateForm('removeVehiclePhoto', Boolean(vehicle?.vehiclePhotoUrl))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    const payload: VehicleInput = {
      vehicleNumber: form.vehicleNumber.trim(),
      make: form.make.trim(),
      model: form.model.trim(),
      manufactureYear: Number(form.manufactureYear),
      engineNo: normalizeOptional(form.engineNo),
      chassisNo: normalizeOptional(form.chassisNo),
      mileageKm: Number(form.mileageKm),
      notes: normalizeOptional(form.notes),
      vehiclePhoto: form.vehiclePhoto,
      removeVehiclePhoto: form.removeVehiclePhoto,
    }

    try {
      if (isNewVehicle) {
        const createdVehicle = await createCustomerVehicle(payload)
        navigate(ROUTE_PATHS.customer.vehicleDetails(createdVehicle.vehicleId), {
          replace: true,
        })
        return
      }

      const updatedVehicle = await updateCustomerVehicle(Number(vehicleId), payload)
      setVehicle(updatedVehicle)
      setForm(mapVehicleToForm(updatedVehicle))
      setPreviewSrc(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setIsEditing(false)
      setSearchParams({})
      setSuccessMessage('Vehicle updated successfully.')
    } catch (submitError) {
      setError(
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Unable to save vehicle.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!vehicle) {
      return
    }

    const confirmed = window.confirm(
      `Delete vehicle ${vehicle.vehicleNumber}? This cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      await deleteCustomerVehicle(vehicle.vehicleId)
      navigate(ROUTE_PATHS.customer.vehicles)
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError || deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete vehicle.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const editableImageSrc = previewSrc ??
    (!form.removeVehiclePhoto && vehicle?.vehiclePhotoUrl
      ? getVehicleImageSrc(vehicle.vehiclePhotoUrl)
      : null)
  const displayImageSrc = getVehicleImageSrc(vehicle?.vehiclePhotoUrl)
  const imageSrc = isEditing ? editableImageSrc : displayImageSrc

  return (
    <PageSection
      actions={(
        <Link className="tb-btn" to={ROUTE_PATHS.customer.vehicles}>
          <ArrowLeft size={14} />
          Back
        </Link>
      )}
      description="View complete vehicle information and keep the record current."
      title={isNewVehicle ? 'Add Vehicle' : vehicle?.vehicleNumber ?? 'Vehicle Details'}
    >
      {error ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-green-600)]/15 bg-[var(--vs-green-100)] px-4 py-3 text-sm text-[var(--vs-green-900)]">
          {successMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-6 text-sm text-[var(--vs-muted)]">
          Loading vehicle...
        </div>
      ) : null}

      {!isLoading && (vehicle || isNewVehicle) ? (
        <div className="vehicle-detail-layout">
          <div className="vehicle-detail-image-panel">
            {isEditing ? (
              <VehicleImagePicker
                imageSrc={imageSrc}
                inputRef={fileInputRef}
                onChange={handleFileChange}
                onChoose={handleChooseImage}
                onClear={handleClearImage}
                vehicleLabel={vehicle?.vehicleNumber ?? 'New vehicle'}
              />
            ) : (
              <img
                alt={vehicle ? `${vehicle.vehicleNumber} vehicle` : 'Default vehicle'}
                className="vehicle-detail-image"
                onError={handleVehicleImageError}
                src={displayImageSrc}
              />
            )}
          </div>

          <div className="vehicle-detail-panel">
            {isEditing ? (
              <VehicleForm
                form={form}
                isNewVehicle={isNewVehicle}
                isSubmitting={isSubmitting}
                onCancel={() => {
                  setError(null)
                  setSuccessMessage(null)
                  if (isNewVehicle) {
                    navigate(ROUTE_PATHS.customer.vehicles)
                    return
                  }

                  if (vehicle) {
                    setForm(mapVehicleToForm(vehicle))
                  }

                  setPreviewSrc(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                  setIsEditing(false)
                  setSearchParams({})
                }}
                onChange={updateForm}
                onSubmit={handleSubmit}
              />
            ) : vehicle ? (
              <VehicleDetails
                isDeleting={isDeleting}
                onDelete={() => void handleDelete()}
                onEdit={() => {
                  setError(null)
                  setSuccessMessage(null)
                  setIsEditing(true)
                  setSearchParams({ mode: 'edit' })
                }}
                vehicle={vehicle}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </PageSection>
  )
}

interface VehicleImagePickerProps {
  imageSrc: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
  vehicleLabel: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onChoose: () => void
  onClear: () => void
}

function VehicleImagePicker({
  imageSrc,
  inputRef,
  vehicleLabel,
  onChange,
  onChoose,
  onClear,
}: VehicleImagePickerProps) {
  return (
    <div className="vehicle-image-picker">
      <input
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp"
        className="vehicle-image-input"
        onChange={onChange}
        type="file"
      />

      {imageSrc ? (
        <>
          <img
            alt={`${vehicleLabel} vehicle`}
            className="vehicle-detail-image"
            onError={handleVehicleImageError}
            src={imageSrc}
          />
          <button
            aria-label="Remove selected vehicle image"
            className="vehicle-image-clear"
            onClick={onClear}
            type="button"
          >
            <X size={16} />
          </button>
          <button
            className="vehicle-image-replace"
            onClick={onChoose}
            type="button"
          >
            <ImagePlus size={16} />
            Replace image
          </button>
        </>
      ) : (
        <button
          className="vehicle-image-empty"
          onClick={onChoose}
          type="button"
        >
          <ImagePlus size={18} />
          Choose image
        </button>
      )}
    </div>
  )
}

interface VehicleDetailsProps {
  vehicle: CustomerVehicle
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
}

function VehicleDetails({
  vehicle,
  isDeleting,
  onEdit,
  onDelete,
}: VehicleDetailsProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="vehicle-detail-title">{vehicle.vehicleNumber}</div>
          <div className="vehicle-detail-subtitle">
            {vehicle.make} {vehicle.model} &bull; {vehicle.manufactureYear}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="tb-btn" onClick={onEdit} type="button">
            <Edit3 size={14} />
            Edit
          </button>
          <button
            className="tb-btn"
            disabled={isDeleting}
            onClick={onDelete}
            type="button"
          >
            <Trash2 size={14} />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="vehicle-detail-grid">
        <VehicleField label="Brand" value={vehicle.make} />
        <VehicleField label="Model" value={vehicle.model} />
        <VehicleField label="Manufacture year" value={vehicle.manufactureYear} />
        <VehicleField label="Mileage" value={`${vehicle.mileageKm.toLocaleString()} km`} />
        <VehicleField label="Engine no." value={vehicle.engineNo ?? 'Not set'} />
        <VehicleField label="Chassis no." value={vehicle.chassisNo ?? 'Not set'} />
        <VehicleField className="md:col-span-2" label="Notes" value={vehicle.notes ?? 'Not set'} />
      </div>
    </div>
  )
}

interface VehicleFieldProps {
  label: string
  value: React.ReactNode
  className?: string
}

function VehicleField({ label, value, className }: VehicleFieldProps) {
  return (
    <div className={`vehicle-detail-field ${className ?? ''}`}>
      <div className="vehicle-detail-label">{label}</div>
      <div className="vehicle-detail-value">{value}</div>
    </div>
  )
}

interface VehicleFormProps {
  form: VehicleFormState
  isNewVehicle: boolean
  isSubmitting: boolean
  onChange: <K extends keyof VehicleFormState>(
    key: K,
    value: VehicleFormState[K],
  ) => void
  onCancel: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

function VehicleForm({
  form,
  isNewVehicle,
  isSubmitting,
  onChange,
  onCancel,
  onSubmit,
}: VehicleFormProps) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <label className="form-label md:col-span-2">
        Vehicle number
        <input
          className="form-input"
          maxLength={50}
          onChange={(event) => onChange('vehicleNumber', event.target.value)}
          required
          type="text"
          value={form.vehicleNumber}
        />
      </label>

      <label className="form-label">
        Brand
        <input
          className="form-input"
          maxLength={100}
          onChange={(event) => onChange('make', event.target.value)}
          required
          type="text"
          value={form.make}
        />
      </label>

      <label className="form-label">
        Model
        <input
          className="form-input"
          maxLength={100}
          onChange={(event) => onChange('model', event.target.value)}
          required
          type="text"
          value={form.model}
        />
      </label>

      <label className="form-label">
        Manufacture year
        <input
          className="form-input"
          max={2100}
          min={1900}
          onChange={(event) => onChange('manufactureYear', event.target.value)}
          required
          type="number"
          value={form.manufactureYear}
        />
      </label>

      <label className="form-label">
        Mileage
        <input
          className="form-input"
          min={0}
          onChange={(event) => onChange('mileageKm', event.target.value)}
          required
          type="number"
          value={form.mileageKm}
        />
      </label>

      <label className="form-label">
        Engine no.
        <input
          className="form-input"
          maxLength={100}
          onChange={(event) => onChange('engineNo', event.target.value)}
          type="text"
          value={form.engineNo}
        />
      </label>

      <label className="form-label">
        Chassis no.
        <input
          className="form-input"
          maxLength={100}
          onChange={(event) => onChange('chassisNo', event.target.value)}
          type="text"
          value={form.chassisNo}
        />
      </label>

      <label className="form-label md:col-span-2">
        Notes
        <textarea
          className="form-textarea"
          maxLength={1000}
          onChange={(event) => onChange('notes', event.target.value)}
          value={form.notes}
        />
      </label>

      <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
        <button className="tb-btn" onClick={onCancel} type="button">
          <X size={14} />
          Cancel
        </button>
        <button className="tb-btn primary" disabled={isSubmitting} type="submit">
          <Save size={14} />
          {isSubmitting
            ? 'Saving...'
            : isNewVehicle
              ? 'Create vehicle'
              : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
