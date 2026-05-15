import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface SearchableComboboxOption {
  value: string
  label: string
  searchText: string
  secondaryText?: string
}

export interface SearchableComboboxProps {
  emptyText: string
  onChange: (value: string) => void
  options: SearchableComboboxOption[]
  placeholder: string
  searchPlaceholder: string
  value: string
  disabled?: boolean
  /** Match customer portal `.form-select` instead of outline button */
  formSelectTrigger?: boolean
  /**
   * When true, the list is not filtered client-side; use `onSearchChange` to load options from the server.
   */
  serverSearch?: boolean
  onSearchChange?: (search: string) => void
  searchLoading?: boolean
}

export function SearchableCombobox({
  emptyText,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  value,
  disabled = false,
  formSelectTrigger = false,
  serverSearch = false,
  onSearchChange,
  searchLoading = false,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find((option) => option.value === value)

  const triggerContent = (
    <>
      <span className="min-w-0 flex-1 truncate text-left">
        {selectedOption?.label ?? placeholder}
      </span>
      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
    </>
  )

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        {formSelectTrigger ? (
          <button
            aria-expanded={open}
            className={cn(
              'form-select !flex w-full cursor-pointer items-center justify-between gap-2 text-left font-normal disabled:cursor-not-allowed disabled:opacity-60',
            )}
            disabled={disabled}
            type="button"
          >
            {triggerContent}
          </button>
        ) : (
          <Button
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
            role="combobox"
            type="button"
            variant="outline"
          >
            {triggerContent}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={serverSearch ? false : undefined}>
          <CommandInput
            onValueChange={serverSearch ? onSearchChange : undefined}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>
              {searchLoading ? 'Loading…' : emptyText}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  className={cn(option.secondaryText ? 'items-start py-2' : '')}
                  key={option.value === '' ? '__empty' : option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  value={`${option.label} ${option.searchText}`}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4 shrink-0',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                      option.secondaryText ? 'mt-0.5' : '',
                    )}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.secondaryText ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {option.secondaryText}
                      </span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
