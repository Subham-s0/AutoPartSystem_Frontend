import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import type { NotificationItem } from '../types/notifications'

export function getCurrentUserNotifications(pageNumber = 1, pageSize = 6) {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })

  return apiRequest<PaginatedResponse<NotificationItem>>(
    `${API_ROUTES.notifications.current}?${query.toString()}`,
  )
}

export function markCurrentUserNotificationAsRead(notificationId: number) {
  return apiRequest<string>(
    `${API_ROUTES.notifications.current}/${notificationId}/read`,
    {
      method: 'PATCH',
    },
  )
}
