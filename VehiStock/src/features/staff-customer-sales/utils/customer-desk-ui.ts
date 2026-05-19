import type { StaffCustomerSearchField } from '../api/customer-desk-api'
import type { CustomerDeskDetails } from '../types/customer-desk'
import { ApiError } from '@/types/api'

export const SEARCH_FIELDS: Array<{ value: StaffCustomerSearchField; label: string }> = [
  { value: 'fullname', label: 'Name' },
  { value: 'customerPhone', label: 'Phone' },
  { value: 'vehicleNumber', label: 'Vehicle number' },
  { value: 'customerId', label: 'Customer ID' },
  { value: 'emailID', label: 'Email' },
]

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 2,
  }).format(value)
}

export function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message
  }

  return fallback
}

export function filterCustomers(
  customers: CustomerDeskDetails[],
  field: StaffCustomerSearchField,
  rawValue: string,
) {
  const value = rawValue.trim().toLowerCase()
  if (!value) {
    return customers
  }

  return customers.filter((customer) => {
    switch (field) {
      case 'customerId': {
        const id = Number.parseInt(rawValue.trim(), 10)
        return Number.isFinite(id) && customer.customerId === id
      }
      case 'fullname':
        return customer.fullname.toLowerCase().includes(value)
      case 'customerPhone':
        return customer.phone.toLowerCase().includes(value)
      case 'vehicleNumber':
        return (customer.vehicles ?? []).some((v) => v.toLowerCase().includes(value))
      case 'emailID':
        return (customer.email ?? '').toLowerCase().includes(value)
      default:
        return true
    }
  })
}

export function parseCustomerIdParam(value: string | null) {
  if (!value?.trim()) {
    return null
  }

  const id = Number.parseInt(value, 10)
  return Number.isFinite(id) && id > 0 ? id : null
}
