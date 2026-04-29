import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { CreateSalesInvoiceInput, SalesInvoice } from '../types/sales-invoices'

export function createSalesInvoice(input: CreateSalesInvoiceInput) {
  return apiRequest<SalesInvoice>(API_ROUTES.staff.salesInvoices, {
    method: 'POST',
    body: input,
  })
}
