import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../../lib/utils';
import 'react-day-picker/dist/style.css';

export interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = 'Sana tanlang',
  className
}: DatePickerProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-xl border-2 border-indigo-200 bg-white px-4 py-2 text-sm',
            'ring-offset-white',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200 hover:border-indigo-300',
            'text-left font-normal',
            !date && 'text-gray-400',
            className
          )}
        >
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={cn(
            'z-50 w-auto rounded-xl border-2 border-indigo-200 bg-white p-3 shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2'
          )}
          align="start"
        >
          <DayPicker
            mode="single"
            selected={date}
            onSelect={onDateChange}
            className="rounded-md"
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-semibold text-indigo-700',
              nav: 'space-x-1 flex items-center',
              nav_button: cn(
                'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                'inline-flex items-center justify-center rounded-md',
                'hover:bg-indigo-50 transition-colors'
              ),
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-gray-500 rounded-md w-9 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-indigo-50/50 [&:has([aria-selected])]:bg-indigo-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: cn(
                'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                'rounded-md hover:bg-indigo-100 hover:text-indigo-700',
                'transition-colors duration-200'
              ),
              day_selected: 'bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white focus:bg-indigo-600 focus:text-white',
              day_today: 'bg-indigo-100 text-indigo-700 font-semibold',
              day_outside: 'text-gray-400 opacity-50',
              day_disabled: 'text-gray-300 cursor-not-allowed opacity-50',
              day_range_middle: 'aria-selected:bg-indigo-50 aria-selected:text-indigo-700',
              day_hidden: 'invisible',
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
