import type { PropsWithChildren } from 'react'
import {
  ThemeProvider as NextThemeProvider,
  type ThemeProviderProps,
} from 'next-themes'

type AppThemeProviderProps = PropsWithChildren<
  Omit<ThemeProviderProps, 'children'>
>

export function ThemeProvider({
  children,
  ...props
}: AppThemeProviderProps) {
  return <NextThemeProvider {...props}>{children}</NextThemeProvider>
}
