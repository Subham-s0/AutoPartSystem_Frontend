export interface Review {
  reviewId: number
  serviceRecordId: number
  vehicleNumber: string
  serviceDate: string
  diagnosis: string
  workDone: string
  rating: number
  reviewText: string
  createdAt: string
}

export interface UnreviewedService {
  serviceRecordId: number
  vehicleNumber: string
  serviceDate: string
  workDone: string
  diagnosis: string
}

export interface CreateReviewInput {
  serviceRecordId: number
  rating: number
  reviewText: string
}

export interface UpdateReviewInput {
  rating: number
  reviewText: string
}

export interface ReviewQueryInput {
  pageNumber?: number
  pageSize?: number
  searchText?: string
  rating?: number
  sorts?: import('@/types/api').SortRequest[]
}
