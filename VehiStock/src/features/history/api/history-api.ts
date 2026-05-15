import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import { createListingUrl } from '@/utils/api-helpers'
import type {
  CustomerHistory,
  PurchaseHistory,
  PurchaseHistoryQueryInput,
  PurchaseInvoiceLoyaltyResult,
  ServiceHistory,
  ServiceHistoryQueryInput,
  SetPurchaseInvoiceLoyaltyInput,
} from '../types/history'

export function getCustomerHistory() {
  return apiRequest<CustomerHistory>(API_ROUTES.customer.history)
}

export function getPurchaseHistoryPage(query: PurchaseHistoryQueryInput = {}) {
  return apiRequest<PaginatedResponse<PurchaseHistory>>(
    createListingUrl(API_ROUTES.customer.purchaseHistory, query),
  )
}

export function getPurchaseHistoryDetail(salesInvoiceId: number) {
  return apiRequest<PurchaseHistory>(
    API_ROUTES.customer.purchaseHistoryDetail(salesInvoiceId),
  )
}

export function getServiceHistoryPage(query: ServiceHistoryQueryInput = {}) {
  return apiRequest<PaginatedResponse<ServiceHistory>>(
    createListingUrl(API_ROUTES.customer.serviceHistory, query),
  )
}

export function getServiceHistoryDetail(serviceRecordId: number) {
  return apiRequest<ServiceHistory>(
    API_ROUTES.customer.serviceHistoryDetail(serviceRecordId),
  )
}

export function setPurchaseInvoiceLoyalty(
  salesInvoiceId: number,
  input: SetPurchaseInvoiceLoyaltyInput,
) {
  return apiRequest<PurchaseInvoiceLoyaltyResult>(
    API_ROUTES.customer.purchaseInvoiceLoyalty(salesInvoiceId),
    {
      method: 'PATCH',
      body: input,
    },
  )
}
