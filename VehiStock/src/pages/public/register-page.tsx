import * as React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTE_PATHS, getDefaultPathForRole } from '@/app/config/routes'
import { GoogleAuthButton } from '@/features/auth/components/google-auth-button'
import { useAuth } from '@/hooks/use-auth'
import { ApiError } from '@/types/api'
import { ROLE_NAMES } from '@/constants/roles'

export function RegisterPage() {
  const navigate = useNavigate()
  const { registerCustomer, signInWithGoogle, signOut } = useAuth()
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const session = await registerCustomer({
        fullName,
        email,
        password,
        phoneNumber: phoneNumber || undefined,
        address,
      })

      navigate(getDefaultPathForRole(session.user.role), { replace: true })
    } catch (submitError) {
      const message =
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Customer registration failed.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setError(null)
    setIsGoogleSubmitting(true)

    try {
      const session = await signInWithGoogle({
        idToken,
        address: address || undefined,
      })

      if (session.user.role !== ROLE_NAMES.customer) {
        await signOut()
        throw new Error(
          'Google registration from this page is reserved for customer accounts.',
        )
      }

      navigate(getDefaultPathForRole(session.user.role), { replace: true })
    } catch (submitError) {
      const message =
        submitError instanceof ApiError || submitError instanceof Error
          ? submitError.message
          : 'Google registration failed.'
      setError(message)
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--vs-bg)] px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--vs-border)] bg-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-center bg-[linear-gradient(160deg,#12472a_0%,#1e7a46_55%,#87b948_100%)] p-8 text-white lg:p-10">
          <div className="mb-6 inline-flex w-fit rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
            Customer self registration
          </div>
          <h1 className="max-w-md text-4xl font-semibold tracking-[-0.04em]">
            Create your customer account
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/72">
            Register to book service appointments, request unavailable parts,
            submit reviews, and view your complete purchase and service history.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10">
          <form
            className="w-full max-w-md space-y-5"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <div className="inline-flex rounded-full bg-[var(--vs-green-100)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--vs-green-800)]">
                Customer Sign Up
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--vs-text)]">
                Register
              </h2>
              <p className="text-sm leading-6 text-[var(--vs-muted)]">
                Complete the required details below or continue with Google.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-[var(--vs-text)]">
                Full name
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  required
                  type="text"
                  value={fullName}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-[var(--vs-text)]">
                  Email
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
                  Phone number
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="Optional"
                    type="tel"
                    value={phoneNumber}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-[var(--vs-text)]">
                Address
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Your address"
                  required
                  type="text"
                  value={address}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-[var(--vs-text)]">
                  Password
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    type="password"
                    value={password}
                  />
                </label>

                <label className="block text-sm font-medium text-[var(--vs-text)]">
                  Confirm password
                  <input
                    className="mt-2 w-full rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--vs-green-600)]"
                    minLength={8}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </label>
              </div>
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
              {isSubmitting ? 'Creating account...' : 'Create customer account'}
              <ArrowRight size={16} />
            </button>

            <div className="flex w-full flex-col items-center gap-2">
              <GoogleAuthButton
                mode="signup"
                onCredential={handleGoogleCredential}
                onError={(message) => setError(message)}
              />
              {isGoogleSubmitting ? (
                <div className="text-xs text-[var(--vs-muted)]">
                  Completing Google account setup...
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--vs-border)] bg-[var(--vs-bg)] px-5 py-3.5 text-sm">
              <span className="text-[var(--vs-muted)]">
                Already have an account?
              </span>
              <Link
                className="inline-flex items-center gap-1.5 font-semibold text-[var(--vs-green-800)] transition hover:text-[var(--vs-green-900)]"
                to={`${ROUTE_PATHS.login}?role=customer`}
              >
                Customer login
                <ArrowRight size={14} />
              </Link>
            </div>

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
