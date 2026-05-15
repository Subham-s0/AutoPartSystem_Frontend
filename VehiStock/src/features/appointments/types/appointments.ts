import type { SortRequest } from '@/types/api'

export interface Appointment {
  appointmentId: number
  vehicleId: number
  vehicleNumber: string
  preferredDate: string
  serviceType: string
  problemDescription: string
  status: string
  bookedAt: string
}

export interface AppointmentQueryInput {
  pageNumber?: number
  pageSize?: number
  searchText?: string
  status?: string
  sorts?: SortRequest[]
}

export interface BookAppointmentInput {
  vehicleId: number
  preferredDate: string
  serviceType: string
  problemDescription: string
}
