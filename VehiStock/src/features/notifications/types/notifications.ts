export interface NotificationQueryInput {
  pageNumber?: number
  pageSize?: number
  notificationType?: string
  isRead?: boolean
  fromDate?: string
  toDate?: string
}

export interface NotificationItem {
  notificationId: number
  notificationType: string
  title: string
  message: string
  referenceType?: string | null
  referenceId?: number | null
  isRead: boolean
  createdAt: string
  readAt?: string | null
}
