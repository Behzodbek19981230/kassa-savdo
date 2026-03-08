import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatMoney(value: number | string | null | undefined): string {
	const num = Number(value);

	if (!Number.isFinite(num)) {
		return '0.00';
	}

	const sign = num < 0 ? '-' : '';
	const [intPart, decimalPart] = Math.abs(num).toFixed(2).split('.');
	const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

	return `${sign}${groupedInt}.${decimalPart}`;
}
