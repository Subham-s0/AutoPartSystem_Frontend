import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import type { NotificationItem, NotificationQueryInput } from '../types/notifications'

export function getCurrentUserNotifications(
  queryInput: NotificationQueryInput = {},
) {
  const query = new URLSearchParams()
  const pageNumber = queryInput.pageNumber ?? 1
  const pageSize = queryInput.pageSize ?? 10

  query.set('pageNumber', String(pageNumber))
  query.set('pageSize', String(pageSize))

  if (queryInput.notificationType) {
    query.set('notificationType', queryInput.notificationType)
  }

  if (queryInput.isRead !== undefined) {
    query.set('isRead', String(queryInput.isRead))
  }

  if (queryInput.fromDate) {
    query.set('fromDate', queryInput.fromDate)
  }

  if (queryInput.toDate) {
    query.set('toDate', queryInput.toDate)
  }

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
