import * as React from 'react'
import { APP_CONFIG } from '@/constants/app-config'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number>,
          ) => void
        }
      }
    }
  }
}

let googleScriptPromise: Promise<void> | null = null
let latestOnCredential: ((idToken: string) => void | Promise<void>) | null = null
let latestOnError: ((message: string) => void) | null = null
let isGoogleInitialized = false
let isGoogleInitialized = false
let currentCredentialCallback: ((idToken: string) => void | Promise<void>) | null = null
let currentErrorCallback: ((message: string) => void) | null = null

let isGoogleAuthInitialized = false

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }

  if (googleScriptPromise) {
    return googleScriptPromise
  }

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-identity="true"]',
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load Google Identity script.')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Failed to load Google Identity script.'))

    document.head.appendChild(script)
  })

  return googleScriptPromise
}

interface GoogleAuthButtonProps {
  mode?: 'signin' | 'signup'
  onCredential: (idToken: string) => void | Promise<void>
  onError?: (message: string) => void
}

export function GoogleAuthButton({
  mode = 'signin',
  onCredential,
  onError,
}: GoogleAuthButtonProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  latestOnCredential = onCredential
  latestOnError = onError

  React.useEffect(() => {
    currentCredentialCallback = onCredential
    currentErrorCallback = onError ?? null
  }, [onCredential, onError])

  React.useEffect(() => {
    if (!APP_CONFIG.googleClientId) {
      onError?.(
        'Google login is not configured. Set VITE_GOOGLE_CLIENT_ID and the matching backend Authentication:Google:ClientId.',
      )
      return
    }

    const container = containerRef.current

    if (!container) {
      return
    }

    let isMounted = true

    container.innerHTML = ''

    loadGoogleIdentityScript()
      .then(() => {
        if (!isMounted || !window.google?.accounts?.id) {
          return
        }

        if (!isGoogleAuthInitialized) {
        if (!isGoogleInitialized) {
          window.google.accounts.id.initialize({
            client_id: APP_CONFIG.googleClientId,
            callback: ({ credential }) => {
              if (!credential) {
                onError?.('Google did not return an ID token.')
                return
              }

              void onCredential(credential)
            },
          })
          isGoogleAuthInitialized = true
                latestOnError?.('Google did not return an ID token.')
                return
              }

              void latestOnCredential?.(credential)
                currentErrorCallback?.('Google did not return an ID token.')
                return
              }

              if (currentCredentialCallback) {
                void currentCredentialCallback(credential)
              }
            },
          })
          isGoogleInitialized = true
        }

        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          width: 320,
        })
      })
      .catch((error) => {
        onError?.(
          error instanceof Error
            ? error.message
            : 'Google login could not be initialized.',
        )
      })

    return () => {
      isMounted = false
      container.innerHTML = ''
    }
  }, [mode, onCredential, onError])

  const isLoopbackIp = typeof window !== 'undefined' && 
    (window.location.hostname === '127.0.0.1' || window.location.hostname === '::1');

  if (!APP_CONFIG.googleClientId) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--vs-border)] bg-white px-4 py-3 text-sm text-[var(--vs-muted)]">
        Google login is not configured yet. Set `VITE_GOOGLE_CLIENT_ID` in the
        frontend environment and the matching backend
        `Authentication:Google:ClientId`.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {isLoopbackIp && (
        <div className="w-full max-w-[320px] rounded-2xl border border-amber-500/20 bg-amber-50 px-4 py-3 text-xs text-amber-800 leading-relaxed text-center">
          ⚠️ <strong>Google Sign-In Warning:</strong> You are accessing via an IP address. 
          Google OAuth strictly requires <strong>localhost</strong>. Please click the link below to open:
          <br />
          <a 
            href="http://localhost:5173" 
            className="inline-block mt-2 font-bold underline hover:text-amber-950 transition"
          >
            http://localhost:5173
          </a>
        </div>
      )}
      <div className="min-h-11" ref={containerRef} />
    </div>
  )
}
