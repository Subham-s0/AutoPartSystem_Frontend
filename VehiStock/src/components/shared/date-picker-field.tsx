import * as React from 'react'
import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
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

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

interface DatePickerFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  className?: string
  minDate?: Date
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  required = false,
  id,
  className,
  minDate = startOfToday(),
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseDateOnly(value)

  function handleSelect(date: Date | undefined) {
    onChange(toDateOnlyString(date))
    if (date) {
      setOpen(false)
    }
  }

  return (
    <>
      {required ? (
        <input
          aria-hidden
          className="sr-only"
          readOnly
          required
          tabIndex={-1}
          type="text"
          value={value}
        />
      ) : null}
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'form-input !flex w-full cursor-pointer flex-row items-center justify-between gap-2 text-left font-normal',
              !value && 'text-[var(--vs-faint)]',
              className,
            )}
            disabled={disabled}
            id={id}
            type="button"
          >
            <span className="min-w-0 flex-1 truncate">
              {value ? formatDateOnly(value) : placeholder}
            </span>
            <CalendarDays className="size-4 shrink-0 text-[var(--vs-muted)]" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            defaultMonth={selected ?? minDate}
            disabled={{ before: minDate }}
            mode="single"
            onSelect={handleSelect}
            selected={selected}
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
