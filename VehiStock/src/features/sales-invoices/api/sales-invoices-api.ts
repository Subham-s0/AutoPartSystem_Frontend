import { API_ROUTES } from '@/constants/api-routes'
import {
  appendSorts,
} from '@/utils/api-helpers'
import type { CustomerVehicle, VehicleQueryInput } from '@/features/vehicles/types/vehicles'
import { apiRequest } from '@/services/api-client'
import type {
  CreateSalesInvoiceInput,
  SalesInvoice,
  SalesInvoiceLookup,
} from '../types/sales-invoices'

export function getSalesInvoiceLookups() {
  return apiRequest<SalesInvoiceLookup>(API_ROUTES.staff.salesInvoiceLookups)
}

export function getStaffCustomerVehicles(customerId: number, query: VehicleQueryInput = {}) {
  const searchParams = new URLSearchParams({ customerId: String(customerId) })
  if (query.searchText?.trim()) {
    searchParams.append('searchText', query.searchText.trim())
  }
  appendSorts(searchParams, query.sorts)

  return apiRequest<CustomerVehicle[]>(
    `${API_ROUTES.staff.vehicles}?${searchParams.toString()}`,
  )
}

export function createSalesInvoice(input: CreateSalesInvoiceInput) {
  return apiRequest<SalesInvoice>(API_ROUTES.staff.salesInvoices, {
    method: 'POST',
    body: input,
  })
}
