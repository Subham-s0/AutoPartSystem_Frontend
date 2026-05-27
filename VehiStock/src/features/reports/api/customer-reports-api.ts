import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import { appendOptionalQueryValue } from '@/utils/api-helpers'
import type {
  CustomerReportFilters,
  CustomerReportSummary,
  HighSpenderReportItem,
  PendingCreditReportItem,
  RegularCustomerReportItem,
} from '../types/customer-reports'

export function getRegularCustomers(
  pageNumber = 1,
  pageSize = 10,
  minimumInvoices = 2,
  filters: CustomerReportFilters = {},
) {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    minimumInvoices: String(minimumInvoices),
  })
  appendOptionalQueryValue(query, 'fromDate', filters.fromDate)
  appendOptionalQueryValue(query, 'toDate', filters.toDate)

  return apiRequest<PaginatedResponse<RegularCustomerReportItem>>(
    `${API_ROUTES.staff.customerReports.regulars}?${query.toString()}`,
  )
}

export function getHighSpenders(pageNumber = 1, pageSize = 10, filters: CustomerReportFilters = {}) {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })
  appendOptionalQueryValue(query, 'fromDate', filters.fromDate)
  appendOptionalQueryValue(query, 'toDate', filters.toDate)

  return apiRequest<PaginatedResponse<HighSpenderReportItem>>(
    `${API_ROUTES.staff.customerReports.highSpenders}?${query.toString()}`,
  )
}

export function getPendingCredits(pageNumber = 1, pageSize = 10, filters: CustomerReportFilters = {}) {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })
  appendOptionalQueryValue(query, 'fromDate', filters.fromDate)
  appendOptionalQueryValue(query, 'toDate', filters.toDate)

  return apiRequest<PaginatedResponse<PendingCreditReportItem>>(
    `${API_ROUTES.staff.customerReports.pendingCredits}?${query.toString()}`,
  )
}

export function getCustomerReportSummary(filters: CustomerReportFilters = {}) {
  const query = new URLSearchParams()
  appendOptionalQueryValue(query, 'fromDate', filters.fromDate)
  appendOptionalQueryValue(query, 'toDate', filters.toDate)

  const qs = query.toString()
  const url = qs
    ? `${API_ROUTES.staff.customerReports.summary}?${qs}`
    : API_ROUTES.staff.customerReports.summary

  return apiRequest<CustomerReportSummary>(url)
}
