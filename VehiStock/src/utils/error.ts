import { ApiError } from '@/types/api'

/**
 * Extracts a human-readable error message from an unknown caught value.
 * Supports ApiError and standard Error instances.
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message
  }
  return fallback
}
