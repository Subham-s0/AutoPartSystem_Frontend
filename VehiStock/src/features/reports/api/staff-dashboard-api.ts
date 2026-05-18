import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'

export interface RecentSalesInvoiceDto {
  salesInvoiceId: number
  invoiceNo: string
  customerName: string
  totalAmount: number
  invoiceDate: string
}

export interface LowStockPartDto {
  partId: number
  partName: string
  brand: string
  stockQty: number
}

export interface StaffDashboardResponse {
  totalActiveCustomers: number
  totalPartsInCatalog: number
  lowStockPartsCount: number
  pendingServiceAppointments: number
  todayRevenue: number
  todaySalesInvoiceCount: number
  recentSalesInvoices: RecentSalesInvoiceDto[]
  lowStockParts: LowStockPartDto[]
}

export function getStaffDashboardSummary() {
  return apiRequest<StaffDashboardResponse>(API_ROUTES.staff.dashboard)
}
