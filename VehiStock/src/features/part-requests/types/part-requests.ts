import type { SortRequest } from '@/types/api'

export interface PartRequest {
  partRequestId: number
  customerId?: number
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  vehicleId?: number | null
  vehicleNumber?: string | null
  vehicleMake?: string | null
  vehicleModel?: string | null
  vehicleManufactureYear?: number | null
  vehiclePhotoUrl?: string | null
  requestedPartName: string
  quantity: number
  details?: string | null
  photoUrl?: string | null
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
  photo?: File | null
  photoUrl?: string
}
