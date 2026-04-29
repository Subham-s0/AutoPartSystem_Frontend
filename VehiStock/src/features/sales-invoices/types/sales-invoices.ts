export interface CreateSalesInvoiceItemInput {
  partId: number
  quantity: number
  discountAmount: number
}

export interface CreateSalesInvoiceInput {
  invoiceNo: string
  customerId: number
  vehicleId: number
  invoiceDate: string
  discountPercent: number
  taxAmount: number
  amountPaid: number
  creditDueDate?: string
  paymentType: number
  items: CreateSalesInvoiceItemInput[]
}

export interface SalesInvoiceItem {
  partId: number
  partName: string
  brand: string
  quantity: number
  unitPrice: number
  discountAmount: number
  lineTotal: number
}

export interface SalesInvoice {
  salesInvoiceId: number
  invoiceNo: string
  customerId: number
  vehicleId: number
  staffMemberId: number
  invoiceDate: string
  subtotal: number
  discountPercent: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  amountPaid: number
  balanceDue: number
  creditDueDate?: string | null
  paymentType: number | string
  paymentStatus: string
  items: SalesInvoiceItem[]
}
