import type { SortRequest } from '@/types/api'

export interface InvoicePaymentInitiateInput {
  amount: number
}

export interface InvoicePaymentInitiation {
  serviceInvoiceId: number
  salesInvoiceId?: number | null
  serviceRecordId: number
  pidx: string
  paymentUrl: string
  expiresAt?: string | null
  amount: number
}

export interface InvoicePaymentVerifyInput {
  pidx: string
  purchaseOrderId: string
}

export interface InvoicePaymentVerification {
  serviceInvoiceId: number
  salesInvoiceId?: number | null
  khaltiStatus: string
  mappedPaymentStatus: string
  amount: number
  transactionId?: string | null
  alreadyProcessed: boolean
  newAmountPaid: number
  newBalanceDue: number
  newPaymentStatus: string
}

export interface CustomerPaymentQueryInput {
  pageNumber?: number
  pageSize?: number
  searchText?: string
  invoiceKind?: string
  paymentType?: string
  invoiceStatus?: string
  fromDate?: string
  toDate?: string
  sorts?: SortRequest[]
}

export interface CustomerPaymentListItem {
  paymentId: number
  paymentDate: string
  amount: number
  paymentType: string
  invoiceKind: string
  salesInvoiceId?: number | null
  serviceInvoiceId?: number | null
  invoiceReference: string
  vehicleNumber: string
  invoicePaymentStatus: string
  transactionId?: string | null
}
