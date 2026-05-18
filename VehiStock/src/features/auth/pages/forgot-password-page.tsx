import * as React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'
import { forgotPassword } from '@/features/auth/api/auth-api'
import { ApiError } from '@/types/api'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email) return

    try {
      setStatus('submitting')
      setError(null)
      await forgotPassword(email)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Unable to send password reset link.',
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
            Reset your password
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/72">
            No worries! Enter your registered account email address, and we will dispatch a secure validation token to reset your credentials.
          </p>
        </section>

        {/* Right Side Form */}
        <section className="flex items-center justify-center p-6 md:p-10">
          {status === 'success' ? (
            <div className="w-full max-w-md space-y-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-800">
                  Token Dispatched
                </div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--vs-text)]">
                  Check your email
                </h2>
                <p className="text-sm leading-6 text-[var(--vs-muted)]">
                  We have dispatched a validation token to <span className="font-semibold text-gray-900">{email}</span>. Please copy the token and click below to reset your password.
                </p>
              </div>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--vs-green-800)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--vs-green-900)]"
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                type="button"
              >
                Go to Password Reset
                <ArrowRight size={16} />
              </button>

              <div className="flex justify-center">
                <button
                  className="text-sm font-semibold text-[var(--vs-green-800)] transition hover:text-[var(--vs-green-900)]"
                  onClick={() => setStatus('idle')}
                  type="button"
                >
                  Resend token
                </button>
              </div>
            </div>
          ) : (
            <form className="w-full max-w-md space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <div className="inline-flex rounded-full bg-[var(--vs-green-100)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--vs-green-800)]">
                  Password Recovery
                </div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--vs-text)]">
                  Forgot Password?
                </h2>
                <p className="text-sm leading-6 text-[var(--vs-muted)]">
                  Enter your email address below to request a secure password reset validation token.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-[var(--vs-text)]">
                  Email Address
                  <div className="relative mt-2">
                    <input
                      className="w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      required
                      type="email"
                      value={email}
                    />
                  </div>
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
                {status === 'submitting' ? 'Dispatching Token...' : 'Send Validation Token'}
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
