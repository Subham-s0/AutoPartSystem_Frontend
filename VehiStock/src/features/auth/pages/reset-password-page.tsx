import * as React from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
import { resetPassword } from '@/features/auth/api/auth-api'
import { ApiError } from '@/types/api'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [email, setEmail] = React.useState(searchParams.get('email') || '')
  const [token, setToken] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email || !token || !newPassword) return

    if (newPassword !== confirmPassword) {
      setStatus('error')
      setError('Passwords do not match.')
      return
    }

    try {
      setStatus('submitting')
      setError(null)
      await resetPassword({ email, token, newPassword })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Unable to reset your password.',
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--vs-bg)] px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--vs-border)] bg-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left Side Branding */}
        <section className="flex flex-col justify-center bg-[linear-gradient(160deg,#173f25_0%,#1e7a46_52%,#87b948_100%)] p-8 text-white lg:p-10">
          <div className="mb-6 inline-flex w-fit rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
            Account recovery
          </div>
          <h1 className="max-w-sm text-4xl font-semibold tracking-[-0.04em]">
            Establish new password
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/72">
            Submit your validation token along with your new password to successfully recover and unlock your account.
          </p>
        </section>

        {/* Right Side Form */}
        <section className="flex items-center justify-center p-6 md:p-10">
          {status === 'success' ? (
            <div className="w-full max-w-md space-y-6 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--vs-text)]">
                  Reset Successful!
                </h2>
                <p className="text-sm leading-6 text-[var(--vs-muted)]">
                  Your password has been successfully updated. You can now securely sign in to VehiStock.
                </p>
              </div>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--vs-green-800)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--vs-green-900)]"
                onClick={() => navigate(ROUTE_PATHS.login)}
                type="button"
              >
                Return to Sign In
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form className="w-full max-w-md space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <div className="inline-flex rounded-full bg-[var(--vs-green-100)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--vs-green-800)]">
                  Step 2 of Recovery
                </div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--vs-text)]">
                  Reset Password
                </h2>
                <p className="text-sm leading-6 text-[var(--vs-muted)]">
                  Provide your email, the dispatched validation token, and choose a strong new password.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-[var(--vs-text)]">
                  Email Address
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </label>

                <label className="block text-sm font-medium text-[var(--vs-text)]">
                  Validation Token
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm font-mono tracking-wider outline-none transition focus:border-[var(--vs-green-600)]"
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="Enter security token"
                    required
                    type="text"
                    value={token}
                  />
                </label>

                <label className="block text-sm font-medium text-[var(--vs-text)]">
                  New Password
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    required
                    type="password"
                    value={newPassword}
                  />
                </label>

                <label className="block text-sm font-medium text-[var(--vs-text)]">
                  Confirm Password
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat new password"
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </label>
              </div>

              {status === 'error' && error ? (
                <div className="rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)] font-semibold">
                  {error}
                </div>
              ) : null}

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--vs-green-800)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--vs-green-900)] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={status === 'submitting'}
                type="submit"
              >
                {status === 'submitting' ? 'Resetting Password...' : 'Reset Password'}
                <ArrowRight size={16} />
              </button>

              <div className="flex justify-center pt-2">
                <Link
                  className="inline-flex items-center gap-2 text-sm text-[var(--vs-muted)] transition hover:text-[var(--vs-text)]"
                  to={ROUTE_PATHS.login}
                >
                  <ArrowLeft size={14} />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
