import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import { appendOptionalQueryValue, appendSorts } from '@/utils/api-helpers'
import type {
  CustomerPaymentListItem,
  CustomerPaymentQueryInput,
  InvoicePaymentInitiateInput,
  InvoicePaymentInitiation,
  InvoicePaymentVerification,
  InvoicePaymentVerifyInput,
} from '../types/payments'

export function getCustomerPaymentsPage(query: CustomerPaymentQueryInput = {}) {
  const searchParams = new URLSearchParams({
    pageNumber: String(query.pageNumber ?? 1),
    pageSize: String(query.pageSize ?? 10),
  })
  appendOptionalQueryValue(searchParams, 'searchText', query.searchText)
  appendOptionalQueryValue(searchParams, 'invoiceKind', query.invoiceKind)
  appendOptionalQueryValue(searchParams, 'paymentType', query.paymentType)
  appendOptionalQueryValue(searchParams, 'invoiceStatus', query.invoiceStatus)
  appendOptionalQueryValue(searchParams, 'fromDate', query.fromDate)
  appendOptionalQueryValue(searchParams, 'toDate', query.toDate)
  appendSorts(searchParams, query.sorts)

  return apiRequest<PaginatedResponse<CustomerPaymentListItem>>(
    `${API_ROUTES.customer.payments}?${searchParams.toString()}`,
  )
}

export function initiateServiceInvoicePayment(
  serviceInvoiceId: number,
  input: InvoicePaymentInitiateInput,
) {
  return apiRequest<InvoicePaymentInitiation>(
    API_ROUTES.customer.serviceInvoicePaymentInitiate(serviceInvoiceId),
    {
      method: 'POST',
      body: input,
    },
  )
}

export function initiatePurchaseInvoicePayment(
  salesInvoiceId: number,
  input: InvoicePaymentInitiateInput,
) {
  return apiRequest<InvoicePaymentInitiation>(
    API_ROUTES.customer.purchasePaymentInitiate(salesInvoiceId),
    {
      method: 'POST',
      body: input,
    },
  )
}

export function verifyServiceInvoicePayment(input: InvoicePaymentVerifyInput) {
  return apiRequest<InvoicePaymentVerification>(
    API_ROUTES.customer.serviceInvoicePaymentVerify,
    {
      method: 'POST',
      body: input,
    },
  )
}
