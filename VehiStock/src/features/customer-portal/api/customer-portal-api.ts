import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import type {
  Appointment,
  BookAppointmentInput,
  CreatePartRequestInput,
  CreateReviewInput,
  CustomerHistory,
  CustomerVehicle,
  PartRequest,
  Review,
  PurchaseHistory,
  ServiceHistory,
} from '../types/customer-portal'

export function getCustomerVehicles() {
  return apiRequest<CustomerVehicle[]>(API_ROUTES.customer.vehicles)
}

export function getAppointments() {
  return apiRequest<Appointment[]>(API_ROUTES.customer.appointments)
}

export function bookAppointment(input: BookAppointmentInput) {
  return apiRequest<Appointment>(API_ROUTES.customer.appointments, {
    method: 'POST',
    body: input,
  })
}

export function getPartRequests() {
  return apiRequest<PartRequest[]>(API_ROUTES.customer.partRequests)
}

export function createPartRequest(input: CreatePartRequestInput) {
  return apiRequest<PartRequest>(API_ROUTES.customer.partRequests, {
    method: 'POST',
    body: input,
  })
}

export function createReview(input: CreateReviewInput) {
  return apiRequest<Review>(API_ROUTES.customer.reviews, {
    method: 'POST',
    body: input,
  })
}

export function getCustomerHistory() {
  return apiRequest<CustomerHistory>(API_ROUTES.customer.history)
}

function createPaginationUrl(path: string, pageNumber: number, pageSize: number) {
  const searchParams = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })

  return `${path}?${searchParams.toString()}`
}

export function getPurchaseHistoryPage(pageNumber: number, pageSize: number) {
  return apiRequest<PaginatedResponse<PurchaseHistory>>(
    createPaginationUrl(API_ROUTES.customer.purchaseHistory, pageNumber, pageSize),
  )
}

export function getServiceHistoryPage(pageNumber: number, pageSize: number) {
  return apiRequest<PaginatedResponse<ServiceHistory>>(
    createPaginationUrl(API_ROUTES.customer.serviceHistory, pageNumber, pageSize),
  )
}
