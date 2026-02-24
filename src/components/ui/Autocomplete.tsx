import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from './Input';

export interface AutocompleteOption {
	id: string;
	label: string;
	value: string;
}

const SEARCH_DEBOUNCE_MS = 300;

interface AutocompleteProps {
	options: AutocompleteOption[];
	value?: string;
	onChange?: (value: string) => void;
	onAddNew?: (value: string) => void;
	onSearchChange?: (query: string) => void;
	placeholder?: string;
	className?: string;
	emptyMessage?: string;
	disabled?: boolean;
	/** Scroll oxiriga yetganda keyingi sahifa (load more) */
	onScrollToBottom?: () => void;
	hasMore?: boolean;
}

export function Autocomplete({
	options,
	value,
	onChange,
	onAddNew,
	onSearchChange,
	placeholder = 'Qidirish...',
	className,
	emptyMessage = "Ma'lumot topilmadi",
	disabled = false,
	onScrollToBottom,
	hasMore = false,
}: AutocompleteProps) {
	const [open, setOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState('');
	const [selectedOption, setSelectedOption] = React.useState<AutocompleteOption | null>(
		options.find((opt) => opt.value === value) || null,
	);
	const listRef = React.useRef<HTMLDivElement>(null);
	const serverSearch = typeof onSearchChange === 'function';

	React.useEffect(() => {
		const option = options.find((opt) => opt.value === value);
		setSelectedOption(option || null);
	}, [value, options]);

	// Backend qidiruv: debounce
	React.useEffect(() => {
		if (!serverSearch) return;
		const t = setTimeout(() => {
			onSearchChange?.(searchQuery.trim());
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [searchQuery, serverSearch, onSearchChange]);

	// Reset search when popover closes
	React.useEffect(() => {
		if (!open) {
			setSearchQuery('');
		}
	}, [open]);

	// Client-side filter faqat serverSearch bo'lmaganda
	const filteredOptions = React.useMemo(() => {
		if (serverSearch) return options;
		if (!searchQuery) return options;
		const query = searchQuery.toLowerCase();
		return options.filter(
			(opt) => opt.label.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query),
		);
	}, [options, searchQuery, serverSearch]);

	// Autocomplete ochiq bo'lganda boshqa scrolllarni bloklash
	React.useEffect(() => {
		if (open) {
			// Document body ga class qo'shish - boshqa scrolllarni o'chirish uchun
			document.body.style.setProperty('--autocomplete-open', '1');
			document.body.classList.add('autocomplete-open');
		} else {
			document.body.style.removeProperty('--autocomplete-open');
			document.body.classList.remove('autocomplete-open');
		}

		return () => {
			document.body.style.removeProperty('--autocomplete-open');
			document.body.classList.remove('autocomplete-open');
		};
	}, [open]);

	const handleSelect = (option: AutocompleteOption, e?: React.PointerEvent<HTMLButtonElement>) => {
		// Touch event handling - agar scroll bo'lsa, select qilmaslik
		if (e && e.pointerType === 'touch') {
			const el = e.currentTarget as HTMLElement;
			const moved = el.dataset.__moved === '1';
			if (moved) return;
		}

		setSelectedOption(option);
		onChange?.(option.value);
		setOpen(false);
		setSearchQuery('');
	};

	const handleAddNew = () => {
		if (searchQuery.trim() && onAddNew) {
			onAddNew(searchQuery.trim());
			setSearchQuery('');
			setOpen(false);
		}
	};

	return (
		<Popover.Root open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
			<Popover.Trigger asChild>
				<button
					disabled={disabled}
					className={cn(
						'flex h-10 w-full items-center justify-between rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm',
						'ring-offset-white',
						'focus:outline-none focus:ring-0 focus:shadow-none',
						'focus:border-indigo-300',
						'hover:border-indigo-300',
						'disabled:cursor-not-allowed disabled:opacity-50',
						'transition-all duration-200',
						'data-[state=open]:border-indigo-500',
						'text-left font-normal',
						className,
					)}
				>
					<span className={cn('truncate', !selectedOption && 'text-gray-400')}>
						{selectedOption ? selectedOption.label : placeholder}
					</span>
					<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
				</button>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					className={cn(
						'z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border-2 border-indigo-200 bg-white shadow-lg',
						'data-[state=open]:animate-in data-[state=closed]:animate-out',
						'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
						'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
						'data-[side=bottom]:slide-in-from-top-2',
						'flex flex-col max-h-[400px]',
					)}
					align='start'
					sideOffset={4}
					onWheel={(e) => {
						// Popover ichida wheel eventni to'xtatish - product list ga ketmasligi uchun
						e.stopPropagation();
						e.nativeEvent.stopImmediatePropagation();
					}}
					onTouchMove={(e) => {
						// Touch scroll eventni to'xtatish
						e.stopPropagation();
					}}
				>
					{/* Search Input */}
					<div className='p-2 border-b border-indigo-100 shrink-0'>
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400' />
							<Input
								type='text'
								placeholder='Qidirish...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='pl-9 h-9 text-sm'
								autoFocus
							/>
						</div>
					</div>

					{/* Options List */}
					<div
						ref={listRef}
						data-autocomplete-list='true'
						className='flex-1 overflow-y-auto overflow-x-hidden p-1 min-h-0 overscroll-contain'
						style={{
							maxHeight: '300px',
							overscrollBehavior: 'contain',
							WebkitOverflowScrolling: 'touch',
						}}
						onWheel={(e) => {
							// Scroll eventni to'xtatish - product list ga ketmasligi uchun
							e.stopPropagation();
							// Native eventni ham to'xtatish
							if (e.nativeEvent) {
								e.nativeEvent.stopImmediatePropagation();
							}
						}}
						onScroll={(e) => {
							// Scroll eventni to'xtatish
							e.stopPropagation();
							// Native eventni ham to'xtatish
							if (e.nativeEvent) {
								e.nativeEvent.stopImmediatePropagation();
							}
							// Scroll oxiriga yetganda keyingi sahifani yuklash
							if (onScrollToBottom && listRef.current) {
								const el = listRef.current;
								const threshold = 60;
								if (el.scrollHeight - el.scrollTop <= el.clientHeight + threshold) {
									onScrollToBottom();
								}
							}
						}}
						onTouchMove={(e) => {
							// Touch scroll eventni to'xtatish
							e.stopPropagation();
						}}
						onMouseDown={(e) => {
							// Mouse eventni to'xtatish - scroll ishlashi uchun
							e.stopPropagation();
						}}
					>
						{filteredOptions.length > 0 ? (
							filteredOptions.map((option) => (
								<button
									key={option.id}
									onPointerDown={(e) => {
										const pe = e as React.PointerEvent;
										const el = e.currentTarget as HTMLElement;
										if (pe.pointerType === 'touch') {
											el.dataset.__startX = String(pe.clientX);
											el.dataset.__startY = String(pe.clientY);
											el.dataset.__moved = '0';
										}
									}}
									onPointerMove={(e) => {
										const pe = e as React.PointerEvent;
										const el = e.currentTarget as HTMLElement;
										if (pe.pointerType === 'touch') {
											const sx = Number(el.dataset.__startX || 0);
											const sy = Number(el.dataset.__startY || 0);
											if (Math.abs(pe.clientX - sx) > 6 || Math.abs(pe.clientY - sy) > 6) {
												el.dataset.__moved = '1';
											}
										}
									}}
									onPointerUp={(e) => {
										const pe = e as React.PointerEvent;
										const el = e.currentTarget as HTMLElement;
										if (pe.pointerType === 'touch') {
											const moved = el.dataset.__moved === '1';
											if (!moved) {
												e.preventDefault();
												e.stopPropagation();
												handleSelect(option, e);
											}
											delete el.dataset.__startX;
											delete el.dataset.__startY;
											delete el.dataset.__moved;
										} else {
											handleSelect(option, e);
										}
									}}
									className={cn(
										'relative flex w-full cursor-default select-none items-center rounded-lg py-2.5 pl-8 pr-2 text-sm outline-none',
										'focus:bg-indigo-50 focus:text-indigo-700',
										'hover:bg-indigo-50 hover:text-indigo-700',
										'transition-colors duration-200',
										selectedOption?.id === option.id && 'bg-indigo-50 text-indigo-700',
									)}
								>
									<span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
										{selectedOption?.id === option.id && (
											<Check className='h-4 w-4 text-indigo-600' />
										)}
									</span>
									<span className='flex-1 min-w-0 whitespace-normal break-words text-left'>
										{option.label}
									</span>
								</button>
							))
						) : (
							<div className='py-6 text-center text-sm text-gray-500'>{emptyMessage}</div>
						)}

						{/* Load More Indicator */}
						{hasMore && onScrollToBottom && (
							<div className='flex items-center justify-center py-2 border-t border-indigo-100'>
								<span className='text-xs text-gray-500'>Yana yuklash uchun pastga scroll qiling</span>
							</div>
						)}

						{/* Add New Option */}
						{searchQuery.trim() &&
							!filteredOptions.some(
								(opt) =>
									opt.label.toLowerCase() === searchQuery.toLowerCase() ||
									opt.value.toLowerCase() === searchQuery.toLowerCase(),
							) &&
							onAddNew && (
								<button
									onClick={handleAddNew}
									className='w-full flex items-center justify-center space-x-2 py-2.5 px-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200 font-medium border-t border-indigo-100 mt-1 pt-2'
								>
									<span>+</span>
									<span>Yangi qo'shish: "{searchQuery}"</span>
								</button>
							)}
					</div>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
