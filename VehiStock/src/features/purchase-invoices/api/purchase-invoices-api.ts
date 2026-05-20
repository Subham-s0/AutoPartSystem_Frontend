import { apiRequest } from '@/services/api-client'

// PaymentStatus matches backend enum exactly
export enum PaymentStatus {
  Unpaid = 1,
  Partial = 2,
  Paid = 3,
  Overdue = 4,
  Cancelled = 5,
}

export function paymentStatusLabel(status: number | PaymentStatus | null | undefined): string {
  switch (Number(status)) {
    case PaymentStatus.Paid: return 'Paid'
    case PaymentStatus.Unpaid: return 'Unpaid'
    case PaymentStatus.Partial: return 'Partial'
    case PaymentStatus.Overdue: return 'Overdue'
    case PaymentStatus.Cancelled: return 'Cancelled'
    default: return 'Unknown'
  }
}

export function isPaid(status: number | PaymentStatus | null | undefined): boolean {
  return Number(status) === PaymentStatus.Paid
}

export interface PurchaseInvoiceItem {
  partId: number
  quantity: number
  unitCost: number
  unitPrice: number
}

export interface PurchaseInvoiceItemDto extends PurchaseInvoiceItem {
  purchaseInvoiceItemId: number
  partName: string | null
  lineTotal: number
}

export interface CreatePurchaseInvoiceDto {
  vendorId: number
  invoiceNo: string
  purchaseDate: string
  taxAmount: number
  discountAmount: number
  paymentStatus: number  // Use numeric enum value
  notes?: string
  items: PurchaseInvoiceItem[]
}

export interface PurchaseInvoiceDto {
  purchaseInvoiceId: number
  vendorId: number
  vendorName: string | null
  invoiceNo: string
  purchaseDate: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paymentStatus: number  // Comes back as integer from backend
  notes?: string | null
  createdByUserId: string
  items: PurchaseInvoiceItemDto[]
}

export async function getAllPurchaseInvoices() {
  return apiRequest<PurchaseInvoiceDto[]>('/api/purchaseinvoices')
}

export async function getPurchaseInvoiceById(id: number) {
  return apiRequest<PurchaseInvoiceDto>(`/api/purchaseinvoices/${id}`)
}

export async function createPurchaseInvoice(data: CreatePurchaseInvoiceDto) {
  return apiRequest<{ message: string }>('/api/purchaseinvoices', {
    method: 'POST',
    body: data,
  })
}
