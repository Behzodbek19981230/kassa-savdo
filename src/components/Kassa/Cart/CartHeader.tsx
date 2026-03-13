import { User } from 'lucide-react';
import { Customer, OrderResponse } from '../../../types';
import { formatMoney } from '../../../lib/utils';

interface CartHeaderProps {
	selectedCustomer?: Customer | null;
	orderData?: OrderResponse | null;
	totalAmountDollar: number;
	totalAmount: number;
	isVozvratOrder?: boolean;
}

export function CartHeader({
	selectedCustomer,
	orderData,
	totalAmountDollar,
	totalAmount,
	isVozvratOrder = false,
}: CartHeaderProps) {
	const clientDebtValue = orderData?.client_detail?.total_debt ?? orderData?.total_debt_client ?? '0';
	const clientDebtNumber = parseFloat(String(clientDebtValue)) || 0;

	return (
		<div className='p-4 bg-blue-600 border-b border-blue-400 shadow-md'>
			<div className='flex items-center gap-3 flex-wrap'>
				{isVozvratOrder && (
					<h2 className='text-white text-xl font-bold whitespace-pre-wrap'>Tovar qaytarish</h2>
				)}

				{selectedCustomer && (
					<div className='hidden sm:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm shrink-0'>
						<User className='w-4 h-4 text-white/90 shrink-0' />
						<div className='text-xs'>
							<div className='font-semibold whitespace-nowrap text-white'>{selectedCustomer.name}</div>
							{selectedCustomer.phone && (
								<div className='text-[10px] opacity-80 whitespace-nowrap text-white'>
									{selectedCustomer.phone}
								</div>
							)}
						</div>
					</div>
				)}

				{orderData && (
					<div className='ml-3 text-xs text-white/90 shrink-0'>
						<div className='font-semibold text-[12px]'>Qarzdorlik</div>
						<div className='text-sm'>{formatMoney(clientDebtNumber)} UZS</div>
					</div>
				)}

				<div className='text-right shrink-0 ml-auto'>
					<div className='text-xs text-white/80 mb-1'>Jami</div>
					<div className='text-sm sm:text-sm font-bold text-yellow-200 whitespace-nowrap'>
						{formatMoney(totalAmountDollar)} USD ({formatMoney(totalAmount)} UZS)
					</div>
				</div>
			</div>
		</div>
	);
}
