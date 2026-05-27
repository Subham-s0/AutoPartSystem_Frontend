import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'

// ─── Types that mirror backend DashboardSummaryDto exactly ───────────────────

export interface MonthlyPurchase {
  month: string
  amount: number
}

export interface LowStockPart {
  partName: string
  stockQty: number
}

export interface RecentActivity {
  activity: string
  module: string
  status: string
}

export interface DashboardSummary {
  totalVendors: number
  totalParts: number
  totalPurchaseInvoices: number
  /** Number of parts at or below minimum stock */
  lowStockParts: number
  totalPurchaseAmount: number
  monthlyPurchases: MonthlyPurchase[]
  lowStockItems: LowStockPart[]
  recentActivities: RecentActivity[]
}

// ─── API call ─────────────────────────────────────────────────────────────────

export function getDashboardSummary() {
  return apiRequest<DashboardSummary>(API_ROUTES.admin.analytics)
}
