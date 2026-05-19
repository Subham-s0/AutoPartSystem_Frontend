import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import type { NotificationItem } from '../types/notifications'

export function getAdminNotifications(pageNumber = 1, pageSize = 20) {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })

  return apiRequest<PaginatedResponse<NotificationItem>>(
    `${API_ROUTES.admin.notifications}?${query.toString()}`,
  )
}

export function markNotificationAsRead(notificationId: number) {
  return apiRequest<string>(`${API_ROUTES.admin.notifications}/${notificationId}/read`, {
    method: 'PATCH',
  })
}

export function processNotifications() {
  return apiRequest<string>(`${API_ROUTES.admin.notifications}/process`, {
    method: 'POST',
  })
}
