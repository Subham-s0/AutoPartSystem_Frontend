import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type {
  CustomerDeskDetails,
  CustomerDeskHistory,
  SellPartInput,
} from '../types/customer-desk'

export type StaffCustomerSearchField =
  | 'fullname'
  | 'customerPhone'
  | 'vehicleNumber'
  | 'customerId'
  | 'emailID'

function buildSearchQuery(params: Record<string, string | number>) {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue
    }

    const asString = String(value).trim()
    if (!asString) {
      continue
    }

    sp.set(key, asString)
  }

  return sp.toString()
}

export function listCustomers() {
  return apiRequest<CustomerDeskDetails[]>(API_ROUTES.staff.customerSearch)
}

export function searchCustomers(field: StaffCustomerSearchField, rawValue: string) {
  const value = rawValue.trim()
  if (!value) {
    return listCustomers()
  }

  const params: Record<string, string | number> = {}
  if (field === 'customerId') {
    const id = Number.parseInt(value, 10)
    if (!Number.isFinite(id)) {
      return Promise.resolve([] as CustomerDeskDetails[])
    }

    params.customerId = id
  } else {
    params[field] = value
  }

  const qs = buildSearchQuery(params)
  return apiRequest<CustomerDeskDetails[]>(`${API_ROUTES.staff.customerSearch}?${qs}`)
}

export function getCustomerDetails(customerId: number) {
  return apiRequest<CustomerDeskDetails>(API_ROUTES.staff.customerById(customerId))
}

export function getCustomerHistory(customerId: number) {
  return apiRequest<CustomerDeskHistory[]>(API_ROUTES.staff.customerHistory(customerId))
}

export function sellPart(input: SellPartInput) {
  return apiRequest<string>(API_ROUTES.staff.sellPart, {
    method: 'POST',
    body: input,
  })
}
