import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import { appendOptionalQueryValue } from '@/utils/api-helpers'
import type { CustomerVehicle } from '@/features/vehicles/types/vehicles'

export interface StaffCustomer {
  customerId: number
  userId: string
  fullName: string
  email: string
  phoneNumber?: string
  address: string
  registeredAt: string
  vehicles: CustomerVehicle[]
}

export function searchStaffCustomers(page: number = 1, pageSize: number = 10, search?: string) {
  const searchParams = new URLSearchParams()
  searchParams.append('pageNumber', page.toString())
  searchParams.append('pageSize', pageSize.toString())
  appendOptionalQueryValue(searchParams, 'search', search)

  const qs = searchParams.toString()
  const url = qs ? `${API_ROUTES.staff.customersSearch}?${qs}` : API_ROUTES.staff.customersSearch

  return apiRequest<PaginatedResponse<StaffCustomer>>(url)
}

export interface StaffCustomerHistoryItem {
  type: string
  id: number
  date: string
  description: string
  amount: number
  status: string
}

export interface StaffCustomerHistoryResponse {
  customerId: number
  fullName: string
  email: string
  phoneNumber: string
  totalSpent: number
  historyItems: StaffCustomerHistoryItem[]
}

export function getCustomerHistory(customerId: number) {
  return apiRequest<StaffCustomerHistoryResponse>(
    `${API_ROUTES.staff.customersSearch.replace('/search', '')}/${customerId}/history`
  )
}
