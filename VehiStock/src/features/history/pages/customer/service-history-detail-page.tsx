import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit3, MessageSquarePlus, Star } from 'lucide-react'
import { PageSection } from '@/components/shared/page-section'
import { getServiceHistoryDetail } from '@/features/history/api/history-api'
import type { ServiceHistory } from '@/features/history/types/history'
import { ReviewFormDialog, type ReviewFormMode } from '@/features/reviews/components/review-form-dialog'
import { createReview, updateReview } from '@/features/reviews/api/reviews-api'
import type { Review, UnreviewedService } from '@/features/reviews/types/reviews'
import { formatDateOnly, formatDateTime } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError } from '@/types/api'

function toReviewFromService(service: ServiceHistory): Review | null {
  if (!service.review) {
    return null
  }

  return {
    reviewId: service.review.reviewId,
    serviceRecordId: service.serviceRecordId,
    vehicleNumber: service.vehicleNumber,
    serviceDate: service.serviceDate,
    diagnosis: service.diagnosis,
    workDone: service.workDone,
    rating: service.review.rating,
    reviewText: service.review.reviewText,
    createdAt: service.review.createdAt,
  }
}

function toPresetService(service: ServiceHistory): UnreviewedService {
  return {
    serviceRecordId: service.serviceRecordId,
    vehicleNumber: service.vehicleNumber,
    serviceDate: service.serviceDate,
    workDone: service.workDone,
    diagnosis: service.diagnosis,
  }
}

function canWriteReview(service: ServiceHistory) {
  return service.serviceStatus === 'Closed' && !service.review
}

function statusBadgeClass(status: string) {
  if (status === 'Closed') {
    return 'badge bg'
  }

  return 'badge ba'
}

function paymentBadgeClass(status: string, balanceDue: number) {
  if (status === 'Overdue') {
    return 'badge br'
  }

  return balanceDue > 0 ? 'badge ba' : 'badge bg'
}

