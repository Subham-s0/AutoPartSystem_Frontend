import type { SortRequest } from '@/types/api'

export interface CustomerVehicle {
  vehicleId: number
  vehicleNumber: string
  make: string
  model: string
  manufactureYear: number
  engineNo?: string | null
  chassisNo?: string | null
  mileageKm: number
  vehiclePhotoUrl?: string | null
  notes?: string | null
}

export interface VehicleQueryInput {
  searchText?: string
  sorts?: SortRequest[]
}

export interface VehicleInput {
  vehicleNumber: string
  make: string
  model: string
  manufactureYear: number
  engineNo?: string | null
  chassisNo?: string | null
  vehiclePhotoUrl?: string | null
  vehiclePhoto?: File | null
  removeVehiclePhoto?: boolean
  mileageKm: number
  notes?: string | null
}
