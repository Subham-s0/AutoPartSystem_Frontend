import type { UserRole } from '@/constants/roles'

export interface RegisterStaffInput {
  fullName: string
  email: string
  password: string
  phoneNumber?: string
  profilePhotoUrl?: string
  jobTitle: string
  hireDate?: string
}

export interface RegisterUserResult {
  succeeded: boolean
  userId?: string | null
  role?: string | null
  customerId?: number | null
  staffMemberId?: number | null
  errors?: string[]
}

export interface StaffSummary {
  userId: string
  fullName: string
  email: string
  phoneNumber?: string | null
  profilePhotoUrl?: string | null
  jobTitle: string
  hireDate: string
  role: UserRole | string
  isActive: boolean
  staffMemberId: number
}

export interface StaffInvoiceActivity {
  salesInvoiceId: number
  invoiceNo: string
  customerName: string
  invoiceDate: string
  totalAmount: number
  paymentStatus: string
}

export interface StaffDetail extends StaffSummary {
  totalInvoicesCreated: number
  totalInvoiceValue: number
  recentInvoices: StaffInvoiceActivity[]
}

export interface UpdateStaffRoleInput {
  role: UserRole | string
}
