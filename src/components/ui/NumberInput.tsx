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
    disabled?: boolean;
}

export function NumberInput({
    value,
    onChange,
    disabled,
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
        // Limit decimal places to 2 in display
        if (parts.length > 1) {
            parts[1] = parts[1].slice(0, 2);
        }
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
        if (parts.length > 1) {
            // Limit decimal places to 2
            const decimalPart = parts.slice(1).join('').slice(0, 2);
            cleaned = parts[0] + '.' + decimalPart;
        }
        return cleaned;
    };

    const sizeClasses =
        size === 'small'
            ? 'h-7 px-2 py-1 text-xs rounded-md'
            : size === 'large'
                ? 'h-10 px-6 py-2 text-sm rounded-lg'
                : 'h-7 px-3 py-1.5 text-xs rounded-lg';

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
                        `${sizeClasses} text-gray-800 border border-indigo-200 bg-white focus-visible:outline-none focus-visible:ring-0 focus:border-indigo-300 transition-all duration-200`,
                        className,
                    )
                    : `${sizeClasses} text-gray-800 ${className}`
            }
            data-step={step}
            disabled={disabled}
        />
    );
}

export default NumberInput;
