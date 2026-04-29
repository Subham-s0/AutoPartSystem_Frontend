export interface CreateSalesInvoiceItemInput {
  partId: number
  quantity: number
  discountAmount: number
}

export interface CreateSalesInvoiceInput {
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

export interface SalesInvoiceVehicleLookup {
  vehicleId: number
  vehicleNumber: string
  make: string
  model: string
}

export interface SalesInvoiceCustomerLookup {
  customerId: number
  fullName: string
  email: string
  phoneNumber?: string | null
  vehicles: SalesInvoiceVehicleLookup[]
}

export interface SalesInvoicePartLookup {
  partId: number
  partName: string
  brand: string
  unitPrice: number
  stockQty: number
}

export interface SalesInvoiceLookup {
  customers: SalesInvoiceCustomerLookup[]
  parts: SalesInvoicePartLookup[]
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
