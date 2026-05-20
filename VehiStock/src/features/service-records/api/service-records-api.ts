import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { SalesInvoiceLookup } from '@/features/sales-invoices/types/sales-invoices'

export interface ServiceRecordPartRequest {
  partId: number
  quantity: number
}

export interface CreateServiceRecordRequest {
  customerId: number
  vehicleId: number
  diagnosis: string
  workDone: string
  laborCharge: number
  notes?: string
  status?: string
  partsUsed: ServiceRecordPartRequest[]
}

export interface UpdateServiceRecordRequest {
  diagnosis: string
  workDone: string
  laborCharge: number
  notes?: string
  status?: string
  partsUsed: ServiceRecordPartRequest[]
}

export interface ServiceRecordPart {
  serviceRecordPartId: number
  partId: number
  partName: string
  brand: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface ServiceRecord {
  serviceRecordId: number
  customerId: number
  customerName: string
  vehicleId: number
  vehicleNumber: string
  staffMemberId: number
  staffName: string
  appointmentId?: number
  serviceDate: string
  status: string
  diagnosis: string
  workDone: string
  laborCharge: number
  partsCharge: number
  totalCharge: number
  notes?: string
  serviceInvoiceId?: number
  partsUsed: ServiceRecordPart[]
}

export interface ServiceInvoiceResponse {
  serviceInvoiceId: number
  invoiceNo: string
  customerId: number
  customerName: string
  vehicleId: number
  vehicleNumber: string
  serviceRecordId: number
  invoiceDate: string
  laborCharge: number
  partsCharge: number
  totalAmount: number
  paymentStatus: string
}

export function getServiceRecords() {
  return apiRequest<ServiceRecord[]>(API_ROUTES.staff.serviceRecords)
}

export function getServiceRecordLookups() {
  return apiRequest<SalesInvoiceLookup>(`${API_ROUTES.staff.serviceRecords}/lookups`)
}

export function createServiceRecord(input: CreateServiceRecordRequest) {
  return apiRequest<ServiceRecord>(API_ROUTES.staff.serviceRecords, {
    method: 'POST',
    body: input,
  })
}

export function updateServiceRecord(id: number, input: UpdateServiceRecordRequest) {
  return apiRequest<ServiceRecord>(`${API_ROUTES.staff.serviceRecords}/${id}`, {
    method: 'PUT',
    body: input,
  })
}

export function generateServiceInvoice(id: number) {
  return apiRequest<ServiceInvoiceResponse>(`${API_ROUTES.staff.serviceRecords}/${id}/invoice`, {
    method: 'POST',
  })
}
