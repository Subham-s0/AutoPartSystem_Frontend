import * as React from 'react'
import { Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateOnly, formatDateTime } from '@/utils/date'
import { ApiError } from '@/types/api'
import type { Review, UnreviewedService } from '../types/reviews'

export type ReviewFormMode = 'create' | 'edit' | 'view'

interface ReviewFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ReviewFormMode
  unreviewedServices?: UnreviewedService[]
  isLoadingServices?: boolean
  review?: Review | null
  presetService?: UnreviewedService | null
  onSubmit?: (data: { serviceRecordId: number; rating: number; reviewText: string }) => Promise<void>
  onSwitchToEdit?: () => void
}

const STAR_VALUES = [1, 2, 3, 4, 5]

export function ReviewFormDialog({
  open,
  onOpenChange,
  mode,
  unreviewedServices = [],
  isLoadingServices = false,
  review,
  presetService,
  onSubmit,
  onSwitchToEdit,
}: ReviewFormDialogProps) {
  const isViewing = mode === 'view'
  const isEditing = mode === 'edit'
  const isCreate = mode === 'create'

  const [serviceRecordId, setServiceRecordId] = React.useState('')
  const [rating, setRating] = React.useState(5)
  const [hoveredRating, setHoveredRating] = React.useState(0)
  const [reviewText, setReviewText] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const lockedService = presetService ?? null
  const displayService = lockedService ?? (isEditing || isViewing ? review : null)

  React.useEffect(() => {
    if (!open) {
      return
    }

    let isActive = true
    queueMicrotask(() => {
      if (!isActive) {
        return
      }

      if (isViewing || isEditing) {
        if (review) {
          setRating(review.rating)
          setReviewText(review.reviewText)
          setServiceRecordId(String(review.serviceRecordId))
        }
      } else {
        const firstService = lockedService ?? unreviewedServices[0]
        setServiceRecordId(firstService ? String(firstService.serviceRecordId) : '')
        setRating(5)
        setReviewText('')
      }
      setError(null)
    })

    return () => {
      isActive = false
    }
  }, [open, isViewing, isEditing, review, unreviewedServices, lockedService])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isViewing || !onSubmit) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        serviceRecordId: Number(serviceRecordId),
        rating,
        reviewText,
      })
      onOpenChange(false)
    } catch (submitError) {
      setError(
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Unable to save review.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = isViewing ? 'View review' : isEditing ? 'Edit review' : 'Write a review'
  const description = isViewing
    ? 'Your feedback for this completed service visit.'
    : isEditing
      ? 'Update your rating and review text for this service.'
      : 'Share your experience for a completed service visit.'

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="grid min-w-0 gap-4" onSubmit={handleSubmit}>
          {isCreate && !lockedService ? (
            <div className="form-label flex min-w-0 flex-col">
              <span className="mb-1">Completed service</span>
              <Select
                disabled={isLoadingServices || unreviewedServices.length === 0}
                onValueChange={setServiceRecordId}
                value={serviceRecordId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select completed service" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {unreviewedServices.map((service) => (
                    <SelectItem key={service.serviceRecordId} value={String(service.serviceRecordId)}>
                      {service.vehicleNumber} • {formatDateOnly(service.serviceDate)} • {service.workDone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {(isCreate && lockedService) || isEditing || isViewing ? (
            <ServiceSummaryCard
              diagnosis={displayService?.diagnosis ?? review?.diagnosis ?? ''}
              serviceDate={displayService?.serviceDate ?? review?.serviceDate ?? ''}
              vehicleNumber={displayService?.vehicleNumber ?? review?.vehicleNumber ?? ''}
              workDone={displayService?.workDone ?? review?.workDone ?? ''}
            />
          ) : null}

          <div className="form-label min-w-0">
            Rating
            {isViewing ? (
              <div className="mt-1.5 flex items-center gap-2">
                <StarDisplay rating={rating} />
                <span className="text-sm text-[var(--vs-muted)]">{rating} / 5</span>
              </div>
            ) : (
              <div className="mt-1.5 flex gap-1">
                {STAR_VALUES.map((value) => (
                  <button
                    className="cursor-pointer border-0 bg-transparent p-0.5 transition-colors"
                    key={value}
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    style={{
                      color:
                        value <= (hoveredRating || rating)
                          ? 'var(--vs-amber, #f59e0b)'
                          : 'var(--vs-soft-border)',
                    }}
                    type="button"
                  >
                    <Star fill="currentColor" size={22} />
                  </button>
                ))}
                <span className="ml-2 self-center text-sm text-[var(--vs-muted)]">{rating} / 5</span>
              </div>
            )}
          </div>

          <label className="form-label flex min-w-0 flex-col">
            <span className="mb-1">Review</span>
            {isViewing ? (
              <p className="rounded-xl border border-[var(--vs-soft-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm leading-relaxed text-[var(--vs-text)]">
                {reviewText}
              </p>
            ) : (
              <textarea
                className="form-textarea w-full min-w-0"
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="Describe your service experience..."
                required
                value={reviewText}
              />
            )}
          </label>

          {isViewing && review ? (
            <p className="text-xs text-[var(--vs-faint)]">Submitted {formatDateTime(review.createdAt)}</p>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
              {error}
            </div>
          ) : null}

          {isCreate && !lockedService && unreviewedServices.length === 0 && !isLoadingServices ? (
            <p className="rounded-2xl border border-dashed border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm text-[var(--vs-muted)]">
              All completed services have been reviewed.
            </p>
          ) : null}

          <DialogFooter>
            <button className="tb-btn" onClick={() => onOpenChange(false)} type="button">
              {isViewing ? 'Close' : 'Cancel'}
            </button>
            {isViewing && onSwitchToEdit ? (
              <button className="tb-btn primary" onClick={onSwitchToEdit} type="button">
                Edit review
              </button>
            ) : null}
            {!isViewing ? (
              <button
                className="tb-btn primary"
                disabled={
                  isSubmitting || (isCreate && !lockedService && unreviewedServices.length === 0)
                }
                type="submit"
              >
                {isSubmitting
                  ? isEditing
                    ? 'Saving...'
                    : 'Submitting...'
                  : isEditing
                    ? 'Save changes'
                    : 'Submit review'}
              </button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ServiceSummaryCard({
  vehicleNumber,
  serviceDate,
  workDone,
  diagnosis,
}: {
  vehicleNumber: string
  serviceDate: string
  workDone: string
  diagnosis: string
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--vs-soft-border)] bg-[var(--vs-bg)] px-4 py-3">
      <div className="truncate text-xs font-semibold text-[var(--vs-text)]">{vehicleNumber}</div>
      <p className="mt-0.5 break-words text-xs text-[var(--vs-muted)]">
        {workDone} • {formatDateOnly(serviceDate)}
      </p>
      {diagnosis ? (
        <p className="mt-2 break-words text-xs text-[var(--vs-muted)]">
          <span className="font-semibold text-[var(--vs-text)]">Diagnosis:</span> {diagnosis}
        </p>
      ) : null}
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {STAR_VALUES.map((value) => (
        <Star
          fill={value <= rating ? 'var(--vs-amber, #f59e0b)' : 'none'}
          key={value}
          size={22}
          stroke={value <= rating ? 'var(--vs-amber, #f59e0b)' : 'var(--vs-soft-border)'}
        />
      ))}
    </div>
  )
}
