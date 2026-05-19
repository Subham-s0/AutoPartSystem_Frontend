import type { PropsWithChildren } from 'react'
import { AuthProvider } from './auth-provider'
import { QueryProvider } from './query-provider'
import { ThemeProvider } from './theme-provider'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
