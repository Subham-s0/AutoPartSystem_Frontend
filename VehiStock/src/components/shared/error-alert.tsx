interface ErrorAlertProps {
  message: string | null
}

/**
 * A reusable inline error banner. Renders nothing if `message` is falsy.
 */
export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) {
    return null
  }

  return (
    <div className="mb-4 rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
      {message}
    </div>
  )
}
