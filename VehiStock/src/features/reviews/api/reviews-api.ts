import { API_ROUTES } from '@/constants/api-routes'
import { appendSorts } from '@/utils/api-helpers'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import type {
  CreateReviewInput,
  Review,
  ReviewQueryInput,
  UnreviewedService,
  UpdateReviewInput,
} from '../types/reviews'

export function getReviews(query: ReviewQueryInput = {}) {
  const searchParams = new URLSearchParams({
    pageNumber: String(query.pageNumber ?? 1),
    pageSize: String(query.pageSize ?? 9),
  })

  if (query.searchText?.trim()) {
    searchParams.append('searchText', query.searchText.trim())
  }
  if (query.rating != null) {
    searchParams.append('rating', String(query.rating))
  }
  appendSorts(searchParams, query.sorts)

  return apiRequest<PaginatedResponse<Review>>(
    `${API_ROUTES.customer.reviews}?${searchParams.toString()}`,
  )
}

export function getUnreviewedServices() {
  return apiRequest<UnreviewedService[]>(API_ROUTES.customer.reviewsUnreviewed)
}

export function createReview(input: CreateReviewInput) {
  return apiRequest<Review>(API_ROUTES.customer.reviews, {
    method: 'POST',
    body: input,
  })
}

export function updateReview(reviewId: number, input: UpdateReviewInput) {
  return apiRequest<Review>(`${API_ROUTES.customer.reviews}/${reviewId}`, {
    method: 'PUT',
    body: input,
  })
}

export function deleteReview(reviewId: number) {
  return apiRequest<null>(`${API_ROUTES.customer.reviews}/${reviewId}`, {
    method: 'DELETE',
  })
}
