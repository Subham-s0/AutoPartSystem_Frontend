import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react'
import { ROUTE_PATHS } from '@/app/config/routes'
import { PageSection } from '@/components/shared/page-section'
import { getServiceInvoiceDetail } from '@/features/service-invoices/api/customer-service-invoices-api'
import { initiateServiceInvoicePayment } from '@/features/payments/api/payments-api'
import type { ServiceInvoiceListItem } from '@/features/service-invoices/types/customer-service-invoices'
import { formatDateOnly } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import { ApiError } from '@/types/api'

export function ServiceInvoiceCheckoutPage() {
  const navigate = useNavigate()
  const { serviceInvoiceId: serviceInvoiceIdParam } = useParams<{
    serviceInvoiceId: string
  }>()
  const serviceInvoiceId = Number(serviceInvoiceIdParam)

  const [invoice, setInvoice] = React.useState<ServiceInvoiceListItem | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [amountInput, setAmountInput] = React.useState('')
  const [payError, setPayError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!Number.isFinite(serviceInvoiceId) || serviceInvoiceId <= 0) {
      queueMicrotask(() => {
        setLoadError('Invalid invoice id.')
        setIsLoading(false)
      })
      return
    }

    let isMounted = true

    async function load() {
      try {
        setIsLoading(true)
        setLoadError(null)
        const detail = await getServiceInvoiceDetail(serviceInvoiceId)
        if (!isMounted) {
          return
        }
        setInvoice(detail)
        setAmountInput(detail.balanceDue > 0 ? detail.balanceDue.toFixed(2) : '')
      } catch (error) {
        if (!isMounted) {
          return
        }
        setInvoice(null)
        setLoadError(
          error instanceof ApiError || error instanceof Error
            ? error.message
            : 'Unable to load invoice for checkout.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [serviceInvoiceId])

  const parsedAmount = Number.parseFloat(amountInput)
  const canPay =
    invoice &&
    invoice.balanceDue > 0 &&
    invoice.paymentStatus !== 'Paid' &&
    invoice.paymentStatus !== 'Cancelled'

  async function handleCheckout() {
    if (!invoice) {
      return
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setPayError('Please enter a valid amount greater than zero.')
      return
    }

    if (parsedAmount > invoice.balanceDue + 0.001) {
      setPayError(
        `Amount cannot exceed the balance due (${formatCurrency(invoice.balanceDue)}).`,
      )
      return
    }

    if (parsedAmount < 10) {
      setPayError('Khalti requires a minimum payment of NPR 10.')
      return
    }

    try {
      setIsSubmitting(true)
      setPayError(null)
      const initiation = await initiateServiceInvoicePayment(invoice.serviceInvoiceId, {
        amount: parsedAmount,
      })

      window.sessionStorage.setItem(
        `khalti:pidx:${initiation.pidx}`,
        JSON.stringify({
          serviceInvoiceId: initiation.serviceInvoiceId,
          serviceRecordId: initiation.serviceRecordId,
          amount: initiation.amount,
        }),
      )

      window.location.href = initiation.paymentUrl
    } catch (error) {
      setPayError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Unable to start Khalti checkout.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <PageSection description="Loading checkout..." title="Checkout">
        <div className="flex min-h-[200px] items-center justify-center text-[var(--vs-muted)]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      </PageSection>
    )
  }

  if (loadError || !invoice) {
    return (
      <PageSection description="Checkout could not be loaded." title="Checkout">
        <div className="rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
          {loadError ?? 'Invoice not found.'}
        </div>
        <button
          className="tb-btn mt-4"
          onClick={() => navigate(ROUTE_PATHS.customer.serviceInvoices)}
          type="button"
        >
          <ArrowLeft size={14} />
          Back to invoices
        </button>
      </PageSection>
    )
  }

  return (
    <PageSection
      description="Enter the amount you want to pay and continue to Khalti."
      title="Checkout"
    >
      <button
        className="tb-btn mb-4"
        onClick={() => navigate(ROUTE_PATHS.customer.serviceInvoices)}
        type="button"
      >
        <ArrowLeft size={14} />
        Back to invoices
      </button>

      <div className="mx-auto max-w-[520px] space-y-4">
        <div className="rounded-2xl border border-[var(--vs-border)] bg-white px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vs-muted)]">
            Service
          </div>
          <div className="mt-1 text-[15px] font-bold text-[var(--vs-text)]">
            Service #{invoice.serviceRecordId}
          </div>
          <div className="mt-2 text-[13px] text-[var(--vs-muted)]">
            Invoice #{invoice.serviceInvoiceId} · {invoice.vehicleNumber} ·{' '}
            {formatDateOnly(invoice.serviceDate)}
          </div>
          {invoice.diagnosis ? (
            <div className="mt-2 text-[13px] text-[var(--vs-text)]">{invoice.diagnosis}</div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-5 py-4 text-[13px]">
          <dl className="grid grid-cols-2 gap-y-2">
            <dt className="text-[var(--vs-muted)]">Invoice total</dt>
            <dd className="text-right font-semibold text-[var(--vs-text)]">
              {formatCurrency(invoice.totalAmount)}
            </dd>
            <dt className="text-[var(--vs-muted)]">Already paid</dt>
            <dd className="text-right text-[var(--vs-text)]">
              {formatCurrency(invoice.amountPaid)}
            </dd>
            <dt className="font-semibold text-[var(--vs-text)]">Balance due</dt>
            <dd className="text-right font-bold text-[var(--vs-text)]">
              {formatCurrency(invoice.balanceDue)}
            </dd>
          </dl>
        </div>

        <div className="rounded-2xl border border-[var(--vs-green-700)]/25 bg-[var(--vs-green-100)] px-5 py-4">
          <label
            className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vs-green-800)]"
            htmlFor="checkout-amount"
          >
            Payment amount (NPR)
          </label>
          <p className="mt-1 text-[12px] text-[var(--vs-muted)]">
            Pay any amount up to {formatCurrency(invoice.balanceDue)}. Minimum NPR 10.
          </p>
          <div className="mt-3 flex items-center gap-2 max-md:flex-col max-md:items-stretch">
            <input
              aria-label="Payment amount"
              className="h-10 w-full rounded-full border border-[var(--vs-border)] bg-white px-4 text-[14px] text-[var(--vs-text)] outline-none focus:border-[var(--vs-green-700)]"
              disabled={!canPay || isSubmitting}
              id="checkout-amount"
              inputMode="decimal"
              min={0}
              onChange={(event) => {
                setAmountInput(event.target.value)
                setPayError(null)
              }}
              placeholder="0.00"
              step={1}
              type="number"
              value={amountInput}
            />
            <button
              className="tb-btn shrink-0"
              disabled={!canPay || isSubmitting}
              onClick={() => setAmountInput(invoice.balanceDue.toFixed(2))}
              type="button"
            >
              Full balance
            </button>
          </div>
          {payError ? (
            <p className="mt-2 text-[12px] text-[var(--vs-red)]">{payError}</p>
          ) : null}
        </div>

        <button
          className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--vs-green-600)] bg-[var(--vs-green-600)] px-4 text-sm font-bold text-white hover:border-[var(--vs-green-800)] hover:bg-[var(--vs-green-800)] active:border-[var(--vs-green-900)] active:bg-[var(--vs-green-900)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canPay || isSubmitting}
          onClick={() => void handleCheckout()}
          type="button"
        >
          <CreditCard size={18} />
          {isSubmitting ? 'Redirecting to Khalti...' : 'Pay with Khalti'}
        </button>

        {!canPay ? (
          <p className="text-center text-[12px] text-[var(--vs-muted)]">
            This invoice cannot be paid ({invoice.paymentStatus}).
            <Link
              className="ml-1 font-semibold text-[var(--vs-green-800)] underline"
              to={ROUTE_PATHS.customer.serviceInvoices}
            >
              Return to invoices
            </Link>
          </p>
        ) : null}
      </div>
    </PageSection>
  )
}
