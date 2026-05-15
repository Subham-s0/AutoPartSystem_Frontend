import { ROUTE_PATHS } from '@/app/config/routes'
import type { NotificationItem } from './types/notifications'

export interface NotificationActionLink {
  label: string
  to: string
}

function normalizeToken(value?: string | null) {
  return (value ?? '').replace(/[\s_-]/g, '').toLowerCase()
}

function withQuery(path: string, query: Record<string, string | number>) {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    searchParams.set(key, String(value))
  })

  return `${path}?${searchParams.toString()}`
}

export function getCustomerNotificationActionLink(
  notification: NotificationItem,
): NotificationActionLink | null {
  const notificationType = normalizeToken(notification.notificationType)
  const referenceType = normalizeToken(notification.referenceType)
  const referenceId = notification.referenceId

  if (notificationType === 'appointmentupdate' || referenceType === 'appointment') {
    return {
      label: 'View appointment',
      to: referenceId
        ? withQuery(ROUTE_PATHS.customer.bookAppointment, {
            appointmentId: referenceId,
          })
        : ROUTE_PATHS.customer.bookAppointment,
    }
  }

  if (notificationType === 'creditreminder') {
    if (referenceType === 'serviceinvoice') {
      return {
        label: 'Pay now',
        to: referenceId
          ? withQuery(ROUTE_PATHS.customer.serviceInvoices, {
              invoiceId: referenceId,
              mode: 'pay',
            })
          : ROUTE_PATHS.customer.serviceInvoices,
      }
    }

    return {
      label: 'Pay now',
      to: referenceId
        ? withQuery(ROUTE_PATHS.customer.history, {
            tab: 'purchases',
            salesInvoiceId: referenceId,
            mode: 'view',
          })
        : withQuery(ROUTE_PATHS.customer.history, { tab: 'purchases' }),
    }
  }

  if (notificationType === 'invoicesent' || referenceType === 'serviceinvoice') {
    if (referenceType === 'salesinvoice') {
      return {
        label: 'View invoice',
        to: referenceId
          ? withQuery(ROUTE_PATHS.customer.history, {
              tab: 'purchases',
              salesInvoiceId: referenceId,
              mode: 'view',
            })
          : withQuery(ROUTE_PATHS.customer.history, { tab: 'purchases' }),
      }
    }

    return {
      label: 'View invoice',
      to: referenceId
        ? withQuery(ROUTE_PATHS.customer.serviceInvoices, {
            invoiceId: referenceId,
            mode: 'view',
          })
        : ROUTE_PATHS.customer.serviceInvoices,
    }
  }

  return null
}
