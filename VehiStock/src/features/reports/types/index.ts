export interface FinancialReportData {
  period: string
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  transactionCount: number
  topSellingParts: { partName: string; quantity: number; revenue: number }[]
}

export interface DailyReport extends FinancialReportData {
  date: string
}

export interface MonthlyReport extends FinancialReportData {
  year: number
  month: number
}

export interface YearlyReport extends FinancialReportData {
  year: number
}
