import type { SortRequest } from '@/types/api'

export interface PartRequest {
  partRequestId: number
  vehicleId?: number | null
  vehicleNumber?: string | null
  vehicleMake?: string | null
  vehicleModel?: string | null
  vehicleManufactureYear?: number | null
  vehiclePhotoUrl?: string | null
  /** URL of the uploaded part image (optional) */
  partImageUrl?: string | null
  requestedPartName: string
  quantity: number
  details?: string | null
  status: string
  requestDate: string
}

export interface PartRequestQueryInput {
  pageNumber?: number
  pageSize?: number
  searchText?: string
  status?: string
  sorts?: SortRequest[]
}

export interface CreatePartRequestInput {
  vehicleId?: number | null
  requestedPartName: string
  quantity: number
  details?: string
  /** Optional image of the requested part */
  partImage?: File | null
}

/** Admin-side part request response (same shape, returned from admin endpoints) */
export type AdminPartRequest = PartRequest & {
  customerName?: string | null
  customerId?: number | null
}

export interface UpdatePartRequestStatusInput {
  status: 'Pending' | 'Ordered' | 'Fulfilled' | 'Cancelled'
}
