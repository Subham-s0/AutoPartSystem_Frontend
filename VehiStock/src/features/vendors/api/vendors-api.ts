import { apiRequest } from '@/services/api-client'
import { API_ROUTES } from '@/constants/api-routes'
import type { Vendor, VendorUpsertRequest } from '../types'

export interface PaginatedVendors {
  items: Vendor[]
  pageNumber: number
  pageSize: number
  totalRecords: number
  totalPages: number
}

export async function getAllVendors(search?: string, page: number = 1, pageSize: number = 10) {
  const params = new URLSearchParams({
    pageNumber: String(page),
    pageSize: String(pageSize),
  })
  if (search?.trim()) {
    params.append('search', search.trim())
  }
  return apiRequest<PaginatedVendors>(`${API_ROUTES.admin.vendors}?${params.toString()}`)
}

export async function getVendorById(id: number) {
  return apiRequest<Vendor>(`${API_ROUTES.admin.vendors}/${id}`)
}

export async function createVendor(data: VendorUpsertRequest) {
  return apiRequest<Vendor>(API_ROUTES.admin.vendors, {
    method: 'POST',
    body: data,
  })
}

export async function updateVendor(id: number, data: VendorUpsertRequest) {
  return apiRequest<Vendor>(`${API_ROUTES.admin.vendors}/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteVendor(id: number) {
  return apiRequest<void>(`${API_ROUTES.admin.vendors}/${id}`, {
    method: 'DELETE',
  })
}
