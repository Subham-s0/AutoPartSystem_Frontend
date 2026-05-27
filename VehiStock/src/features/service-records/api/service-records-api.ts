import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { SalesInvoiceLookup } from '@/features/sales-invoices/types/sales-invoices'

export interface ServiceRecordPartRequest {
  partId: number
  quantity: number
}

export interface CreateServiceRecordInput {
export interface CreateServiceRecordRequest {
  customerId: number
  vehicleId: number
  diagnosis: string
  workDone: string
  laborCharge: number
  notes?: string
  partsUsed: ServiceRecordPartRequest[]
}

export interface UpdateServiceRecordInput {
  status?: string
  partsUsed: ServiceRecordPartRequest[]
}

export interface UpdateServiceRecordRequest {
  diagnosis: string
  workDone: string
  laborCharge: number
  notes?: string
  partsUsed: ServiceRecordPartRequest[]
}

export interface ServiceRecordPartResponse {
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

export interface ServiceRecordResponse {
export interface ServiceRecord {
  serviceRecordId: number
  customerId: number
  customerName: string
  vehicleId: number
  vehicleNumber: string
  staffMemberId: number
  staffName: string
  appointmentId: number | null
  appointmentId?: number
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
  notes?: string
  serviceInvoiceId?: number
  partsUsed: ServiceRecordPart[]
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
  return apiRequest<ServiceRecordResponse[]>(API_ROUTES.staff.serviceRecords)
  return apiRequest<ServiceRecord[]>(API_ROUTES.staff.serviceRecords)
}

export function getServiceRecordLookups() {
  return apiRequest<SalesInvoiceLookup>(`${API_ROUTES.staff.serviceRecords}/lookups`)
}

export function createServiceRecord(input: CreateServiceRecordInput) {
  return apiRequest<ServiceRecordResponse>(API_ROUTES.staff.serviceRecords, {
export function createServiceRecord(input: CreateServiceRecordRequest) {
  return apiRequest<ServiceRecord>(API_ROUTES.staff.serviceRecords, {
    method: 'POST',
    body: input,
  })
}

export function updateServiceRecord(id: number, input: UpdateServiceRecordInput) {
  return apiRequest<ServiceRecordResponse>(`${API_ROUTES.staff.serviceRecords}/${id}`, {
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
