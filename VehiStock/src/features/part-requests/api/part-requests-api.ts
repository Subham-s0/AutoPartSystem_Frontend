import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import { appendOptionalQueryValue, appendSorts } from '@/utils/api-helpers'
import type { CreatePartRequestInput, PartRequest, PartRequestQueryInput } from '../types/part-requests'

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

export function createPartRequest(input: CreatePartRequestInput) {
  const formData = new FormData()
  if (input.vehicleId != null) {
    formData.append('vehicleId', String(input.vehicleId))
  }
  formData.append('requestedPartName', input.requestedPartName)
  formData.append('quantity', String(input.quantity))
  if (input.details) {
    formData.append('details', input.details)
  }
  if (input.photo) {
    formData.append('photo', input.photo)
  }

  return apiRequest<PartRequest>(API_ROUTES.customer.partRequests, {
    method: 'POST',
    body: formData,
  })
}

export function cancelPartRequest(partRequestId: number) {
  return apiRequest<PartRequest>(
    `${API_ROUTES.customer.partRequests}/${partRequestId}/cancel`,
    {
      method: 'PATCH',
    },
  )
}

export function getAdminPartRequests(query: PartRequestQueryInput = {}) {
  const searchParams = new URLSearchParams({
    pageNumber: String(query.pageNumber ?? 1),
    pageSize: String(query.pageSize ?? 10),
  })

  appendOptionalQueryValue(searchParams, 'searchText', query.searchText)
  appendOptionalQueryValue(searchParams, 'status', query.status)
  appendSorts(searchParams, query.sorts)

  return apiRequest<PaginatedResponse<PartRequest>>(
    `${API_ROUTES.admin.partRequests}?${searchParams.toString()}`,
  )
}

export function updatePartRequestStatus(partRequestId: number, status: string) {
  return apiRequest<PartRequest>(
    `${API_ROUTES.admin.partRequests}/${partRequestId}/status`,
    {
      method: 'PATCH',
      body: { status },
    },
  )
}
