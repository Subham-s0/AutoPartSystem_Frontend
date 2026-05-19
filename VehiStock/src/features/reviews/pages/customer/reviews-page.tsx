import * as React from 'react'
import { Pencil, Plus, Star, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ErrorAlert } from '@/components/shared/error-alert'
import { ListToolbar } from '@/components/shared/list-toolbar'
import { PageSection } from '@/components/shared/page-section'
import { PaginationFooter } from '@/components/shared/pagination-footer'
import { ReviewFormDialog } from '@/features/reviews/components/review-form-dialog'
import {
  createReview,
  deleteReview,
  getReviews,
  getUnreviewedServices,
  updateReview,
} from '@/features/reviews/api/reviews-api'
import type { Review, UnreviewedService } from '@/features/reviews/types/reviews'
import { usePagination } from '@/hooks/use-pagination'
import { formatDateOnly, formatDateTime } from '@/utils/date'
import { ApiError, type SortRequest } from '@/types/api'

type ReviewSortKey = 'newest' | 'oldest' | 'ratingDesc' | 'ratingAsc'

const SORT_OPTIONS: { label: string; key: ReviewSortKey; sorts: SortRequest[] }[] = [
  { label: 'Newest first', key: 'newest', sorts: [{ sortBy: 'createdAt', sortDirection: 'Desc' }] },
  { label: 'Oldest first', key: 'oldest', sorts: [{ sortBy: 'createdAt', sortDirection: 'Asc' }] },
  { label: 'Highest rated', key: 'ratingDesc', sorts: [{ sortBy: 'rating', sortDirection: 'Desc' }, { sortBy: 'createdAt', sortDirection: 'Desc' }] },
  { label: 'Lowest rated', key: 'ratingAsc', sorts: [{ sortBy: 'rating', sortDirection: 'Asc' }, { sortBy: 'createdAt', sortDirection: 'Desc' }] },
]

function getSorts(key: ReviewSortKey): SortRequest[] {
  return SORT_OPTIONS.find((opt) => opt.key === key)?.sorts ?? [{ sortBy: 'createdAt', sortDirection: 'Desc' }]
}

const RATING_FILTERS = [5, 4, 3, 2, 1]

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="stars flex gap-0.5" style={{ color: 'var(--vs-amber, #f59e0b)' }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          fill={index < rating ? 'currentColor' : 'none'}
          key={index}
          size={size}
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}

