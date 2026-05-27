import { apiRequest } from '@/services/api-client'
import { API_ROUTES } from '@/constants/api-routes'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Part {
  partId: number
  partCategoryId: number
  categoryName: string
  partCode: string
  partName: string
  brand: string | null
  unitCost: number
  unitPrice: number
  stockQty: number
  minimumStock: number
  isActive: boolean
}

export interface PartUpsertRequest {
  partCategoryId: number
  partCode: string
  partName: string
  brand?: string
  unitCost: number
  unitPrice: number
  stockQty: number
  minimumStock: number
  isActive?: boolean
}

export interface PaginatedParts {
  items: Part[]
  pageNumber: number
  pageSize: number
  totalRecords: number
  totalPages: number
}

// ─── API calls ────────────────────────────────────────────────────────────────

export function getParts(search?: string, pageNumber = 1, pageSize = 10) {
  const params = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })
  if (search?.trim()) params.append('search', search.trim())
  return apiRequest<PaginatedParts>(`${API_ROUTES.parts}?${params.toString()}`)
}

export function getPartById(id: number) {
  return apiRequest<Part>(`${API_ROUTES.parts}/${id}`)
}

export function createPart(data: PartUpsertRequest) {
  return apiRequest<string>(API_ROUTES.parts, { method: 'POST', body: data })
}

export function updatePart(id: number, data: PartUpsertRequest & { isActive: boolean }) {
  return apiRequest<string>(API_ROUTES.parts, { method: 'PUT', body: { partId: id, ...data } })
}

export function deletePart(id: number) {
  return apiRequest<string>(`${API_ROUTES.parts}/${id}`, { method: 'DELETE' })
}
