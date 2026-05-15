import * as React from 'react'
import { Bell, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/shared/data-table'
import { DateRangeFilterPopover } from '@/components/shared/date-range-filter-popover'
import { PageSection } from '@/components/shared/page-section'
import {
  getCurrentUserNotifications,
  markCurrentUserNotificationAsRead,
} from '@/features/notifications/api/user-notifications-api'
import { getCustomerNotificationActionLink } from '@/features/notifications/notification-action-links'
import type { NotificationItem } from '@/features/notifications/types/notifications'
import { usePagination } from '@/hooks/use-pagination'
import { formatDateTime } from '@/utils/date'
import { ApiError, type PaginatedResponse } from '@/types/api'

const CUSTOMER_NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  CreditReminder: 'Credit reminder',
  InvoiceSent: 'New invoice',
  AppointmentUpdate: 'Appointments',
}

const NOTIFICATION_TYPE_OPTIONS = [
  { label: 'All types', value: '' },
  ...Object.entries(CUSTOMER_NOTIFICATION_TYPE_LABELS).map(([value, label]) => ({
    label,
    value,
  })),
]

const READ_FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Unread', value: 'unread' },
  { label: 'Read', value: 'read' },
]

function getNotificationBadge(type: string) {
  switch (type.toLowerCase()) {
    case 'creditreminder':
      return 'ba'
    case 'invoicesent':
      return 'bg'
    case 'appointmentupdate':
      return 'bg'
    default:
      return 'ba'
  }
}

function formatNotificationType(type: string) {
  return (
    CUSTOMER_NOTIFICATION_TYPE_LABELS[type] ??
    type.replace(/([a-z])([A-Z])/g, '$1 $2')
  )
}

function getNotificationFilterLabel(notificationType: string, readFilter: string) {
  const parts: string[] = []

  if (notificationType) {
    parts.push(
      NOTIFICATION_TYPE_OPTIONS.find((option) => option.value === notificationType)?.label ??
        notificationType,
    )
  }

  if (readFilter) {
    parts.push(
      READ_FILTER_OPTIONS.find((option) => option.value === readFilter)?.label ?? readFilter,
    )
  }

  if (parts.length === 0) {
    return 'Filters'
  }

  return parts.join(' · ')
}

