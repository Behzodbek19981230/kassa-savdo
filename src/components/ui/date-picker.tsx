'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

import { cn } from '../../lib/utils';
import { DatePicker as SingleDatePicker } from './DatePicker';

interface DatePickerProps {
	date?: Date;
	onDateChange?: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function DateRangePicker({
	dateFrom,
	dateTo,
	onDateFromChange,
	onDateToChange,
	placeholderFrom = 'Boshlanish',
	placeholderTo = 'Tugash',
	disabled = false,
	className,
}: {
	dateFrom?: Date;
	dateTo?: Date;
	onDateFromChange?: (date: Date | undefined) => void;
	onDateToChange?: (date: Date | undefined) => void;
	placeholderFrom?: string;
	placeholderTo?: string;
	disabled?: boolean;
	className?: string;
}) {
	const handleFromSelect = (d: Date | undefined) => {
		if (onDateFromChange) onDateFromChange(d);
		if (d && dateTo && d > dateTo) {
			if (onDateToChange) onDateToChange(undefined);
		}
	};

	const handleToSelect = (d: Date | undefined) => {
		if (onDateToChange) onDateToChange(d);
		if (d && dateFrom && d < dateFrom) {
			if (onDateFromChange) onDateFromChange(undefined);
		}
	};

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<div className='w-[140px]'>
				<SingleDatePicker
					date={dateFrom}
					onDateChange={handleFromSelect}
					placeholder={placeholderFrom}
					disabled={disabled ? true : dateTo ? { after: dateTo } : undefined}
				/>
			</div>
			<span className='text-gray-400'>—</span>
			<div className='w-[140px]'>
				<SingleDatePicker
					date={dateTo}
					onDateChange={handleToSelect}
					placeholder={placeholderTo}
					disabled={disabled ? true : dateFrom ? { before: dateFrom } : undefined}
				/>
			</div>
		</div>
	);
}
