import * as React from 'react'
import { getErrorMessage } from '@/utils/error'

/**
 * A reusable hook for async data fetching with loading/error state management.
 *
 * Encapsulates the common pattern of:
 * - `useState` for data, loading, and error
 * - `useEffect` with isMounted cleanup guard
 * - Error extraction via `getErrorMessage()`
 * - A `refetch` trigger to reload data on demand
 *
 * @example
 * ```tsx
 * const { data: vehicles, isLoading, error, refetch } = useAsyncData(
 *   () => getCustomerVehicles({ sorts: DEFAULT_VEHICLE_LIST_SORTS }),
 *   [],
 *   { fallbackError: 'Unable to load vehicles.' }
 * )
 * ```
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
  options?: { fallbackError?: string },
): {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
} {
  const [data, setData] = React.useState<T | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)

  const fallbackError = options?.fallbackError ?? 'Something went wrong.'

  React.useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const result = await fetcher()

        if (isMounted) {
          setData(result)
        }
      } catch (fetchError) {
        if (isMounted) {
          setData(null)
          setError(getErrorMessage(fetchError, fallbackError))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  const refetch = React.useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  return { data, isLoading, error, refetch }
}
