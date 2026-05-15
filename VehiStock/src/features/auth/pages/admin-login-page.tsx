import * as React from 'react'
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROUTE_PATHS, getDefaultPathForRole } from '@/app/config/routes'
import { ROLE_NAMES } from '@/constants/roles'
import { useAuth } from '@/hooks/use-auth'
import { ApiError } from '@/types/api'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isHydrating, session, signIn, signOut } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (isHydrating || !isAuthenticated || !session) {
      return
    }

    const nextPath =
      (location.state as { from?: string } | null)?.from ??
      getDefaultPathForRole(session.user.role)

    navigate(nextPath, { replace: true })
  }, [isAuthenticated, isHydrating, location.state, navigate, session])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const nextSession = await signIn({ email, password })

      if (nextSession.user.role !== ROLE_NAMES.admin) {
        await signOut()
        throw new Error(
          'This login page is for administrator accounts only. Use the main login page for staff or customer access.',
        )
      }

      const nextPath =
        (location.state as { from?: string } | null)?.from ??
        getDefaultPathForRole(nextSession.user.role)

      navigate(nextPath, { replace: true })
    } catch (submitError) {
      const message =
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Unable to sign in right now.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(30,122,70,0.16),_transparent_38%),linear-gradient(180deg,#f7f6ef_0%,#eef4ec_100%)] px-6 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 rounded-[2rem] border border-[rgba(17,24,17,0.08)] bg-white/90 p-5 shadow-[0_30px_80px_rgba(21,92,53,0.10)] backdrop-blur lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <section className="rounded-[1.75rem] bg-[linear-gradient(160deg,#111811_0%,#1b5e20_55%,#2e7d32_100%)] p-8 text-white">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
            <Shield size={14} />
            Restricted access
          </div>
          <h1 className="max-w-sm text-4xl font-semibold tracking-[-0.04em]">
            Administrator login
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
            This route is reserved for seeded administrator accounts. Staff and
            customer accounts should use the main portal login flow instead.
          </p>

          <div className="mt-10 space-y-4 text-sm text-white/70">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
              Admin accounts do not use public self-registration or Google
              onboarding.
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
              Use this portal for inventory oversight, vendor management,
              reports, notifications, and staff control.
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center rounded-[1.75rem] bg-[linear-gradient(180deg,#fffef9_0%,#f4f7f1_100%)] p-4">
          <form
            className="w-full max-w-md space-y-5 rounded-[1.75rem] border border-[rgba(17,24,17,0.08)] bg-white p-8 shadow-sm"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <div className="inline-flex rounded-full bg-[var(--vs-green-100)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--vs-green-800)]">
                Admin Portal
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--vs-text)]">
                Sign in
              </h2>
              <p className="text-sm leading-6 text-[var(--vs-muted)]">
                Use your administrator credentials to continue.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-[var(--vs-text)]">
                Email
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@vehistock.com"
                  type="email"
                  value={email}
                />
              </label>

              <label className="block text-sm font-medium text-[var(--vs-text)]">
                Password
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                />
              </label>
            </div>

            {error ? (
              <div className="rounded-2xl border border-[var(--vs-red)]/15 bg-[var(--vs-red-100)] px-4 py-3 text-sm text-[var(--vs-red)]">
                {error}
              </div>
            ) : null}

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--vs-green-800)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--vs-green-900)] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Signing in...' : 'Administrator sign in'}
              <ArrowRight size={16} />
            </button>

            <div className="rounded-2xl border border-dashed border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-xs leading-6 text-[var(--vs-muted)]">
              Staff and customer users should use the shared login page with
              the correct portal toggle.
            </div>

            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--vs-green-800)]"
              to={ROUTE_PATHS.home}
            >
              <ArrowLeft size={15} />
              Back to home
            </Link>
          </form>
        </section>
      </div>
    </div>
  )
}
