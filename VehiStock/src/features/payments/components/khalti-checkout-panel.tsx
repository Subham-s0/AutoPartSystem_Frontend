import * as React from 'react'
import { CreditCard } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { ApiError } from '@/types/api'

export interface KhaltiCheckoutSummary {
  title: string
  subtitle: string
  contextLabel?: string
  contextValue?: string
  totalAmount: number
  amountPaid: number
  balanceDue: number
  paymentStatus: string
}

interface KhaltiCheckoutPanelProps {
  summary: KhaltiCheckoutSummary
  onPay: (amount: number) => Promise<void>
}

export function canPayKhaltiInvoice(paymentStatus: string, balanceDue: number) {
  return balanceDue > 0 && paymentStatus !== 'Paid' && paymentStatus !== 'Cancelled'
}

export function KhaltiCheckoutPanel({ summary, onPay }: KhaltiCheckoutPanelProps) {
  const [amountInput, setAmountInput] = React.useState('')
  const [payError, setPayError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const canPay = canPayKhaltiInvoice(summary.paymentStatus, summary.balanceDue)

  React.useEffect(() => {
    setAmountInput(summary.balanceDue > 0 ? summary.balanceDue.toFixed(2) : '')
    setPayError(null)
  }, [summary.balanceDue, summary.paymentStatus, summary.title])

  async function handleCheckout() {
    const parsed = Number.parseFloat(amountInput)
    if (Number.isNaN(parsed) || parsed <= 0) {
      setPayError('Please enter a valid amount greater than zero.')
      return
    }

    if (parsed > summary.balanceDue + 0.001) {
      setPayError(
        `Amount cannot exceed the balance due (${formatCurrency(summary.balanceDue)}).`,
      )
      return
    }

    if (parsed < 10) {
      setPayError('Khalti requires a minimum payment of NPR 10.')
      return
    }

    try {
      setIsSubmitting(true)
      setPayError(null)
      await onPay(parsed)
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

  return (
    <div className="space-y-4 text-[13px]">
      <div className="rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vs-muted)]">
          {summary.title}
        </div>
        <div className="mt-1 text-[15px] font-bold text-[var(--vs-text)]">{summary.subtitle}</div>
        {summary.contextLabel && summary.contextValue ? (
          <div className="mt-2 text-[13px] text-[var(--vs-muted)]">
            {summary.contextLabel}: {summary.contextValue}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[var(--vs-border)] bg-white">
        <dl className="grid grid-cols-2 gap-y-2 px-4 py-3">
          <dt className="text-[var(--vs-muted)]">Total</dt>
          <dd className="text-right font-semibold text-[var(--vs-text)]">
            {formatCurrency(summary.totalAmount)}
          </dd>
          <dt className="text-[var(--vs-muted)]">Already paid</dt>
          <dd className="text-right text-[var(--vs-text)]">
            {formatCurrency(summary.amountPaid)}
          </dd>
          <dt className="font-semibold text-[var(--vs-text)]">Balance due</dt>
          <dd className="text-right font-bold text-[var(--vs-text)]">
            {formatCurrency(summary.balanceDue)}
          </dd>
        </dl>
      </div>

      <div className="rounded-2xl border border-[var(--vs-green-600)]/25 bg-[var(--vs-green-100)] px-4 py-3">
        <label
          className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vs-green-800)]"
          htmlFor="khalti-checkout-amount"
        >
          Payment amount (NPR)
        </label>
        <p className="mt-1 text-[12px] text-[var(--vs-muted)]">
          Pay any amount up to {formatCurrency(summary.balanceDue)}. Minimum NPR 10.
        </p>
        <div className="mt-3 flex items-center gap-2 max-md:flex-col max-md:items-stretch">
          <input
            aria-label="Payment amount"
            className="h-10 w-full rounded-full border border-[var(--vs-border)] bg-white px-4 text-[14px] text-[var(--vs-text)] outline-none focus:border-[var(--vs-green-600)]"
            disabled={!canPay || isSubmitting}
            id="khalti-checkout-amount"
            inputMode="decimal"
            min={0}
            onChange={(event) => {
              setAmountInput(event.target.value)
              setPayError(null)
            }}
            placeholder="0"
            step={1}
            type="number"
            value={amountInput}
          />
          <button
            className="tb-btn shrink-0"
            disabled={!canPay || isSubmitting}
            onClick={() => setAmountInput(summary.balanceDue.toFixed(2))}
            type="button"
          >
            Full balance
          </button>
        </div>
        {payError ? <p className="mt-2 text-[12px] text-[var(--vs-red)]">{payError}</p> : null}
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
    </div>
  )
}
