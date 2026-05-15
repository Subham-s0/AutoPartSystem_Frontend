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
  return apiRequest<PartRequest>(API_ROUTES.customer.partRequests, {
    method: 'POST',
    body: input,
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
