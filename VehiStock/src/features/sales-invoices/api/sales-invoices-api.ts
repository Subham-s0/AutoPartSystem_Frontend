import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type {
  CreateSalesInvoiceInput,
  SalesInvoice,
  SalesInvoiceLookup,
} from '../types/sales-invoices'

export function getSalesInvoiceLookups() {
  return apiRequest<SalesInvoiceLookup>(API_ROUTES.staff.salesInvoiceLookups)
}

export function createSalesInvoice(input: CreateSalesInvoiceInput) {
  return apiRequest<SalesInvoice>(API_ROUTES.staff.salesInvoices, {
    method: 'POST',
    body: input,
  })
}
