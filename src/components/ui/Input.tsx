import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../../lib/utils';

const Label = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
	<LabelPrimitive.Root
		ref={ref}
		className={cn(
			'text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
			className,
		)}
		{...props}
	/>
));
Label.displayName = LabelPrimitive.Root.displayName;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	size?: 'small' | 'middle' | 'large';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, size = 'middle', ...props }, ref) => {
	const sizeClasses =
		size === 'small'
			? 'h-8 px-3 py-1.5 text-sm rounded-md'
			: size === 'large'
				? 'h-12 px-5 py-3 text-base rounded-2xl'
				: 'h-10 px-4 py-2 text-sm rounded-xl';

	return (
		<input
			type={type}
			className={cn(
				'flex w-full border border-indigo-200 bg-white',
				sizeClasses,
				'text-gray-800',
				'ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium',
				'placeholder:text-gray-400',
				'focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none',
				'focus:border-indigo-300',
				'hover:border-indigo-300',
				'disabled:cursor-not-allowed disabled:opacity-50',
				'transition-all duration-200',
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
});
Input.displayName = 'Input';

export { Input, Label };
