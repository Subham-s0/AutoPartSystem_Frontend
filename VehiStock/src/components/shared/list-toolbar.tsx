import { ArrowDownUp, Filter, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface FilterOption {
  label: string
  value: string
}

export interface SortOption<TKey extends string = string> {
  label: string
  key: TKey
}

interface ListToolbarProps<TSortKey extends string = string> {
  /** Search input */
  searchPlaceholder: string
  searchAriaLabel: string
  searchText: string
  onSearchTextChange: (value: string) => void

  /** Status / filter dropdown (optional — omit to hide the filter button) */
  filterLabel?: string
  filterValue?: string
  onFilterChange?: (value: string) => void
  filterOptions?: FilterOption[]

  /** Sort dropdown */
  sortOptions?: SortOption<TSortKey>[]
  sortKey?: TSortKey
  onSortKeyChange?: (value: TSortKey) => void

  /** Additional toolbar actions rendered after the dropdowns */
  extra?: React.ReactNode
}

/**
 * A reusable toolbar with search input, optional filter dropdown, and sort dropdown.
 * Extracted from the pattern shared across history, payments, part-requests, reviews,
 * service-invoices, and appointments pages.
 */
export function ListToolbar<TSortKey extends string = string>({
  searchPlaceholder,
  searchAriaLabel,
  searchText,
  onSearchTextChange,
  filterLabel,
  filterValue,
  onFilterChange,
  filterOptions,
  sortOptions,
  sortKey,
  onSortKeyChange,
  extra,
}: ListToolbarProps<TSortKey>) {
  const activeFilterLabel =
    filterValue && filterOptions
      ? filterOptions.find((opt) => opt.value === filterValue)?.label ?? filterValue
      : filterLabel ?? 'Filter'

  const activeSortLabel =
    sortOptions && sortKey
      ? sortOptions.find((opt) => opt.key === sortKey)?.label ?? sortOptions[0]?.label ?? 'Sort'
      : 'Sort'

  return (
    <div className="flex items-center justify-between gap-3 max-md:flex-col max-md:items-stretch">
      <label className="flex min-h-[38px] w-[min(440px,100%)] items-center gap-2 rounded-full border border-[var(--vs-border)] bg-[var(--vs-bg)] px-3 text-[var(--vs-muted)] max-md:w-full">
        <Search size={16} />
        <input
          aria-label={searchAriaLabel}
          className="w-full min-w-0 border-0 bg-transparent text-[13px] text-[var(--vs-text)] outline-none placeholder:text-[var(--vs-faint)]"
          onChange={(event) => onSearchTextChange(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={searchText}
        />
      </label>

      <div className="flex items-center justify-end gap-2 max-md:w-full max-md:flex-wrap max-md:justify-start">
        {filterOptions && onFilterChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex min-h-[38px] max-w-[240px] cursor-pointer items-center justify-center gap-[7px] rounded-full border border-[var(--vs-border)] bg-white px-3.5 text-xs font-bold text-[var(--vs-green-800)] hover:bg-[var(--vs-green-100)] data-[state=open]:bg-[var(--vs-green-100)]"
                type="button"
              >
                <Filter size={15} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {activeFilterLabel}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!w-[220px] !min-w-[220px]">
              <DropdownMenuLabel>{filterLabel ?? 'Filter'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                onValueChange={(value) => onFilterChange(value === 'all' ? '' : value)}
                value={filterValue || 'all'}
              >
                <DropdownMenuRadioItem
                  className="gap-2 py-[7px] pl-2.5 pr-7 text-xs"
                  value="all"
                >
                  All
                </DropdownMenuRadioItem>
                {filterOptions.map((option) => (
                  <DropdownMenuRadioItem
                    className="gap-2 py-[7px] pl-2.5 pr-7 text-xs"
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {sortOptions && sortKey && onSortKeyChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex min-h-[38px] max-w-[220px] cursor-pointer items-center justify-center gap-[7px] rounded-full border border-[var(--vs-border)] bg-white px-3.5 text-xs font-bold text-[var(--vs-green-800)] hover:bg-[var(--vs-green-100)] data-[state=open]:bg-[var(--vs-green-100)]"
                type="button"
              >
                <ArrowDownUp size={15} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {activeSortLabel}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!w-[200px] !min-w-[200px]">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                onValueChange={(value) => onSortKeyChange(value as TSortKey)}
                value={sortKey}
              >
                {sortOptions.map((option) => (
                  <DropdownMenuRadioItem
                    className="gap-2 py-[7px] pl-2.5 pr-7 text-xs"
                    key={option.key}
                    value={option.key}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {extra}
      </div>
    </div>
  )
}
