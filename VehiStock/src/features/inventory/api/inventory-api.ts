import { apiRequest } from '@/services/api-client'
import { API_ROUTES } from '@/constants/api-routes'
import type { Part, PartUpsertRequest, PartCategory } from '../types/inventory'
import type { PaginatedResponse } from '@/types/api'

export async function getAllParts(search?: string, pageNumber: number = 1, pageSize: number = 10) {
  const query = new URLSearchParams()
  if (search) query.append('search', search)
  query.append('pageNumber', String(pageNumber))
  query.append('pageSize', String(pageSize))

  // The backend uses VehiStock.Application.Dtos.Common.PaginatedResponse
  return apiRequest<PaginatedResponse<Part>>(`${API_ROUTES.admin.parts}?${query.toString()}`)
}

export async function getPartById(id: number) {
  return apiRequest<Part>(`${API_ROUTES.admin.parts}/${id}`)
}

export async function createPart(data: FormData | PartUpsertRequest) {
  const isFormData = data instanceof FormData
  return apiRequest<Part>(API_ROUTES.admin.parts, {
    method: 'POST',
    body: data,
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' }
  })
}

export async function updatePart(_id: number, data: FormData | PartUpsertRequest) {
  const isFormData = data instanceof FormData
  // Backend PUT /api/parts accepts PartId inside the body (multipart or JSON)
  return apiRequest<Part>(API_ROUTES.admin.parts, {
    method: 'PUT',
    body: data,
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' }
  })
}

export async function deletePart(id: number) {
  return apiRequest<void>(`${API_ROUTES.admin.parts}/${id}`, {
    method: 'DELETE',
  })
}

export async function getPartCategories() {
  // If the backend doesn't have a specific endpoint for categories yet, 
  // we can mock this or use a generic list for now.
  return Promise.resolve([
    { id: 1, name: 'Engine' },
    { id: 2, name: 'Brakes' },
    { id: 3, name: 'Suspension' },
    { id: 4, name: 'Electrical' },
    { id: 5, name: 'Fluids' },
    { id: 6, name: 'Filters' },
  ])
}
