import * as React from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROLE_NAMES } from '@/constants/roles'
import { ROUTE_PATHS } from '@/app/config/routes'
import {
  getCurrentUserNotifications,
  markCurrentUserNotificationAsRead,
} from '@/features/notifications/api/user-notifications-api'
import { useAuth } from '@/hooks/use-auth'
import { formatDateTime } from '@/lib/date'
import { ApiError } from '@/types/api'
import type { NotificationItem } from '@/features/notifications/types/notifications'
import type { PropsWithChildren, ReactNode } from 'react'

interface AppHeaderProps {
  actions?: ReactNode
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('')
}

export function AppHeader({ actions }: PropsWithChildren<AppHeaderProps>) {
  const { user } = useAuth()
  const displayName = user?.fullName ?? 'User'
  const [open, setOpen] = React.useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = React.useState(false)
  const [notificationError, setNotificationError] = React.useState<string | null>(null)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])

  const unreadCount = notifications.filter((item) => !item.isRead).length

  const loadNotifications = React.useCallback(async () => {
    if (!user) {
      setNotifications([])
      return
    }

    setIsLoadingNotifications(true)
    setNotificationError(null)

    try {
      const result = await getCurrentUserNotifications(1, 6)
      setNotifications(result.items)
    } catch (error) {
      setNotificationError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Unable to load notifications.',
      )
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [user])

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadNotifications()
    })
  }, [loadNotifications])

  async function handleMarkAsRead(notificationId: number) {
    try {
      await markCurrentUserNotificationAsRead(notificationId)
      setNotifications((current) =>
        current.map((item) =>
          item.notificationId === notificationId
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      )
    } catch (error) {
      setNotificationError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Unable to update notification.',
      )
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        {actions}
      </div>
      <div className="topbar-right">
        <DropdownMenu
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen)
            if (nextOpen) {
              void loadNotifications()
            }
          }}
          open={open}
        >
          <DropdownMenuTrigger asChild>
            <button
              className="notif"
              type="button"
              aria-label="Open notifications"
            >
              <Bell size={14} />
              {unreadCount > 0 ? <span className="notif-dot" /> : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="notif-panel">
            <div className="notif-panel-head">
              <div className="notif-panel-title">Notifications</div>
              <div className="notif-panel-head-right">
                <div className="notif-panel-sub">
                  {unreadCount > 0
                    ? `${unreadCount} unread item${unreadCount === 1 ? '' : 's'}`
                    : 'You are up to date.'}
                </div>
                {user?.role === ROLE_NAMES.admin ? (
                  <Link className="notif-panel-link" to={ROUTE_PATHS.admin.notifications}>
                    Open page
                  </Link>
                ) : null}
              </div>
            </div>
            <DropdownMenuSeparator />
            {notificationError ? (
              <div className="notif-panel-error">{notificationError}</div>
            ) : isLoadingNotifications ? (
              <div className="notif-panel-empty">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-panel-empty">No notifications available.</div>
            ) : (
              <div className="notif-list">
                {notifications.map((item) => (
                  <div className="notif-item" key={item.notificationId}>
                    <div className="notif-item-top">
                      <div className="notif-item-title">{item.title}</div>
                      {!item.isRead ? (
                        <span className="badge ba">Unread</span>
                      ) : null}
                    </div>
                    <div className="notif-item-message">{item.message}</div>
                    <div className="notif-item-meta">
                      <span>{formatDateTime(item.createdAt)}</span>
                      {!item.isRead ? (
                        <button
                          className="notif-item-action"
                          onClick={() => void handleMarkAsRead(item.notificationId)}
                          type="button"
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="topbar-profile">
          <div className="topbar-avatar">{getInitials(displayName)}</div>
          <div className="topbar-uname">{displayName}</div>
        </div>
      </div>
    </header>
  )
}
