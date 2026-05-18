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

export function sendInvoiceEmail(invoiceId: number) {
  return apiRequest<void>(`${API_ROUTES.staff.salesInvoices}/${invoiceId}/send-email`, {
    method: 'POST',
  })
}

export interface PaginatedSalesInvoices {
  items: SalesInvoice[]
  pageNumber: number
  pageSize: number
  totalRecords: number
  totalPages: number
}

export function getSalesInvoices(search?: string, page: number = 1, pageSize: number = 10) {
  const params = new URLSearchParams({
    pageNumber: String(page),
    pageSize: String(pageSize),
  })
  if (search?.trim()) {
    params.append('search', search.trim())
  }
  return apiRequest<PaginatedSalesInvoices>(
    `${API_ROUTES.staff.salesInvoices}?${params.toString()}`,
  )
}

export function deleteSalesInvoice(invoiceId: number) {
  return apiRequest<void>(`${API_ROUTES.staff.salesInvoices}/${invoiceId}`, {
    method: 'DELETE',
  })
}
