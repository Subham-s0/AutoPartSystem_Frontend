import * as React from 'react'
import { ArrowLeft, ArrowRight, Briefcase, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTE_PATHS, getDefaultPathForRole } from '@/app/config/routes'
import { GoogleAuthButton } from '@/features/auth/components/google-auth-button'
import { useAuth } from '@/hooks/use-auth'
import { ApiError } from '@/types/api'
import { ROLE_NAMES } from '@/constants/roles'

type PublicPortalRole = typeof ROLE_NAMES.customer | typeof ROLE_NAMES.staff

const portalConfig: Record<
  PublicPortalRole,
  {
    badge: string
    heading: string
    description: string
    googleLabel: string
  }
> = {
  Customer: {
    badge: 'Customer Access',
    heading: 'Customer login',
    description:
      'Use your customer account to check history, manage vehicles, request parts, and book appointments.',
    googleLabel: 'Customer Google access',
  },
  Staff: {
    badge: 'Staff Access',
    heading: 'Staff login',
    description:
      'For staff accounts already created by an administrator. Google login works only for the same registered staff email.',
    googleLabel: 'Staff Google access',
  },
}

function getPortalRole(value: string | null): PublicPortalRole {
  return value?.toLowerCase() === ROLE_NAMES.staff.toLowerCase()
    ? ROLE_NAMES.staff
    : ROLE_NAMES.customer
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedRole = getPortalRole(searchParams.get('role'))
  const content = portalConfig[selectedRole]
  const {
    isAuthenticated,
    isHydrating,
    session,
    signIn,
    signInWithGoogle,
    signOut,
  } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (isHydrating || !isAuthenticated || !session) {
      return
    }

    const nextPath =
      (location.state as { from?: string } | null)?.from ??
      getDefaultPathForRole(session.user.role)

    navigate(nextPath, { replace: true })
  }, [isAuthenticated, isHydrating, location.state, navigate, session])

  function setRole(role: PublicPortalRole) {
    setSearchParams({ role: role.toLowerCase() }, { replace: true })
    setError(null)
  }

  async function completeRoleLogin(
    nextSession: Awaited<ReturnType<typeof signIn>>,
    expectedRole: PublicPortalRole,
  ) {
    if (nextSession.user.role !== expectedRole) {
      await signOut()

      throw new Error(
        expectedRole === ROLE_NAMES.staff
          ? 'This account is not registered as staff. Use the customer portal if this is your customer account.'
          : 'This account is not registered as a customer. Staff users should switch to the staff tab or admin login if needed.',
      )
    }

    const nextPath =
      (location.state as { from?: string } | null)?.from ??
      getDefaultPathForRole(nextSession.user.role)

    navigate(nextPath, { replace: true })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const nextSession = await signIn({ email, password })
      await completeRoleLogin(nextSession, selectedRole)
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

  async function handleGoogleCredential(idToken: string) {
    setError(null)
    setIsGoogleSubmitting(true)

    try {
      const nextSession = await signInWithGoogle({ idToken })
      await completeRoleLogin(nextSession, selectedRole)
    } catch (submitError) {
      const message =
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Google sign-in failed.'
      setError(message)
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--vs-bg)] px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--vs-border)] bg-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-center bg-[linear-gradient(160deg,#173f25_0%,#1e7a46_52%,#87b948_100%)] p-8 text-white lg:p-10">
          <div className="mb-6 inline-flex w-fit rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
            Main portal login
          </div>
          <h1 className="max-w-sm text-4xl font-semibold tracking-[-0.04em]">
            {content.heading}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/72">
            {content.description}
          </p>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10">
          <form
            className="w-full max-w-md space-y-5"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <div className="inline-flex rounded-full bg-[var(--vs-green-100)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--vs-green-800)]">
                {content.badge}
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--vs-text)]">
                Sign in
              </h2>
              <p className="text-sm leading-6 text-[var(--vs-muted)]">
                Select your access type and continue with your credentials.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-[1.2rem] border border-[var(--vs-border)] bg-[var(--vs-bg)] p-1.5">
              <button
                className={`inline-flex items-center justify-center gap-2 rounded-[0.85rem] px-4 py-2.5 text-sm font-semibold transition ${
                  selectedRole === ROLE_NAMES.customer
                    ? 'bg-white text-[var(--vs-green-800)] shadow-sm'
                    : 'text-[var(--vs-muted)] hover:text-[var(--vs-text)]'
                }`}
                onClick={() => setRole(ROLE_NAMES.customer)}
                type="button"
              >
                <UserRound size={16} />
                Customer
              </button>
              <button
                className={`inline-flex items-center justify-center gap-2 rounded-[0.85rem] px-4 py-2.5 text-sm font-semibold transition ${
                  selectedRole === ROLE_NAMES.staff
                    ? 'bg-white text-[var(--vs-green-800)] shadow-sm'
                    : 'text-[var(--vs-muted)] hover:text-[var(--vs-text)]'
                }`}
                onClick={() => setRole(ROLE_NAMES.staff)}
                type="button"
              >
                <Briefcase size={16} />
                Staff
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-[var(--vs-text)]">
                Email
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={
                    selectedRole === ROLE_NAMES.staff
                      ? 'staff@vehistock.com'
                      : 'name@example.com'
                  }
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
              disabled={isSubmitting || isGoogleSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Signing in...' : `Continue as ${selectedRole}`}
              <ArrowRight size={16} />
            </button>

            <div className="flex w-full flex-col items-center gap-2">
              <GoogleAuthButton
                mode="signin"
                onCredential={handleGoogleCredential}
                onError={(message) => setError(message)}
              />
              {isGoogleSubmitting ? (
                <div className="text-xs text-[var(--vs-muted)]">
                  Completing Google sign-in...
                </div>
              ) : null}
            </div>

            {selectedRole === ROLE_NAMES.customer ? (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-5 py-3.5 text-sm">
                <span className="text-[var(--vs-muted)]">
                  Need a customer account?
                </span>
                <Link
                  className="inline-flex items-center gap-1.5 font-semibold text-[var(--vs-green-800)] transition hover:text-[var(--vs-green-900)]"
                  to={ROUTE_PATHS.register}
                >
                  Create account
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--vs-border)] bg-[var(--vs-bg)] px-5 py-3.5 text-center text-sm text-[var(--vs-muted)]">
                Staff accounts are provisioned by your administrator.
                Use your assigned credentials to sign in.
              </div>
            )}

            <div className="flex justify-center pt-1">
              <Link
                className="inline-flex items-center gap-2 text-sm text-[var(--vs-muted)] transition hover:text-[var(--vs-text)]"
                to={ROUTE_PATHS.home}
              >
                <ArrowLeft size={14} />
                Back to home
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
