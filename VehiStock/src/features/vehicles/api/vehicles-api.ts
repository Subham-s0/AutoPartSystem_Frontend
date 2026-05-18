import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { SortRequest } from '@/types/api'
import { appendOptionalFormValue, appendOptionalQueryValue, appendSorts } from '@/utils/api-helpers'
import type { CustomerVehicle, VehicleInput, VehicleQueryInput } from '../types/vehicles'

/** Default ordering for vehicle pickers (matches backend list default). */
export const DEFAULT_VEHICLE_LIST_SORTS: SortRequest[] = [
  { sortBy: 'mileageKm', sortDirection: 'Desc' },
]

export function getCustomerVehicles(query: VehicleQueryInput = {}) {
  const searchParams = new URLSearchParams()
  appendOptionalQueryValue(searchParams, 'searchText', query.searchText)
  appendSorts(searchParams, query.sorts)

  const qs = searchParams.toString()
  const url = qs ? `${API_ROUTES.customer.vehicles}?${qs}` : API_ROUTES.customer.vehicles
  return apiRequest<CustomerVehicle[]>(url)
}

export function createCustomerVehicle(input: VehicleInput) {
  return apiRequest<CustomerVehicle>(API_ROUTES.customer.vehicles, {
    method: 'POST',
    body: createVehicleRequestBody(input),
  })
}

export function createVehicleForCustomer(customerId: number, input: VehicleInput) {
  return apiRequest<CustomerVehicle>(`${API_ROUTES.staff.vehicles}/${customerId}`, {
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
