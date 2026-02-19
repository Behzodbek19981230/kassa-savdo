import React from 'react';
import { cn } from '../../lib/utils';

interface NumberInputProps {
	value: string; // normalized numeric string, e.g. "10000.50"
	onChange: (value: string) => void; // returns normalized string
	allowDecimal?: boolean;
	placeholder?: string;
	className?: string;
	// size prop: small | middle | large
	size?: 'small' | 'middle' | 'large';
	step?: string;
}

export function NumberInput({
	value,
	onChange,
	allowDecimal = true,
	placeholder,
	className,
	step,
	size = 'middle',
}: NumberInputProps) {
	const formatWithSpaces = (val?: string | number) => {
		if (val == null || val === '') return '';
		const s = String(val);
		const parts = s.split('.');
		parts[0] = parts[0].replace(/^0+(?=\d)/, '');
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
		return parts.join('.');
	};

	const normalizeInputNumber = (val: string) => {
		if (!val) return '';
		let cleaned = val
			.replace(/\s+/g, '')
			.replace(/,/g, '.')
			.replace(/[^0-9.]/g, '');
		const parts = cleaned.split('.');
		if (!allowDecimal && parts.length > 1) cleaned = parts[0];
		if (parts.length > 1) cleaned = parts[0] + '.' + parts.slice(1).join('');
		return cleaned;
	};

	const sizeClasses =
		size === 'small'
			? 'h-8 px-3 py-1.5 text-sm rounded-md'
			: size === 'large'
				? 'h-12 px-5 py-3 text-base rounded-2xl'
				: 'h-10 px-4 py-2 text-sm rounded-xl';

	return (
		<input
			type='text'
			inputMode={allowDecimal ? 'decimal' : 'numeric'}
			value={formatWithSpaces(value)}
			onChange={(e) => onChange(normalizeInputNumber(e.target.value))}
			placeholder={placeholder}
			className={
				cn
					? cn(
							`${sizeClasses} text-gray-800 border-2 border-indigo-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`,
							className,
						)
					: `${sizeClasses} text-gray-800 ${className}`
			}
			data-step={step}
		/>
	);
}

export default NumberInput;
