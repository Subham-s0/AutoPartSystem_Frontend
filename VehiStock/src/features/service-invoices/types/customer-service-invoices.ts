import type { SortRequest } from '@/types/api'
import type { ServiceHistoryPart } from '@/features/history/types/history'

export interface ServiceInvoiceListItem {
  serviceInvoiceId: number
  serviceRecordId: number
  serviceDate: string
  vehicleNumber: string
  diagnosis: string
  serviceStatus: string
  staffMemberName: string
  laborCharge: number
  partsCharge: number
  discountPercent: number
  taxAmount: number
  totalAmount: number
  amountPaid: number
  balanceDue: number
  paymentStatus: string
  partsUsed: ServiceHistoryPart[]
}

export interface ServiceInvoiceQueryInput {
  pageNumber?: number
  pageSize?: number
  searchText?: string
  status?: string
  sorts?: SortRequest[]
}

export interface SetServiceInvoiceLoyaltyInput {
  applyLoyalty: boolean
}
