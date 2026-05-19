import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import { appendOptionalQueryValue } from '@/utils/api-helpers'
import type {
  CustomerDirectoryDetail,
  CustomerDirectoryItem,
} from '@/features/customers/types/customer-directory'

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
  phoneNumber?: string | null
  totalSpent: number
  historyItems: StaffCustomerHistoryItem[]
}

function buildCustomerListUrl(
  scope: 'admin' | 'staff',
  page: number = 1,
  pageSize: number = 10,
  search?: string,
) {
  const searchParams = new URLSearchParams()
  searchParams.append('pageNumber', page.toString())
  searchParams.append('pageSize', pageSize.toString())
  appendOptionalQueryValue(searchParams, 'search', search)

  const baseUrl =
    scope === 'admin' ? API_ROUTES.admin.customers : API_ROUTES.staff.customersSearch
  return `${baseUrl}?${searchParams.toString()}`
}

export function searchManagedCustomers(
  scope: 'admin' | 'staff',
  page: number = 1,
  pageSize: number = 10,
  search?: string,
) {
  return apiRequest<PaginatedResponse<CustomerDirectoryItem>>(
    buildCustomerListUrl(scope, page, pageSize, search),
  )
}

export function searchStaffCustomers(page: number = 1, pageSize: number = 10, search?: string) {
  return searchManagedCustomers('staff', page, pageSize, search)
}

export function getManagedCustomerDetail(scope: 'admin' | 'staff', customerId: number) {
  const url =
    scope === 'admin'
      ? API_ROUTES.admin.customerDetail(customerId)
      : API_ROUTES.staff.customerDetail(customerId)

  return apiRequest<CustomerDirectoryDetail>(url)
}

export function getCustomerHistory(customerId: number) {
  return apiRequest<StaffCustomerHistoryResponse>(
    API_ROUTES.staff.customerHistory(customerId),
  )
}
