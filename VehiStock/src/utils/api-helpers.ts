import type { SortRequest } from '@/types/api'

/**
 * Appends an optional non-empty string value to URLSearchParams.
 */
export function appendOptionalQueryValue(
  searchParams: URLSearchParams,
  name: string,
  value?: string | null,
) {
  if (value && value.trim()) {
    searchParams.append(name, value.trim())
  }
}

/**
 * Appends sort parameters in indexed bracket notation for ASP.NET model binding.
 */
export function appendSorts(searchParams: URLSearchParams, sorts?: SortRequest[]) {
  sorts?.forEach((sort, index) => {
    searchParams.append(`sorts[${index}].sortBy`, sort.sortBy)
    searchParams.append(`sorts[${index}].sortDirection`, sort.sortDirection)
  })
}

/**
 * Creates a paginated listing URL with optional search/filter/sort params.
 */
export function createListingUrl(
  path: string,
  query: {
    pageNumber?: number
    pageSize?: number
    searchText?: string
    status?: string
    invoiceStatus?: string
    sorts?: SortRequest[]
  },
) {
  const searchParams = new URLSearchParams({
    pageNumber: String(query.pageNumber ?? 1),
    pageSize: String(query.pageSize ?? 10),
  })

  appendOptionalQueryValue(searchParams, 'searchText', query.searchText)
  appendOptionalQueryValue(searchParams, 'status', query.status)
  appendOptionalQueryValue(searchParams, 'invoiceStatus', query.invoiceStatus)
  appendSorts(searchParams, query.sorts)

  return `${path}?${searchParams.toString()}`
}

/**
 * Appends an optional non-empty string value to FormData.
 */
export function appendOptionalFormValue(
  formData: FormData,
  name: string,
  value?: string | null,
) {
  if (value && value.trim()) {
    formData.append(name, value)
  }
}
