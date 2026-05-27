import { apiRequest } from '@/services/api-client'
import { API_ROUTES } from '@/constants/api-routes'

export interface FinancialReport {
  totalSalesRevenue: number
  totalServiceRevenue: number
  totalCombinedRevenue: number
  totalPurchaseCost: number
  totalProfit: number
  totalItemsSold: number
  fromDate: string
  toDate: string
  breakdown: { label: string; salesRevenue: number; serviceRevenue: number; revenue: number; cost: number; profit: number }[]
}

export async function getDailyReport(date?: string) {
  const params = date ? `?date=${date}` : ''
  return apiRequest<FinancialReport>(`${API_ROUTES.admin.reports.daily}${params}`)
}

export async function getMonthlyReport(year: number, month: number) {
  return apiRequest<FinancialReport>(`${API_ROUTES.admin.reports.monthly}?year=${year}&month=${month}`)
}

export async function getYearlyReport(year: number) {
  return apiRequest<FinancialReport>(`${API_ROUTES.admin.reports.yearly}?year=${year}`)
}
