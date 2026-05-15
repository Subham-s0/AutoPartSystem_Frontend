import type { SortRequest } from '@/types/api'

export interface Review {
  reviewId: number
  serviceRecordId: number
  vehicleNumber: string
  serviceDate: string
  diagnosis: string
  workDone: string
  rating: number
  reviewText: string
  createdAt: string
}

export interface PurchaseHistoryItem {
  partName: string
  brand: string
  quantity: number
  unitPrice: number
  discountAmount: number
  lineTotal: number
}

export interface PurchaseHistory {
  salesInvoiceId: number
  invoiceNo: string
  invoiceDate: string
  vehicleNumber: string
  subtotal: number
  discountPercent: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  amountPaid: number
  balanceDue: number
  paymentStatus: string
  items: PurchaseHistoryItem[]
}

export interface PurchaseHistoryQueryInput {
  pageNumber?: number
  pageSize?: number
  searchText?: string
  status?: string
  sorts?: SortRequest[]
}

export interface SetPurchaseInvoiceLoyaltyInput {
  applyLoyalty: boolean
}

export interface PurchaseInvoiceLoyaltyResult {
  salesInvoiceId: number
  invoiceNo: string
  subtotal: number
  discountPercent: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  amountPaid: number
  balanceDue: number
  paymentStatus: string
}

export interface ServiceHistoryPart {
  partName: string
  brand: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface ServiceInvoiceSummary {
  serviceInvoiceId: number
  laborCharge: number
  partsCharge: number
  discountPercent: number
  taxAmount: number
  totalAmount: number
  amountPaid: number
  balanceDue: number
  paymentStatus: string
}

export interface ServiceHistory {
  serviceRecordId: number
  serviceDate: string
  serviceStatus: string
  vehicleNumber: string
  diagnosis: string
  workDone: string
  laborCharge: number
  partsCharge: number
  totalCharge: number
  notes?: string | null
  staffMemberName: string
  staffJobTitle: string
  serviceInvoice?: ServiceInvoiceSummary | null
  partsUsed: ServiceHistoryPart[]
  review?: Review | null
}

export interface ServiceHistoryQueryInput {
  pageNumber?: number
  pageSize?: number
  searchText?: string
  status?: string
  invoiceStatus?: string
  sorts?: SortRequest[]
}

export interface CustomerHistory {
  purchases: PurchaseHistory[]
  services: ServiceHistory[]
}
