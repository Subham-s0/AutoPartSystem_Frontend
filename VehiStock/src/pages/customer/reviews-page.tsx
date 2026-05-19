import * as React from 'react'
import { Star } from 'lucide-react'
import { PageSection } from '@/components/shared/page-section'
import {
  createReview,
  getCustomerHistory,
} from '@/features/customer-portal/api/customer-portal-api'
import { formatDateOnly, formatDateTime } from '@/lib/date'
import { ApiError } from '@/types/api'

export function ReviewsPage() {
  const [history, setHistory] = React.useState<
    Awaited<ReturnType<typeof getCustomerHistory>> | null
  >(null)
  const [serviceRecordId, setServiceRecordId] = React.useState('')
  const [rating, setRating] = React.useState('5')
  const [reviewText, setReviewText] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      try {
        setError(null)
        const nextHistory = await getCustomerHistory()

        if (!isMounted) {
          return
        }

        setHistory(nextHistory)
        const firstPendingService = nextHistory.services.find((service) => !service.review)
        setServiceRecordId(firstPendingService ? String(firstPendingService.serviceRecordId) : '')
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load review data.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  const pendingServices = React.useMemo(
    () => history?.services.filter((service) => !service.review) ?? [],
    [history],
  )

  const submittedReviews = React.useMemo(
    () =>
      history?.services
        .filter((service) => service.review)
        .map((service) => ({
          serviceRecordId: service.serviceRecordId,
          serviceDate: service.serviceDate,
          vehicleNumber: service.vehicleNumber,
          diagnosis: service.diagnosis,
          review: service.review!,
        })) ?? [],
    [history],
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const createdReview = await createReview({
        serviceRecordId: Number(serviceRecordId),
        rating: Number(rating),
        reviewText,
      })

      setHistory((currentHistory) => {
        if (!currentHistory) {
          return currentHistory
        }

        return {
          ...currentHistory,
          services: currentHistory.services.map((service) =>
            service.serviceRecordId === createdReview.serviceRecordId
              ? { ...service, review: createdReview }
              : service,
          ),
        }
      })

      setReviewText('')
      setRating('5')
      setSuccessMessage('Review submitted successfully.')
      setServiceRecordId((currentServiceRecordId) => {
        const nextPendingServices =
          history?.services.filter(
            (service) =>
              !service.review &&
              service.serviceRecordId !== Number(currentServiceRecordId),
          ) ?? []

        return nextPendingServices[0]
          ? String(nextPendingServices[0].serviceRecordId)
          : ''
      })
    } catch (submitError) {
      setError(
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Unable to submit review.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageSection
      description="Submit a review for completed services and keep a visible record of the feedback you already left."
      title="Service Reviews"
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="form-label">
            Completed service
            <select
              className="form-select"
              disabled={isLoading || pendingServices.length === 0}
              onChange={(event) => setServiceRecordId(event.target.value)}
              required
              value={serviceRecordId}
            >
              {pendingServices.length === 0 ? (
                <option value="">No pending services to review</option>
              ) : null}
              {pendingServices.map((service) => (
                <option
                  key={service.serviceRecordId}
                  value={service.serviceRecordId}
                >
                  {service.vehicleNumber} • {formatDateOnly(service.serviceDate)} •{' '}
                  {service.workDone}
                </option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Rating
            <select
              className="form-select"
              onChange={(event) => setRating(event.target.value)}
              value={rating}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} star{value > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Review
            <textarea
              className="form-textarea"
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="Describe your service experience..."
              required
              value={reviewText}
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-[var(--vs-green-600)]/15 bg-[var(--vs-green-100)] px-4 py-3 text-sm text-[var(--vs-green-900)]">
              {successMessage}
            </div>
          ) : null}

          {pendingServices.length === 0 && !isLoading ? (
            <div className="rounded-2xl border border-dashed border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm text-[var(--vs-muted)]">
              You have no completed services waiting for a review.
            </div>
          ) : null}

          <div>
            <button
              className="tb-btn primary"
              disabled={isSubmitting || pendingServices.length === 0}
              type="submit"
            >
              {isSubmitting ? 'Submitting...' : 'Submit review'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div>
            <div className="page-section-title">Submitted reviews</div>
            <p className="page-section-desc">
              Reviews are tied to completed service records and remain visible in
              your service history.
            </p>
          </div>

          {submittedReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-6 text-sm text-[var(--vs-muted)]">
              {isLoading ? 'Loading reviews...' : 'You have not submitted any reviews yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {submittedReviews.map((entry) => (
                <article key={entry.review.reviewId} className="info-card">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="info-card-title">{entry.vehicleNumber}</div>
                      <div className="info-card-desc">
                        {entry.diagnosis} • {formatDateOnly(entry.serviceDate)}
                      </div>
                    </div>
                    <div className="stars">
                      {Array.from({ length: entry.review.rating }).map((_, index) => (
                        <Star key={index} fill="currentColor" size={15} />
                      ))}
                    </div>
                  </div>
                  <div className="info-card-desc" style={{ marginTop: '10px' }}>
                    {entry.review.reviewText}
                  </div>
                  <div className="info-card-desc" style={{ marginTop: '8px' }}>
                    Submitted {formatDateTime(entry.review.createdAt)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageSection>
  )
}
