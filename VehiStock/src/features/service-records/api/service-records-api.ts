import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { SalesInvoiceLookup } from '@/features/sales-invoices/types/sales-invoices'

export interface ServiceRecordPartRequest {
  partId: number
  quantity: number
}

export interface CreateServiceRecordInput {
  customerId: number
  vehicleId: number
  diagnosis: string
  workDone: string
  laborCharge: number
  notes?: string
  partsUsed: ServiceRecordPartRequest[]
}

export interface UpdateServiceRecordInput {
  diagnosis: string
  workDone: string
  laborCharge: number
  notes?: string
  partsUsed: ServiceRecordPartRequest[]
}

export interface ServiceRecordPartResponse {
  serviceRecordPartId: number
  partId: number
  partName: string
  brand: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface ServiceRecordResponse {
  serviceRecordId: number
  customerId: number
  customerName: string
  vehicleId: number
  vehicleNumber: string
  staffMemberId: number
  staffName: string
  appointmentId: number | null
  serviceDate: string
  status: string
  diagnosis: string
  workDone: string
  laborCharge: number
  partsCharge: number
  totalCharge: number
  notes: string | null
  serviceInvoiceId: number | null
  partsUsed: ServiceRecordPartResponse[]
}

export interface ServiceInvoiceResponse {
  serviceInvoiceId: number
  serviceRecordId: number
  customerId: number
  vehicleId: number
  laborCharge: number
  partsCharge: number
  discountPercent: number
  taxAmount: number
  totalAmount: number
  amountPaid: number
  balanceDue: number
  paymentStatus: string
}

export function getServiceRecords() {
  return apiRequest<ServiceRecordResponse[]>(API_ROUTES.staff.serviceRecords)
}

export function getServiceRecordLookups() {
  return apiRequest<SalesInvoiceLookup>(`${API_ROUTES.staff.serviceRecords}/lookups`)
}

export function createServiceRecord(input: CreateServiceRecordInput) {
  return apiRequest<ServiceRecordResponse>(API_ROUTES.staff.serviceRecords, {
    method: 'POST',
    body: input,
  })
}

export function updateServiceRecord(id: number, input: UpdateServiceRecordInput) {
  return apiRequest<ServiceRecordResponse>(`${API_ROUTES.staff.serviceRecords}/${id}`, {
    method: 'PUT',
    body: input,
  })
}

export function generateServiceInvoice(id: number) {
  return apiRequest<ServiceInvoiceResponse>(`${API_ROUTES.staff.serviceRecords}/${id}/invoice`, {
    method: 'POST',
  })
}
