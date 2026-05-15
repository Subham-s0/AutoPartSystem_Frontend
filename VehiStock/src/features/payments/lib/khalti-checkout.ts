import type { InvoicePaymentInitiation } from '@/features/payments/types/payments'

export function redirectToKhaltiCheckout(initiation: InvoicePaymentInitiation) {
  window.sessionStorage.setItem(
    `khalti:pidx:${initiation.pidx}`,
    JSON.stringify({
      serviceInvoiceId: initiation.serviceInvoiceId || null,
      salesInvoiceId: initiation.salesInvoiceId ?? null,
      serviceRecordId: initiation.serviceRecordId || null,
      amount: initiation.amount,
    }),
  )

  window.location.href = initiation.paymentUrl
}
