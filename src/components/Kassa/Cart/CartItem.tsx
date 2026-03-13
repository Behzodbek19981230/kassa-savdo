import { Trash2, Edit2 } from 'lucide-react';
import { OrderItem } from '../../../types';
import { formatMoney } from '../../../lib/utils';

interface CartItemProps {
	item: OrderItem;
	index: number;
	readOnly?: boolean;
	onEdit?: (item: OrderItem) => void;
	onRemove?: (id: number) => void;
}

export function CartItem({ item, index, readOnly = false, onEdit, onRemove }: CartItemProps) {
	return (
		<div className='bg-white p-2 rounded-lg shadow-sm hover:shadow-md border border-blue-100 flex items-center gap-2 transition-all duration-200'>
			{/* Index */}
			<div className='w-6 h-6 text-center font-bold text-blue-600 text-[10px] bg-blue-100 rounded flex items-center justify-center shrink-0'>
				{index + 1}
			</div>

			{/* Quantity Display */}
			<div className='text-center flex items-center justify-center border border-blue-200 rounded-md px-1.5 py-0.5 bg-blue-50 text-[10px] font-semibold text-blue-700 shrink-0 whitespace-nowrap'>
				{item.count} {item.size_detail?.unit_code || 'dona'}
			</div>

			{/* Product Details */}
			<div className='flex-1 px-1.5 min-w-0'>
				<div className='flex flex-wrap gap-1'>
					<span className='text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded'>
						Narxi: {item.price_dollar} $
					</span>
					{item.branch_category_detail?.name && (
						<span className='text-[10px] text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded'>
							Kategoriya: {item.branch_category_detail?.name}
						</span>
					)}
					{item.model_detail?.name && (
						<span className='text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded'>
							Modeli: {item.model_detail?.name}
						</span>
					)}
					{item.type_detail?.name && (
						<span className='text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded'>
							Turi: {item.type_detail?.name}
						</span>
					)}
					{item.size_detail?.size && (
						<span className='text-[10px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded'>
							O'lchami: {item.size_detail?.size} {item.size_detail?.unit_code || ''}
						</span>
					)}
				</div>
			</div>

			{/* Total & Actions */}
			<div className='flex items-center gap-1.5 shrink-0'>
				<div className='text-right'>
					<div className='font-bold text-blue-700 text-xs whitespace-nowrap'>
						{formatMoney(Number(item.price_dollar ?? 0) * Number(item.count ?? 0))} $
					</div>
					<div className='text-[10px] text-gray-500'>
						{formatMoney(Number(item.price_sum ?? 0) * Number(item.count ?? 0))} UZS
					</div>
				</div>
				{!readOnly && (
					<>
						{onEdit && (
							<button
								onClick={() => onEdit(item)}
								className='text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors shrink-0'
								title='Tahrirlash'
							>
								<Edit2 size={14} />
							</button>
						)}
						{onRemove && (
							<button
								onClick={() => onRemove(item.id)}
								className='text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors shrink-0'
								title="O'chirish"
							>
								<Trash2 size={14} />
							</button>
						)}
					</>
				)}
			</div>
		</div>
	);
}
