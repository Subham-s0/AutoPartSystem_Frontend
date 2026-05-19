import * as React from 'react'
import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatDateOnly } from '@/utils/date'
import { cn } from '@/lib/utils'

function parseDateOnly(value: string): Date | undefined {
  if (!value) {
    return undefined
  }

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return undefined
  }

  return new Date(year, month - 1, day)
}

function toDateOnlyString(value: Date | undefined) {
  if (!value) {
    return ''
  }

  return format(value, 'yyyy-MM-dd')
}

function getRangeLabel(fromDate: string, toDate: string) {
  if (fromDate && toDate) {
    return `${formatDateOnly(fromDate)} – ${formatDateOnly(toDate)}`
  }

  if (fromDate) {
    return `From ${formatDateOnly(fromDate)}`
  }

  if (toDate) {
    return `Until ${formatDateOnly(toDate)}`
  }

  return 'Date range'
}

interface DateRangeFilterPopoverProps {
  fromDate: string
  toDate: string
  onApply: (fromDate: string, toDate: string) => void
  className?: string
}

export function DateRangeFilterPopover({
  fromDate,
  toDate,
  onApply,
  className,
}: DateRangeFilterPopoverProps) {
  const [open, setOpen] = React.useState(false)
  const [range, setRange] = React.useState<DateRange | undefined>()
  const [fromTime, setFromTime] = React.useState('00:00')
  const [toTime, setToTime] = React.useState('23:59')

  React.useEffect(() => {
    if (!open) {
      return
    }

    let isActive = true
    queueMicrotask(() => {
      if (!isActive) {
        return
      }

      const from = parseDateOnly(fromDate)
      const to = parseDateOnly(toDate)
      setRange(from || to ? { from, to } : undefined)
      setFromTime('00:00')
      setToTime('23:59')
    })

    return () => {
      isActive = false
    }
  }, [open, fromDate, toDate])

  function handleApply() {
    const nextFrom = toDateOnlyString(range?.from)
    const nextTo = toDateOnlyString(range?.to ?? range?.from)

    if (nextFrom && nextTo && nextFrom > nextTo) {
      return
    }

    onApply(nextFrom, nextTo)
    setOpen(false)
  }

  function handleClear() {
    setRange(undefined)
    setFromTime('00:00')
    setToTime('23:59')
    onApply('', '')
    setOpen(false)
  }

  const hasSelection = Boolean(fromDate || toDate)
  const rangeInvalid =
    Boolean(range?.from && range?.to) &&
    toDateOnlyString(range?.from)! > toDateOnlyString(range?.to)!

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-[7px] rounded-full border border-[var(--vs-border)] bg-white px-3.5 text-xs font-bold text-[var(--vs-green-800)] hover:bg-[var(--vs-green-100)] data-[state=open]:bg-[var(--vs-green-100)]',
            hasSelection && 'border-[var(--vs-green-600)]/40 bg-[var(--vs-green-100)]',
            className,
          )}
          type="button"
        >
          <CalendarDays size={15} />
          <span className="max-w-[200px] truncate">{getRangeLabel(fromDate, toDate)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <PopoverHeader className="border-b border-[var(--vs-soft-border)] px-4 py-3">
          <PopoverTitle>Filter by date</PopoverTitle>
          <PopoverDescription>
            Select a start and end date on the calendar, then apply the filter.
          </PopoverDescription>
        </PopoverHeader>

        <div className="p-3">
          <Calendar
            defaultMonth={range?.from ?? range?.to ?? new Date()}
            mode="range"
            numberOfMonths={2}
            onSelect={setRange}
            selected={range}
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-[var(--vs-muted)]" htmlFor="date-range-from-time">
                From time
              </Label>
              <Input
                className="h-9 rounded-full"
                id="date-range-from-time"
                onChange={(event) => setFromTime(event.target.value)}
                type="time"
                value={fromTime}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[var(--vs-muted)]" htmlFor="date-range-to-time">
                To time
              </Label>
              <Input
                className="h-9 rounded-full"
                id="date-range-to-time"
                onChange={(event) => setToTime(event.target.value)}
                type="time"
                value={toTime}
              />
            </div>
          </div>

          {rangeInvalid ? (
            <p className="mt-2 text-xs text-[var(--vs-red)]">End date must be on or after start date.</p>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-[var(--vs-soft-border)] pt-3">
            <Button onClick={handleClear} size="sm" type="button" variant="outline">
              Clear
            </Button>
            <Button disabled={rangeInvalid} onClick={handleApply} size="sm" type="button">
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
