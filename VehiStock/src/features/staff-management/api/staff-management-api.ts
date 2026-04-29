import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import type { StaffSummary, UpdateStaffRoleInput } from '../types/staff-management'

export function getStaff(pageNumber = 1, pageSize = 10) {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })

  return apiRequest<PaginatedResponse<StaffSummary>>(
    `${API_ROUTES.admin.staff}?${query.toString()}`,
  )
}

export function updateStaffRole(userId: string, input: UpdateStaffRoleInput) {
  return apiRequest<StaffSummary>(`${API_ROUTES.admin.staff}/${userId}/role`, {
    method: 'PUT',
    body: input,
  })
}
