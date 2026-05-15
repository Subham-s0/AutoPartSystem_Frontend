import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import { createListingUrl } from '@/utils/api-helpers'
import type {
  ServiceInvoiceListItem,
  ServiceInvoiceQueryInput,
  SetServiceInvoiceLoyaltyInput,
} from '../types/customer-service-invoices'

export function getServiceInvoicesPage(query: ServiceInvoiceQueryInput = {}) {
  return apiRequest<PaginatedResponse<ServiceInvoiceListItem>>(
    createListingUrl(API_ROUTES.customer.serviceInvoices, query),
  )
}

export function getServiceInvoiceDetail(serviceInvoiceId: number) {
  return apiRequest<ServiceInvoiceListItem>(
    API_ROUTES.customer.serviceInvoiceDetail(serviceInvoiceId),
  )
}

export function setServiceInvoiceLoyalty(
  serviceInvoiceId: number,
  input: SetServiceInvoiceLoyaltyInput,
) {
  return apiRequest<ServiceInvoiceListItem>(
    API_ROUTES.customer.serviceInvoiceLoyalty(serviceInvoiceId),
    {
      method: 'PATCH',
      body: input,
    },
  )
}
