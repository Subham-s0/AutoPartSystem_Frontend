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
