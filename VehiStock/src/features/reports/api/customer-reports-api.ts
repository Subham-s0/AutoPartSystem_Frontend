import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import type {
  HighSpenderReportItem,
  PendingCreditReportItem,
  RegularCustomerReportItem,
} from '../types/customer-reports'

export function getRegularCustomers(
  pageNumber = 1,
  pageSize = 10,
  minimumInvoices = 2,
) {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    minimumInvoices: String(minimumInvoices),
  })

  return apiRequest<PaginatedResponse<RegularCustomerReportItem>>(
    `${API_ROUTES.staff.customerReports.regulars}?${query.toString()}`,
  )
}

export function getHighSpenders(pageNumber = 1, pageSize = 10) {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })

  return apiRequest<PaginatedResponse<HighSpenderReportItem>>(
    `${API_ROUTES.staff.customerReports.highSpenders}?${query.toString()}`,
  )
}

export function getPendingCredits(pageNumber = 1, pageSize = 10) {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })

  return apiRequest<PaginatedResponse<PendingCreditReportItem>>(
    `${API_ROUTES.staff.customerReports.pendingCredits}?${query.toString()}`,
  )
}
