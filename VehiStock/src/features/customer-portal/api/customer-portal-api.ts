import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import type {
  Appointment,
  AppointmentQueryInput,
  BookAppointmentInput,
  CreatePartRequestInput,
  CreateReviewInput,
  CustomerHistory,
  CustomerVehicle,
  PartRequest,
  Review,
  PurchaseHistory,
  ServiceHistory,
  VehicleInput,
} from '../types/customer-portal'

export function getCustomerVehicles() {
  return apiRequest<CustomerVehicle[]>(API_ROUTES.customer.vehicles)
}

export function createCustomerVehicle(input: VehicleInput) {
  return apiRequest<CustomerVehicle>(API_ROUTES.customer.vehicles, {
    method: 'POST',
    body: createVehicleRequestBody(input),
  })
}

export function updateCustomerVehicle(vehicleId: number, input: VehicleInput) {
  return apiRequest<CustomerVehicle>(`${API_ROUTES.customer.vehicles}/${vehicleId}`, {
    method: 'PUT',
    body: createVehicleRequestBody(input),
  })
}

export function deleteCustomerVehicle(vehicleId: number) {
  return apiRequest<null>(`${API_ROUTES.customer.vehicles}/${vehicleId}`, {
    method: 'DELETE',
  })
}

export function getAppointments(query: AppointmentQueryInput = {}) {
  const searchParams = new URLSearchParams({
    pageNumber: String(query.pageNumber ?? 1),
    pageSize: String(query.pageSize ?? 10),
  })

  appendOptionalQueryValue(searchParams, 'searchText', query.searchText)
  appendOptionalQueryValue(searchParams, 'status', query.status)
  appendOptionalQueryValue(searchParams, 'sortBy', query.sortBy)

  return apiRequest<PaginatedResponse<Appointment>>(
    `${API_ROUTES.customer.appointments}?${searchParams.toString()}`,
  )
}

export function bookAppointment(input: BookAppointmentInput) {
  return apiRequest<Appointment>(API_ROUTES.customer.appointments, {
    method: 'POST',
    body: input,
  })
}

export function cancelAppointment(appointmentId: number) {
  return apiRequest<Appointment>(
    `${API_ROUTES.customer.appointments}/${appointmentId}/cancel`,
    {
      method: 'PATCH',
    },
  )
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

function appendOptionalQueryValue(
  searchParams: URLSearchParams,
  name: string,
  value?: string | null,
) {
  if (value && value.trim()) {
    searchParams.append(name, value.trim())
  }
}

function createVehicleRequestBody(input: VehicleInput) {
  const formData = new FormData()
  formData.append('vehicleNumber', input.vehicleNumber)
  formData.append('make', input.make)
  formData.append('model', input.model)
  formData.append('manufactureYear', String(input.manufactureYear))
  formData.append('mileageKm', String(input.mileageKm))

  appendOptionalFormValue(formData, 'engineNo', input.engineNo)
  appendOptionalFormValue(formData, 'chassisNo', input.chassisNo)
  appendOptionalFormValue(formData, 'notes', input.notes)

  if (input.vehiclePhoto) {
    formData.append('vehiclePhoto', input.vehiclePhoto)
  }

  if (input.removeVehiclePhoto) {
    formData.append('removeVehiclePhoto', 'true')
  }

  return formData
}

function appendOptionalFormValue(
  formData: FormData,
  name: string,
  value?: string | null,
) {
  if (value && value.trim()) {
    formData.append(name, value)
  }
}
