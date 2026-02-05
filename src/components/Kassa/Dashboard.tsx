import { Plus, Eye, Trash2 } from 'lucide-react';
import { DatePicker } from '../ui/DatePicker';
import { useState, useEffect } from 'react';
import { useSales } from '../../contexts/SalesContext';
import { Sale } from './types';

interface DashboardProps {
	onNewSale?: () => void;
}

export function Dashboard({ onNewSale }: DashboardProps) {
	const { sales, getSalesByDateRange } = useSales();
	const [startDate, setStartDate] = useState<Date | undefined>(new Date());
	const [endDate, setEndDate] = useState<Date | undefined>(new Date());
	const [filteredSales, setFilteredSales] = useState<Sale[]>([]);

	useEffect(() => {
		const filtered = getSalesByDateRange(startDate, endDate);
		setFilteredSales(filtered);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sales, startDate, endDate]);

	return (
		<div className='p-6 min-h-full'>
			<div className='bg-white rounded-2xl shadow-xl p-6 min-h-[400px] border border-gray-100'>
				<div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
					<h2 className='text-3xl font-bold text-gray-800'>Savdo ro'yxati</h2>
					<div className='flex flex-wrap items-center gap-3'>
						<div className='flex items-center gap-2'>
							<DatePicker
								date={startDate}
								onDateChange={setStartDate}
								placeholder='Dan'
							/>
							<span className='text-gray-400'>—</span>
							<DatePicker
								date={endDate}
								onDateChange={setEndDate}
								placeholder='Gacha'
							/>
						</div>
						<button className='px-5 py-2.5 border-2 border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 flex items-center text-blue-700 font-medium transition-all duration-200'>
							<span className='mr-2'>🔍</span> Saralash
						</button>
						<button
							onClick={onNewSale}
							className='px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 flex items-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] font-semibold'
						>
							<Plus size={18} className='mr-2' />
							Yangi savdo
						</button>
					</div>
				</div>

				{/* Sales List */}
				{filteredSales.length > 0 ? (
					<div className='space-y-1.5'>
						{filteredSales.map((sale) => (
							<div
								key={sale.id}
								className='bg-white border border-blue-200 rounded-lg px-3 py-2 hover:shadow-md transition-all duration-200 flex items-center gap-3 flex-wrap'
							>
								<span className='text-gray-500 font-mono text-xs shrink-0'>#{sale.orderNumber.slice(-4)}</span>
								<span className='font-semibold text-gray-900 text-sm shrink-0'>{sale.orderNumber}</span>
								<span className='text-xs text-gray-500 shrink-0'>
									{new Date(sale.date).toLocaleString('uz-UZ', {
										day: '2-digit',
										month: '2-digit',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit',
									})}
								</span>
								<span className='text-gray-400'>|</span>
								<span className='text-xs text-gray-600'>
									<span className='text-gray-500'>Mijoz:</span>{' '}
									{sale.customer?.name || 'Umumiy'}
								</span>
								<span className='text-gray-400'>|</span>
								<span className='text-xs text-gray-600'>
									<span className='text-gray-500'>Sotuvchi:</span>{' '}
									{sale.kassirName || "Noma'lum"}
								</span>
								<span className='text-gray-400'>|</span>
								<span className='text-xs text-gray-600'>
									<span className='text-gray-500'>{sale.items.length} ta</span>
								</span>
								<span className='flex-1 min-w-0' />
								<span className='font-bold text-blue-700 text-sm shrink-0'>
									{sale.totalAmount.toLocaleString()} UZS
								</span>
								<div className='flex items-center gap-1 shrink-0'>
									<button
										className='p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors'
										title="Ko'rish"
									>
										<Eye size={16} />
									</button>
									<button
										className='p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors'
										title="O'chirish"
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='flex justify-center items-center h-64 text-gray-400 text-lg'>Ma'lumotlar yo'q</div>
				)}
			</div>
		</div>
	);
}
