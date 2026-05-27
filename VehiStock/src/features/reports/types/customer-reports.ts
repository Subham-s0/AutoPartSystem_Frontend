export interface RegularCustomerReportItem {
  customerId: number
  fullName: string
  email: string
  invoiceCount: number
  totalSpent: number
  lastInvoiceDate?: string | null
}

export interface HighSpenderReportItem {
  customerId: number
  fullName: string
  email: string
  invoiceCount: number
  totalSpent: number
  totalPaid: number
}

export interface PendingCreditReportItem {
  salesInvoiceId: number
  invoiceNo: string
  customerId: number
  fullName: string
  email: string
  invoiceDate: string
  creditDueDate?: string | null
  totalAmount: number
  amountPaid: number
  balanceDue: number
}

export interface CustomerReportSummary {
  totalCustomersWithInvoices: number
  totalInvoices: number
  totalRevenue: number
  totalOutstandingBalance: number
  averageCustomerSpend: number
}

export interface CustomerReportFilters {
  fromDate?: string
  toDate?: string
}
