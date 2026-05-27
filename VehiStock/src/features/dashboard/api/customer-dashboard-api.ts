import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'

export interface CustomerDashboardKpis {
  activeVehiclesCount: number
  upcomingAppointmentsCount: number
  outstandingBalance: number
  pendingPartRequestsCount: number
}

export interface MonthlySpending {
  month: string
  amount: number
}

export interface RecentActivity {
  type: string
  description: string
  date: string
}

export interface CustomerDashboardResponse {
  kpis: CustomerDashboardKpis
  spendingTrend: MonthlySpending[]
  recentActivities: RecentActivity[]
}

export function getCustomerDashboardSummary() {
  return apiRequest<CustomerDashboardResponse>(API_ROUTES.customer.dashboard)
}
