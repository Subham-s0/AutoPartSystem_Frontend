export interface CustomerDirectoryVehicle {
  vehicleId: number
  vehicleNumber: string
  make: string
  model: string
  manufactureYear: number
  mileageKm: number
}

export interface CustomerDirectoryItem {
  customerId: number
  userId: string
  fullName: string
  email: string
  phoneNumber?: string | null
  profilePhotoUrl?: string | null
  address: string
  registrationSource: string
  registeredAt: string
  vehicles: CustomerDirectoryVehicle[]
}

export interface CustomerDirectoryInvoice {
  salesInvoiceId: number
  invoiceNo: string
  invoiceDate: string
  vehicleNumber: string
  totalAmount: number
  amountPaid: number
  balanceDue: number
  paymentStatus: string
}

export interface CustomerDirectoryPayment {
  paymentId: number
  paymentDate: string
  amount: number
  paymentType: string
  notes?: string | null
  salesInvoiceId?: number | null
  invoiceNo?: string | null
}

export interface CustomerReportSnapshot {
  totalVehicles: number
  totalInvoices: number
  totalSpent: number
  totalPaid: number
  outstandingBalance: number
  lastInvoiceDate?: string | null
}

export interface CustomerDirectoryDetail {
  customerId: number
  userId: string
  fullName: string
  email: string
  phoneNumber?: string | null
  profilePhotoUrl?: string | null
  isActive: boolean
  address: string
  registrationSource: string
  registeredAt: string
  vehicles: CustomerDirectoryVehicle[]
  salesInvoices: CustomerDirectoryInvoice[]
  payments: CustomerDirectoryPayment[]
  reportSnapshot: CustomerReportSnapshot
}