export function CustomerNotificationsPage() {
  const pagination = usePagination(1, 10)
  const [notificationType, setNotificationType] = React.useState('')
  const [readFilter, setReadFilter] = React.useState('')
  const [fromDate, setFromDate] = React.useState('')
  const [toDate, setToDate] = React.useState('')
  const [result, setResult] = React.useState<PaginatedResponse<NotificationItem> | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadNotifications = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const nextResult = await getCurrentUserNotifications({
        pageNumber: pagination.page,
        pageSize: pagination.pageSize,
        notificationType: notificationType || undefined,
        isRead:
          readFilter === 'read' ? true : readFilter === 'unread' ? false : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      })
      setResult(nextResult)
    } catch (loadError) {
      setResult(null)
      setError(
        loadError instanceof ApiError || loadError instanceof Error
          ? loadError.message
          : 'Unable to load notifications.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    fromDate,
    notificationType,
    pagination.page,
    pagination.pageSize,
    readFilter,
    toDate,
  ])

  React.useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  async function handleMarkAsRead(notificationId: number) {
    try {
      await markCurrentUserNotificationAsRead(notificationId)
      setResult((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.notificationId === notificationId
                  ? { ...item, isRead: true, readAt: new Date().toISOString() }
                  : item,
              ),
            }
          : current,
      )
    } catch (markError) {
      setError(
        markError instanceof ApiError || markError instanceof Error
          ? markError.message
          : 'Unable to mark notification as read.',
      )
    }
  }

  const notifications = result?.items ?? []
  const totalRecords = result?.totalRecords ?? 0
  const totalPages = result && result.totalPages > 0 ? result.totalPages : 1
  const startRecord =
    totalRecords === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const endRecord =
    totalRecords === 0 ? 0 : Math.min(startRecord + notifications.length - 1, totalRecords)
  const hasFilters = Boolean(notificationType || readFilter || fromDate || toDate)

  return (
    <PageSection
      description="Payment reminders and account alerts for your Vehistock profile."
      title="Notifications"
    >
      {error ? (
        <div className="mb-4 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex min-h-[38px] max-w-[220px] cursor-pointer items-center justify-center gap-[7px] rounded-full border border-[var(--vs-border)] bg-white px-3.5 text-xs font-bold text-[var(--vs-green-800)] hover:bg-[var(--vs-green-100)] data-[state=open]:bg-[var(--vs-green-100)]"
                type="button"
              >
                <Filter size={15} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {getNotificationFilterLabel(notificationType, readFilter)}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="!w-[220px] !min-w-[220px]">
              <DropdownMenuLabel>Notification type</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                onValueChange={(value) => {
                  pagination.setPage(1)
                  setNotificationType(value)
                }}
                value={notificationType}
              >
                {NOTIFICATION_TYPE_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem className="gap-2 py-[7px] pl-2.5 pr-7 text-xs" key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Read status</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                onValueChange={(value) => {
                  pagination.setPage(1)
                  setReadFilter(value)
                }}
                value={readFilter}
              >
                {READ_FILTER_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem className="gap-2 py-[7px] pl-2.5 pr-7 text-xs" key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DateRangeFilterPopover
            fromDate={fromDate}
            onApply={(nextFrom, nextTo) => {
              pagination.setPage(1)
              setFromDate(nextFrom)
              setToDate(nextTo)
            }}
            toDate={toDate}
          />
        </div>

        <DataTable
          columns={[
            {
              key: 'title',
              header: 'Notification',
              render: (item) => {
                const actionLink = getCustomerNotificationActionLink(item)

                return (
                  <div className="flex items-start gap-2">
                    <Bell className="mt-0.5 shrink-0 text-[var(--vs-green-700)]" size={15} />
                    <div>
                      <div className="font-semibold text-[var(--vs-text)]">{item.title}</div>
                      <div className="mt-0.5 text-[12px] text-[var(--vs-muted)]">{item.message}</div>
                      {actionLink ? (
                        <Link
                          className="mt-1 inline-flex text-[12px] font-bold text-[var(--vs-green-700)] hover:text-[var(--vs-green-900)] hover:underline"
                          to={actionLink.to}
                        >
                          {actionLink.label}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                )
              },
            },
            {
              key: 'notificationType',
              header: 'Type',
              render: (item) => (
                <span className={`badge ${getNotificationBadge(item.notificationType)}`}>
                  {formatNotificationType(item.notificationType)}
                </span>
              ),
            },
            {
              key: 'createdAt',
              header: 'Received',
              render: (item) => formatDateTime(item.createdAt),
            },
            {
              key: 'status',
              header: 'Status',
              render: (item) =>
                item.isRead ? (
                  <span className="badge bg">Read</span>
                ) : (
                  <span className="badge ba">Unread</span>
                ),
            },
            {
              key: 'actions',
              header: '',
              render: (item) =>
                item.isRead ? null : (
                  <button
                    className="tb-btn"
                    onClick={() => void handleMarkAsRead(item.notificationId)}
                    type="button"
                  >
                    Mark read
                  </button>
                ),
            },
          ]}
          emptyMessage={
            isLoading
              ? 'Loading notifications...'
              : hasFilters
                ? 'No notifications match these filters.'
                : 'You do not have any notifications right now.'
          }
          rows={notifications}
        />

        <div className="flex items-center justify-between gap-3 border-t border-[var(--vs-soft-border)] pt-3.5 text-xs text-[var(--vs-muted)] max-md:flex-col max-md:items-start">
          <div>
            {totalRecords === 0
              ? 'No records available.'
              : `Showing ${startRecord}-${endRecord} of ${totalRecords}`}
          </div>
          <div className="flex items-center gap-2">
            <span>
              Page {pagination.page} of {totalPages}
            </span>
            <button
              className="tb-btn"
              disabled={isLoading || pagination.page <= 1}
              onClick={() => pagination.setPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              Previous
            </button>
            <button
              className="tb-btn"
              disabled={isLoading || totalRecords === 0 || pagination.page >= totalPages}
              onClick={() => pagination.setPage((page) => Math.min(totalPages, page + 1))}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </PageSection>
  )
}