export function ReviewsPage() {
  const pagination = usePagination(1, 9)
  const [reviewsResult, setReviewsResult] = React.useState<{
    items: Review[]
    totalRecords: number
    totalPages: number
  } | null>(null)
  const [unreviewedServices, setUnreviewedServices] = React.useState<UnreviewedService[]>([])

  const [searchText, setSearchText] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [sortKey, setSortKey] = React.useState<ReviewSortKey>('newest')
  const [ratingFilter, setRatingFilter] = React.useState<number | null>(null)

  const [isReviewsLoading, setIsReviewsLoading] = React.useState(true)
  const [isFetching, setIsFetching] = React.useState(true)
  const [isServicesLoading, setIsServicesLoading] = React.useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300)
    return () => clearTimeout(timer)
  }, [searchText])
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [reviewFormMode, setReviewFormMode] = React.useState<'create' | 'edit'>('create')
  const [editingReview, setEditingReview] = React.useState<Review | null>(null)
  const [reviewToDelete, setReviewToDelete] = React.useState<Review | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [reloadKey, setReloadKey] = React.useState(0)

  React.useEffect(() => {
    let isMounted = true

    async function loadServices() {
      try {
        const services = await getUnreviewedServices()
        if (isMounted) {
          setUnreviewedServices(services)
        }
      } catch {
        // non-critical; form will show empty state
      } finally {
        if (isMounted) {
          setIsServicesLoading(false)
        }
      }
    }

    void loadServices()
    return () => { isMounted = false }
  }, [reloadKey])

  React.useEffect(() => {
    let isMounted = true

    async function loadReviews() {
      try {
        setIsFetching(true)
        setError(null)
        const result = await getReviews({
          pageNumber: pagination.page,
          pageSize: pagination.pageSize,
          searchText: debouncedSearch.trim() || undefined,
          rating: ratingFilter ?? undefined,
          sorts: getSorts(sortKey),
        })
        if (isMounted) {
          setReviewsResult({
            items: result.items,
            totalRecords: result.totalRecords,
            totalPages: result.totalPages,
          })
        }
      } catch (loadError) {
        if (isMounted) {
          setReviewsResult(null)
          setError(
            loadError instanceof ApiError || loadError instanceof Error
              ? loadError.message
              : 'Unable to load reviews.',
          )
        }
      } finally {
        if (isMounted) {
          setIsReviewsLoading(false)
          setIsFetching(false)
        }
      }
    }

    queueMicrotask(() => {
      if (isMounted) {
        void loadReviews()
      }
    })
    return () => { isMounted = false }
  }, [pagination.page, pagination.pageSize, debouncedSearch, sortKey, ratingFilter, reloadKey])

  function resetToFirstPage() {
    pagination.setPage(1)
  }

  async function handleCreateReview(data: {
    serviceRecordId: number
    rating: number
    reviewText: string
  }) {
    await createReview(data)
    setSuccessMessage('Review submitted successfully.')
    setReloadKey((k) => k + 1)
    resetToFirstPage()
  }

  async function handleUpdateReview(data: {
    serviceRecordId: number
    rating: number
    reviewText: string
  }) {
    if (!editingReview) return
    await updateReview(editingReview.reviewId, {
      rating: data.rating,
      reviewText: data.reviewText,
    })
    setSuccessMessage('Review updated successfully.')
    setReloadKey((k) => k + 1)
  }

  async function handleDeleteReview() {
    if (!reviewToDelete) return
    setError(null)
    setSuccessMessage(null)
    setIsDeleting(true)

    try {
      await deleteReview(reviewToDelete.reviewId)
      setReviewToDelete(null)
      setSuccessMessage('Review deleted successfully.')
      setReloadKey((k) => k + 1)
      if (reviewsResult && reviewsResult.items.length === 1 && pagination.page > 1) {
        pagination.setPage((p) => p - 1)
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError || deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete review.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  function openCreateDialog() {
    setReviewFormMode('create')
    setEditingReview(null)
    setError(null)
    setSuccessMessage(null)
    setIsFormOpen(true)
  }

  function openEditDialog(review: Review) {
    setReviewFormMode('edit')
    setEditingReview(review)
    setError(null)
    setSuccessMessage(null)
    setIsFormOpen(true)
  }

  const reviews = reviewsResult?.items ?? []
  const totalRecords = reviewsResult?.totalRecords ?? 0
  const totalPages =
    reviewsResult && reviewsResult.totalPages > 0 ? reviewsResult.totalPages : 1

  return (
    <PageSection
      actions={(
        <button
          className="tb-btn primary"
          onClick={openCreateDialog}
          type="button"
        >
          <Plus size={15} />
          Write a review
        </button>
      )}
      description="Submit feedback for completed service visits. Edit or remove reviews at any time."
      title="Service Reviews"
    >
      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-green-600)]/15 bg-[var(--vs-green-100)] px-4 py-3 text-sm text-[var(--vs-green-900)]">
          {successMessage}
        </div>
      ) : null}

      <ErrorAlert message={error} />

      <div className="space-y-4">
        <ListToolbar
          searchPlaceholder="Search vehicle, service or review text"
          searchAriaLabel="Search reviews"
          searchText={searchText}
          onSearchTextChange={(value) => {
            resetToFirstPage()
            setSearchText(value)
          }}
          filterLabel="Filter by rating"
          filterValue={ratingFilter == null ? '' : String(ratingFilter)}
          onFilterChange={(value) => {
            resetToFirstPage()
            setRatingFilter(value === '' ? null : Number(value))
          }}
          filterOptions={RATING_FILTERS.map((r) => ({ label: `${r} star${r > 1 ? 's' : ''}`, value: String(r) }))}
          sortOptions={SORT_OPTIONS}
          sortKey={sortKey}
          onSortKeyChange={(value) => {
            resetToFirstPage()
            setSortKey(value as ReviewSortKey)
          }}
        />

        {isReviewsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="h-44 animate-pulse rounded-2xl border border-[var(--vs-soft-border)] bg-[var(--vs-bg)]"
                key={index}
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-10 text-center text-sm text-[var(--vs-muted)]">
            {searchText.trim() || ratingFilter != null
              ? 'No reviews match these filters.'
              : 'You have not submitted any reviews yet.'}
          </div>
        ) : (
          <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {reviews.map((review) => (
              <article
                className="info-card relative flex flex-col gap-3"
                key={review.reviewId}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="info-card-title truncate">{review.vehicleNumber}</div>
                    <div className="info-card-desc mt-0.5 truncate">
                      {review.diagnosis || review.workDone} •{' '}
                      {formatDateOnly(review.serviceDate)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      aria-label="Edit review"
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[var(--vs-muted)] hover:bg-[var(--vs-green-100)] hover:text-[var(--vs-green-800)]"
                      onClick={() => openEditDialog(review)}
                      type="button"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      aria-label="Delete review"
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[var(--vs-muted)] hover:bg-[var(--vs-red-100)] hover:text-[var(--vs-red)]"
                      onClick={() => {
                        setError(null)
                        setSuccessMessage(null)
                        setReviewToDelete(review)
                      }}
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <StarRating rating={review.rating} />

                <p className="info-card-desc line-clamp-3 flex-1 text-[13px] leading-relaxed">
                  {review.reviewText}
                </p>

                <div className="mt-auto border-t border-[var(--vs-soft-border)] pt-2.5 text-xs text-[var(--vs-faint)]">
                  Submitted {formatDateTime(review.createdAt)}
                </div>
              </article>
            ))}
          </div>
        )}

        <PaginationFooter
          pageNumber={pagination.page}
          pageSize={pagination.pageSize}
          totalRecords={totalRecords}
          totalPages={totalPages}
          itemCount={reviews.length}
          isLoading={isReviewsLoading}
          onPrevious={() => pagination.setPage((p) => Math.max(1, p - 1))}
          onNext={() => pagination.setPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>

      <ReviewFormDialog
        isLoadingServices={isServicesLoading}
        mode={reviewFormMode}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingReview(null)
        }}
        onSubmit={reviewFormMode === 'edit' ? handleUpdateReview : handleCreateReview}
        open={isFormOpen}
        review={editingReview}
        unreviewedServices={unreviewedServices}
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setReviewToDelete(null)
        }}
        open={Boolean(reviewToDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your review for{' '}
              <strong>{reviewToDelete?.vehicleNumber}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="tb-btn destructive"
              disabled={isDeleting}
              onClick={handleDeleteReview}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageSection>
  )
}
