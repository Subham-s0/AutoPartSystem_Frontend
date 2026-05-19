import * as React from 'react'

export function usePagination(initialPage = 1, initialPageSize = 10) {
  const [page, setPage] = React.useState(initialPage)
  const [pageSize, setPageSize] = React.useState(initialPageSize)

  const resetPagination = React.useCallback(() => {
    setPage(initialPage)
    setPageSize(initialPageSize)
  }, [initialPage, initialPageSize])

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPagination,
  }
}
