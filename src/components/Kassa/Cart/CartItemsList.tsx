import { Loader2 } from 'lucide-react';
import { OrderItem } from '../../../types';
import { CartItem } from './CartItem';

interface CartItemsListProps {
	items: OrderItem[];
	isLoading: boolean;
	readOnly?: boolean;
	onEdit?: (item: OrderItem) => void;
	onRemove?: (id: number) => void;
}

export function CartItemsList({ items, isLoading, readOnly = false, onEdit, onRemove }: CartItemsListProps) {
	if (isLoading) {
		return (
			<div className='flex flex-col items-center justify-center py-8'>
				<Loader2 className='w-6 h-6 animate-spin text-blue-600 mb-2' />
				<p className='text-xs text-gray-500'>Savdo mahsulotlari yuklanmoqda...</p>
			</div>
		);
	}

	return (
		<div className='flex-1 overflow-y-auto p-2 space-y-2'>
			{items.map((item, index) => (
				<CartItem
					key={item.id}
					item={item}
					index={index}
					readOnly={readOnly}
					onEdit={onEdit}
					onRemove={onRemove}
				/>
			))}
		</div>
	);
}
