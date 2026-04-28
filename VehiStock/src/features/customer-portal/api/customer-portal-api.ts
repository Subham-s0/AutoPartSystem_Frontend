import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type {
  Appointment,
  BookAppointmentInput,
  CreatePartRequestInput,
  CreateReviewInput,
  CustomerHistory,
  CustomerVehicle,
  PartRequest,
  Review,
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
