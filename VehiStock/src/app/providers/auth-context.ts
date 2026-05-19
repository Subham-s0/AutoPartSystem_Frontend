import * as React from 'react'
import type { AuthContextValue } from '@/types/auth'

export const AuthContext = React.createContext<AuthContextValue | null>(null)
