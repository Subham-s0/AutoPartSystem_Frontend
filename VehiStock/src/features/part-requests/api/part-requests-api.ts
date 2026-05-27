import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import { appendOptionalQueryValue, appendSorts } from '@/utils/api-helpers'
import type {
  AdminPartRequest,
  CreatePartRequestInput,
  PartRequest,
  PartRequestQueryInput,
  UpdatePartRequestStatusInput,
} from '../types/part-requests'

// ─── Customer: list ──────────────────────────────────────────────────────────

export function getPartRequests(query: PartRequestQueryInput = {}) {
  const searchParams = new URLSearchParams({
    pageNumber: String(query.pageNumber ?? 1),
    pageSize: String(query.pageSize ?? 10),
  })

  appendOptionalQueryValue(searchParams, 'searchText', query.searchText)
  appendOptionalQueryValue(searchParams, 'status', query.status)
  appendSorts(searchParams, query.sorts)

  return apiRequest<PaginatedResponse<PartRequest>>(
    `${API_ROUTES.customer.partRequests}?${searchParams.toString()}`,
  )
}

// ─── Customer: create (with optional image) ──────────────────────────────────

export function createPartRequest(input: CreatePartRequestInput) {
  // If the caller provides an image file use multipart/form-data; otherwise JSON
  if (input.partImage) {
    const fd = new FormData()
    if (input.vehicleId != null) fd.append('vehicleId', String(input.vehicleId))
    fd.append('requestedPartName', input.requestedPartName)
    fd.append('quantity', String(input.quantity))
    if (input.details) fd.append('details', input.details)
    fd.append('partImage', input.partImage)

    return apiRequest<PartRequest>(API_ROUTES.customer.partRequests, {
      method: 'POST',
      body: fd,
    })
  }

  // No image → plain JSON (existing behaviour)
  const { partImage: _drop, ...rest } = input
  return apiRequest<PartRequest>(API_ROUTES.customer.partRequests, {
    method: 'POST',
    body: rest,
  })
}

// ─── Customer: cancel ────────────────────────────────────────────────────────

export function cancelPartRequest(partRequestId: number) {
  return apiRequest<PartRequest>(
    `${API_ROUTES.customer.partRequests}/${partRequestId}/cancel`,
    { method: 'PATCH' },
  )
}

// ─── Admin: list all part requests ───────────────────────────────────────────

export function getAdminPartRequests(query: PartRequestQueryInput = {}) {
  const searchParams = new URLSearchParams({
    pageNumber: String(query.pageNumber ?? 1),
    pageSize: String(query.pageSize ?? 20),
  })

  appendOptionalQueryValue(searchParams, 'searchText', query.searchText)
  appendOptionalQueryValue(searchParams, 'status', query.status)
  appendSorts(searchParams, query.sorts)

  return apiRequest<PaginatedResponse<AdminPartRequest>>(
    `${API_ROUTES.admin.partRequests}?${searchParams.toString()}`,
  )
}

// ─── Admin: update status ────────────────────────────────────────────────────

export function updatePartRequestStatus(
  partRequestId: number,
  input: UpdatePartRequestStatusInput,
) {
  return apiRequest<AdminPartRequest>(
    `${API_ROUTES.admin.partRequests}/${partRequestId}/status`,
    { method: 'PATCH', body: input },
  )
}

