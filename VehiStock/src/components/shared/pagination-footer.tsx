interface PaginationFooterProps {
  pageNumber: number
  pageSize: number
  totalRecords: number
  totalPages: number
  itemCount: number
  isLoading: boolean
  onPrevious: () => void
  onNext: () => void
}

/**
 * A shared pagination footer showing "Showing X-Y of Z" + Previous/Next buttons.
 * Extracted from the repeated pattern across 7+ listing pages.
 */
export function PaginationFooter({
  pageNumber,
  pageSize,
  totalRecords,
  totalPages,
  itemCount,
  isLoading,
  onPrevious,
  onNext,
}: PaginationFooterProps) {
  const normalizedTotalPages = totalPages > 0 ? totalPages : 1
  const startRecord = totalRecords === 0 ? 0 : (pageNumber - 1) * pageSize + 1
  const endRecord =
    totalRecords === 0 ? 0 : Math.min(startRecord + itemCount - 1, totalRecords)

  return (
    <div className="flex items-center justify-between gap-3 border-t border-[var(--vs-soft-border)] pt-3.5 text-xs text-[var(--vs-muted)] max-md:flex-col max-md:items-start">
      <div>
        {totalRecords === 0
          ? 'No records available.'
          : `Showing ${startRecord}\u2013${endRecord} of ${totalRecords}`}
      </div>
      <div className="flex items-center gap-2">
        <span>
          Page {pageNumber} of {normalizedTotalPages}
        </span>
        <button
          className="tb-btn"
          disabled={isLoading || pageNumber <= 1}
          onClick={onPrevious}
          type="button"
        >
          Previous
        </button>
        <button
          className="tb-btn"
          disabled={
            isLoading || pageNumber >= normalizedTotalPages || totalRecords === 0
          }
          onClick={onNext}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  )
}
