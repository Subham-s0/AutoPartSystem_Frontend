import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'

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
  lowStockParts: number
  totalPurchaseAmount: number
  monthlyPurchases: MonthlyPurchase[]
  lowStockItems: LowStockPart[]
  recentActivities: RecentActivity[]
}

export function getDashboardSummary() {
  return apiRequest<DashboardSummary>(`${API_ROUTES.admin.analytics}/summary`)
}