export function ServiceHistoryDetailPage() {
  const { serviceRecordId } = useParams()
  const navigate = useNavigate()
  const [service, setService] = React.useState<ServiceHistory | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)

  const [isReviewFormOpen, setIsReviewFormOpen] = React.useState(false)
  const [reviewFormMode, setReviewFormMode] = React.useState<ReviewFormMode>('view')
  const [activeReview, setActiveReview] = React.useState<Review | null>(null)
  const [presetService, setPresetService] = React.useState<UnreviewedService | null>(null)
  const [reviewSuccess, setReviewSuccess] = React.useState<string | null>(null)
  const [reviewError, setReviewError] = React.useState<string | null>(null)

  const parsedId = Number(serviceRecordId)
  const isValidId = Number.isFinite(parsedId) && parsedId > 0

  React.useEffect(() => {
    if (!isValidId) {
      queueMicrotask(() => {
        setError('Service record id is invalid.')
        setIsLoading(false)
      })
      return
    }

    let isMounted = true

    async function loadServiceDetail() {
      try {
        setError(null)
        setIsLoading(true)
        const next = await getServiceHistoryDetail(parsedId)

        if (isMounted) {
          setService(next)
        }
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : 'Unable to load service record.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadServiceDetail()

    return () => {
      isMounted = false
    }
  }, [parsedId, isValidId, reloadKey])

  function openViewReview() {
    if (!service) {
      return
    }

    const review = toReviewFromService(service)
    if (!review) {
      return
    }

    setReviewError(null)
    setReviewSuccess(null)
    setReviewFormMode('view')
    setActiveReview(review)
    setPresetService(null)
    setIsReviewFormOpen(true)
  }

  function openWriteReview() {
    if (!service) {
      return
    }

    setReviewError(null)
    setReviewSuccess(null)
    setReviewFormMode('create')
    setActiveReview(null)
    setPresetService(toPresetService(service))
    setIsReviewFormOpen(true)
  }

  function openEditReview() {
    if (!activeReview) {
      return
    }

    setReviewFormMode('edit')
  }

  async function handleReviewSubmit(data: {
    serviceRecordId: number
    rating: number
    reviewText: string
  }) {
    try {
      if (reviewFormMode === 'edit' && activeReview) {
        await updateReview(activeReview.reviewId, {
          rating: data.rating,
          reviewText: data.reviewText,
        })
        setReviewSuccess('Review updated successfully.')
      } else {
        await createReview(data)
        setReviewSuccess('Review submitted successfully.')
      }

      setReloadKey((key) => key + 1)
    } catch (submitError) {
      setReviewError(
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Unable to save review.',
      )
      throw submitError
    }
  }

  const subtotal = service
    ? service.serviceInvoice
      ? service.serviceInvoice.laborCharge + service.serviceInvoice.partsCharge
      : service.laborCharge + service.partsCharge
    : 0

  const discountAmount =
    service && service.serviceInvoice
      ? Math.round(
          (service.serviceInvoice.laborCharge + service.serviceInvoice.partsCharge) *
            (service.serviceInvoice.discountPercent / 100) *
            100,
        ) / 100
      : 0

  return (
    <PageSection
      description="Full breakdown of diagnosis, work performed, parts used, and billing."
      title={service ? `Service on ${service.vehicleNumber}` : 'Service Details'}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="tb-btn"
            onClick={() => navigate(-1)}
            type="button"
          >
            <ArrowLeft size={15} /> Back to history
          </button>
          {service && service.review ? (
            <button className="tb-btn" onClick={openViewReview} type="button">
              <Star size={15} /> View review
            </button>
          ) : null}
          {service && canWriteReview(service) ? (
            <button className="tb-btn primary" onClick={openWriteReview} type="button">
              <MessageSquarePlus size={15} /> Write review
            </button>
          ) : null}
        </div>
      }
    >
      {reviewSuccess ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-green-600)]/15 bg-[var(--vs-green-100)] px-4 py-3 text-sm text-[var(--vs-green-900)]">
          {reviewSuccess}
        </div>
      ) : null}

      {reviewError ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
          {reviewError}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
          {error}
          <div className="mt-2">
            <button className="underline" onClick={() => navigate(-1)} type="button">
              Return to history
            </button>
          </div>
        </div>
      ) : null}

      {isLoading && !service ? (
        <div className="rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-6 text-sm text-[var(--vs-muted)]">
          Loading service record...
        </div>
      ) : null}

      {service ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <DetailCard title="Overview">
              <DetailGrid>
                <DetailItem
                  label="Service date"
                  value={formatDateOnly(service.serviceDate)}
                />
                <DetailItem label="Vehicle" value={service.vehicleNumber} />
                <DetailItem
                  label="Status"
                  valueNode={
                    <span className={statusBadgeClass(service.serviceStatus)}>
                      {service.serviceStatus}
                    </span>
                  }
                />
                <DetailItem
                  label="Handled by"
                  value={
                    service.staffMemberName
                      ? service.staffJobTitle
                        ? `${service.staffMemberName} (${service.staffJobTitle})`
                        : service.staffMemberName
                      : 'Unassigned'
                  }
                />
                <DetailItem
                  label="Service record ID"
                  value={`#${service.serviceRecordId}`}
                />
              </DetailGrid>
            </DetailCard>

            <DetailCard title="Diagnosis">
              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--vs-text)]">
                {service.diagnosis?.trim() ? service.diagnosis : 'No diagnosis recorded.'}
              </p>
            </DetailCard>

            <DetailCard title="Work performed">
              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--vs-text)]">
                {service.workDone?.trim() ? service.workDone : 'No work description recorded.'}
              </p>
            </DetailCard>

            {service.notes?.trim() ? (
              <DetailCard title="Staff notes">
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--vs-text)]">
                  {service.notes}
                </p>
              </DetailCard>
            ) : null}

            <DetailCard title={`Parts used (${service.partsUsed.length})`}>
              {service.partsUsed.length === 0 ? (
                <p className="text-sm text-[var(--vs-muted)]">
                  No spare parts were charged on this service.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[var(--vs-border)]">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-[var(--vs-bg)] text-left text-xs uppercase tracking-wide text-[var(--vs-muted)]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Part</th>
                        <th className="px-3 py-2 font-semibold">Brand</th>
                        <th className="px-3 py-2 text-right font-semibold">Qty</th>
                        <th className="px-3 py-2 text-right font-semibold">Unit price</th>
                        <th className="px-3 py-2 text-right font-semibold">Line total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {service.partsUsed.map((part, index) => (
                        <tr
                          className="border-t border-[var(--vs-border)] text-[var(--vs-text)]"
                          key={`${part.partName}-${index}`}
                        >
                          <td className="px-3 py-2 font-semibold">{part.partName}</td>
                          <td className="px-3 py-2 text-[var(--vs-muted)]">{part.brand}</td>
                          <td className="px-3 py-2 text-right">{part.quantity}</td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrency(part.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatCurrency(part.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DetailCard>
          </div>

          <div className="space-y-5">
            <DetailCard title="Service charges">
              <DetailRow label="Labor" value={formatCurrency(service.laborCharge)} />
              <DetailRow label="Parts" value={formatCurrency(service.partsCharge)} />
              <DetailRow
                emphasis
                label="Total charge"
                value={formatCurrency(service.totalCharge)}
              />
            </DetailCard>

            {service.serviceInvoice ? (
              <DetailCard
                title="Invoice summary"
                actions={
                  <span
                    className={paymentBadgeClass(
                      service.serviceInvoice.paymentStatus,
                      service.serviceInvoice.balanceDue,
                    )}
                  >
                    {service.serviceInvoice.paymentStatus}
                  </span>
                }
              >
                <DetailRow label="Invoice ID" value={`#${service.serviceInvoice.serviceInvoiceId}`} />
                <DetailRow
                  label="Labor"
                  value={formatCurrency(service.serviceInvoice.laborCharge)}
                />
                <DetailRow
                  label="Parts"
                  value={formatCurrency(service.serviceInvoice.partsCharge)}
                />
                <DetailRow label="Subtotal" value={formatCurrency(subtotal)} />
                {service.serviceInvoice.discountPercent > 0 ? (
                  <DetailRow
                    label={`Discount (${service.serviceInvoice.discountPercent}%)`}
                    value={`- ${formatCurrency(discountAmount)}`}
                  />
                ) : null}
                <DetailRow
                  label="Tax"
                  value={formatCurrency(service.serviceInvoice.taxAmount)}
                />
                <DetailRow
                  emphasis
                  label="Total"
                  value={formatCurrency(service.serviceInvoice.totalAmount)}
                />
                <DetailRow
                  label="Paid"
                  value={formatCurrency(service.serviceInvoice.amountPaid)}
                />
                <DetailRow
                  emphasis
                  label="Balance due"
                  value={formatCurrency(service.serviceInvoice.balanceDue)}
                />
              </DetailCard>
            ) : (
              <DetailCard title="Invoice summary">
                <p className="text-sm text-[var(--vs-muted)]">
                  An invoice has not been generated for this service yet.
                </p>
              </DetailCard>
            )}

            {service.review ? (
              <DetailCard
                title="Your review"
                actions={
                  <button
                    className="tb-btn"
                    onClick={openViewReview}
                    type="button"
                  >
                    <Edit3 size={14} /> Manage
                  </button>
                }
              >
                <div className="flex items-center gap-1 text-[var(--vs-amber)]">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      className={
                        value <= service.review!.rating
                          ? 'fill-current'
                          : 'text-[var(--vs-border)]'
                      }
                      key={value}
                      size={16}
                    />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-[var(--vs-text)]">
                    {service.review.rating}/5
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-[var(--vs-text)]">
                  {service.review.reviewText}
                </p>
                <p className="mt-2 text-xs text-[var(--vs-muted)]">
                  Submitted {formatDateTime(service.review.createdAt)}
                </p>
              </DetailCard>
            ) : canWriteReview(service) ? (
              <DetailCard title="Share your experience">
                <p className="text-sm text-[var(--vs-muted)]">
                  Let the workshop know how this service went.
                </p>
                <div className="mt-3">
                  <button className="tb-btn primary" onClick={openWriteReview} type="button">
                    <MessageSquarePlus size={15} /> Write review
                  </button>
                </div>
              </DetailCard>
            ) : null}
          </div>
        </div>
      ) : null}

      <ReviewFormDialog
        mode={reviewFormMode}
        onOpenChange={(open) => {
          setIsReviewFormOpen(open)
          if (!open) {
            setActiveReview(null)
            setPresetService(null)
          }
        }}
        onSubmit={reviewFormMode === 'view' ? undefined : handleReviewSubmit}
        onSwitchToEdit={reviewFormMode === 'view' ? openEditReview : undefined}
        open={isReviewFormOpen}
        presetService={presetService}
        review={activeReview}
        unreviewedServices={[]}
      />
    </PageSection>
  )
}

function DetailCard({
  title,
  actions,
  children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-surface)] px-4 py-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--vs-muted)]">
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </div>
  )
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>
}

function DetailItem({
  label,
  value,
  valueNode,
}: {
  label: string
  value?: string
  valueNode?: React.ReactNode
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--vs-border)] bg-[var(--vs-bg)] px-3 py-2">
      <div className="text-[11px] font-bold uppercase text-[var(--vs-muted)]">{label}</div>
      <div className="mt-1 text-[13px] font-semibold text-[var(--vs-text)]">
        {valueNode ?? value}
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-[var(--vs-border)] py-1.5 last:border-b-0">
      <span className="text-sm text-[var(--vs-muted)]">{label}</span>
      <span
        className={`text-sm ${emphasis ? 'font-bold text-[var(--vs-text)]' : 'font-semibold text-[var(--vs-text)]'}`}
      >
        {value}
      </span>
    </div>
  )
}
