import { apiRequest } from '@/services/api-client'
import { API_ROUTES } from '@/constants/api-routes'
import type { Part, PartUpsertRequest, PartCategory } from '../types/inventory'

export async function getAllParts() {
  return apiRequest<Part[]>(`${API_ROUTES.admin.inventory}/parts`)
}

export async function getPartById(id: number) {
  return apiRequest<Part>(`${API_ROUTES.admin.inventory}/parts/${id}`)
}

export async function createPart(data: PartUpsertRequest) {
  return apiRequest<Part>(`${API_ROUTES.admin.inventory}/parts`, {
    method: 'POST',
    body: data,
  })
}

export async function updatePart(id: number, data: PartUpsertRequest) {
  return apiRequest<Part>(`${API_ROUTES.admin.inventory}/parts/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deletePart(id: number) {
  return apiRequest<void>(`${API_ROUTES.admin.inventory}/parts/${id}`, {
    method: 'DELETE',
  })
}

export async function getPartCategories() {
  return apiRequest<PartCategory[]>(`${API_ROUTES.admin.inventory}/categories`)
}
