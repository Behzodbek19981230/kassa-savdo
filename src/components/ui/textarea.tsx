import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
	return (
		<textarea
			className={cn(
				'flex min-h-[60px] w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none focus:border-indigo-300 hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
});
Textarea.displayName = 'Textarea';

export { Textarea };
