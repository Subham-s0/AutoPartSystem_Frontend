import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { ROUTE_PATHS } from '@/app/config/routes'
import { PageSection } from '@/components/shared/page-section'
import { verifyServiceInvoicePayment } from '@/features/payments/api/payments-api'
import type { InvoicePaymentVerification } from '@/features/payments/types/payments'
import { formatCurrency } from '@/utils/format'
import { ApiError } from '@/types/api'

type CallbackStatus = 'verifying' | 'success' | 'failed'

export function ServiceInvoicePaymentCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = React.useState<CallbackStatus>('verifying')
  const [message, setMessage] = React.useState<string>('')
  const [verification, setVerification] =
    React.useState<InvoicePaymentVerification | null>(null)
  const verifyStartedRef = React.useRef(false)

  React.useEffect(() => {
    if (verifyStartedRef.current) {
      return
    }
    verifyStartedRef.current = true

    const pidx = searchParams.get('pidx')
    const purchaseOrderId = searchParams.get('purchase_order_id')
    const khaltiStatus = searchParams.get('status')

    if (!pidx || !purchaseOrderId) {
      queueMicrotask(() => {
        setStatus('failed')
        setMessage(
          'Missing payment reference (pidx) from the Khalti redirect. Please retry the payment.',
        )
      })
      return
    }

    void (async () => {
      try {
        const result = await verifyServiceInvoicePayment({ pidx, purchaseOrderId })
        setVerification(result)

        const isKhaltiCompleted =
          result.khaltiStatus.toLowerCase() === 'completed' ||
          (khaltiStatus?.toLowerCase() === 'completed')

        if (isKhaltiCompleted && (result.newPaymentStatus || result.alreadyProcessed)) {
          setStatus('success')
          setMessage(
            result.alreadyProcessed
              ? 'This payment has already been recorded.'
              : `Payment recorded. Invoice status is now ${result.newPaymentStatus || result.mappedPaymentStatus}.`,
          )
        } else {
          setStatus('failed')
          setMessage(
            `Khalti status: ${result.khaltiStatus}. Mapped status: ${result.mappedPaymentStatus}. Please retry if the amount was debited.`,
          )
        }
      } catch (verifyError) {
        setStatus('failed')
        setMessage(
          verifyError instanceof ApiError || verifyError instanceof Error
            ? verifyError.message
            : 'Unable to verify the payment with the server.',
        )
      } finally {
        if (pidx) {
          window.sessionStorage.removeItem(`khalti:pidx:${pidx}`)
        }
      }
    })()
  }, [searchParams])

  return (
    <PageSection
      description="Confirming the result of your Khalti payment with our records."
      title="Payment status"
    >
      <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
        {status === 'verifying' ? (
          <>
            <Loader2
              className="animate-spin text-[var(--vs-green-700)]"
              size={36}
            />
            <div className="space-y-1">
              <div className="text-[15px] font-semibold text-[var(--vs-text)]">
                Verifying your payment with Khalti...
              </div>
              <div className="text-[12px] text-[var(--vs-muted)]">
                Please don't close this tab while we confirm the transaction.
              </div>
            </div>
          </>
        ) : null}

        {status === 'success' ? (
          <>
            <CheckCircle2
              className="text-[var(--vs-green-700)]"
              size={40}
            />
            <div className="space-y-1">
              <div className="text-[16px] font-bold text-[var(--vs-text)]">
                Payment successful
              </div>
              <div className="text-[13px] text-[var(--vs-muted)]">{message}</div>
            </div>

            {verification ? (
              <div className="mt-3 w-full max-w-[360px] rounded-2xl border border-[var(--vs-border)] bg-white px-4 py-3 text-left text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--vs-muted)]">Invoice</span>
                  <span className="font-semibold text-[var(--vs-text)]">
                    {verification.salesInvoiceId
                      ? verification.salesInvoiceId
                      : `#${verification.serviceInvoiceId}`}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[var(--vs-muted)]">Amount paid</span>
                  <span className="font-semibold text-[var(--vs-text)]">
                    {formatCurrency(verification.amount)}
                  </span>
                </div>
                {!verification.alreadyProcessed ? (
                  <>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[var(--vs-muted)]">New balance</span>
                      <span className="font-semibold text-[var(--vs-text)]">
                        {formatCurrency(verification.newBalanceDue)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[var(--vs-muted)]">Khalti status</span>
                      <span className="font-semibold text-[var(--vs-text)]">
                        {verification.khaltiStatus}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[var(--vs-muted)]">Invoice status</span>
                      <span className="font-semibold text-[var(--vs-text)]">
                        {verification.newPaymentStatus || verification.mappedPaymentStatus}
                      </span>
                    </div>
                  </>
                ) : null}
                {verification.transactionId ? (
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--vs-muted)]">
                    <span>Txn ID</span>
                    <span className="font-mono">{verification.transactionId}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {status === 'failed' ? (
          <>
            <XCircle className="text-[var(--vs-red)]" size={40} />
            <div className="space-y-1">
              <div className="text-[16px] font-bold text-[var(--vs-text)]">
                Payment not completed
              </div>
              <div className="text-[13px] text-[var(--vs-muted)]">{message}</div>
            </div>
          </>
        ) : null}

        {status !== 'verifying' ? (
          <div className="mt-2 flex items-center gap-2">
            <button
              className="tb-btn"
              onClick={() =>
                navigate(
                  verification?.salesInvoiceId
                    ? ROUTE_PATHS.customer.history
                    : ROUTE_PATHS.customer.serviceInvoices,
                )
              }
              type="button"
            >
              <ArrowLeft size={14} />
              {verification?.salesInvoiceId ? 'Back to history' : 'Back to invoices'}
            </button>
            <Link
              className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[var(--vs-green-600)] bg-[var(--vs-green-600)] px-4 text-xs font-bold text-white hover:border-[var(--vs-green-800)] hover:bg-[var(--vs-green-800)]"
              to={ROUTE_PATHS.customer.history}
            >
              View history
            </Link>
          </div>
        ) : null}
      </div>
    </PageSection>
  )
}
