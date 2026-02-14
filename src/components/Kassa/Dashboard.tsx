import { Plus, Eye, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrdersMySelf } from '../../hooks/useOrders';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { OrderResponse } from '../../services/orderService';
import { userService } from '../../services/userService';

interface DashboardProps {
	onNewSale?: () => void;
}

interface ColumnFilters {
	mijoz: string;
	xodim: string;
	zakaz: string;
	tolangan: string;
	qarz: string;
	umumiyQarz: string;
	sana: string;
	holati: '' | 'karzinka' | 'yakunlangan';
}

const defaultFilters: ColumnFilters = {
	mijoz: '',
	xodim: '',
	zakaz: '',
	tolangan: '',
	qarz: '',
	umumiyQarz: '',
	sana: '',
	holati: '',
};

const filterInputClass =
	'w-full rounded-lg bg-gray-50/80 py-1.5 px-2.5 text-xs text-gray-700 placeholder-gray-400 outline-none border-0 shadow-none focus:ring-2 focus:ring-blue-200/60 focus:bg-white transition-colors';
const filterSelectClass =
	'w-full rounded-lg bg-gray-50/80 py-1.5 px-2.5 text-xs text-gray-700 outline-none border-0 shadow-none focus:ring-2 focus:ring-blue-200/60 focus:bg-white transition-colors appearance-none cursor-pointer';

function tolovSummasi(order: OrderResponse): number {
	const n = parseFloat(order.summa_naqt || '0') || 0;
	const k = parseFloat(order.summa_kilik || '0') || 0;
	const t = parseFloat(order.summa_terminal || '0') || 0;
	const tr = parseFloat(order.summa_transfer || '0') || 0;
	const d = parseFloat(order.summa_dollar || '0') || 0;
	return n + k + t + tr + d;
}

export function Dashboard({ onNewSale }: DashboardProps) {
	const navigate = useNavigate();
	const [filters, setFilters] = useState<ColumnFilters>(defaultFilters);

	// Barcha filterlar backend params orqali
	const orderParams = useMemo(() => {
		const today = format(new Date(), 'yyyy-MM-dd');
		const dateFrom = filters.sana.trim() || today;
		const dateTo = filters.sana.trim() || today;
		return {
			date_from: dateFrom,
			date_to: dateTo,
			page_size: 500,
			search: filters.mijoz.trim() || undefined,
			created_by: filters.xodim.trim() ? parseInt(filters.xodim, 10) : undefined,
			is_karzinka:
				filters.holati === 'karzinka' ? true : filters.holati === 'yakunlangan' ? false : undefined,
			all_product_summa_min: (() => {
				const v = parseFloat(filters.zakaz);
				return filters.zakaz.trim() && Number.isFinite(v) ? v : undefined;
			})(),
			total_debt_today_client_min: (() => {
				const v = parseFloat(filters.qarz);
				return filters.qarz.trim() && Number.isFinite(v) ? v : undefined;
			})(),
			total_debt_client_min: (() => {
				const v = parseFloat(filters.umumiyQarz);
				return filters.umumiyQarz.trim() && Number.isFinite(v) ? v : undefined;
			})(),
			summa_total_min: (() => {
				const v = parseFloat(filters.tolangan);
				return filters.tolangan.trim() && Number.isFinite(v) ? v : undefined;
			})(),
		};
	}, [
		filters.mijoz,
		filters.xodim,
		filters.holati,
		filters.zakaz,
		filters.tolangan,
		filters.qarz,
		filters.umumiyQarz,
		filters.sana,
	]);

	const { data: ordersData, isLoading, error } = useOrdersMySelf(orderParams);

	const { data: usersData } = useQuery({
		queryKey: ['users-list'],
		queryFn: () => userService.getUsers({ page_size: 200 }),
		staleTime: 60000,
	});
	const users = usersData?.results || [];

	const rawOrders = ordersData?.results || [];
	const filteredOrders = useMemo(() => rawOrders.filter((o) => !o.is_delete), [rawOrders]);

	const setFilter = (key: keyof ColumnFilters, value: string | '' | 'karzinka' | 'yakunlangan') => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	return (
		<div className='p-3 sm:p-6 min-h-full'>
			<div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 min-h-[400px] border border-gray-100 overflow-hidden'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
					<h2 className='text-2xl sm:text-3xl font-bold text-gray-800'>Savdo ro'yxati</h2>
					<button
						onClick={onNewSale}
						className='px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] font-semibold'
					>
						<Plus size={18} className='mr-2' />
						<span className='hidden sm:inline'>Yangi savdo</span>
						<span className='sm:hidden'>Yangi</span>
					</button>
				</div>

				{isLoading ? (
					<div className='flex justify-center items-center h-64'>
						<Loader2 className='w-8 h-8 animate-spin text-blue-600' />
					</div>
				) : error ? (
					<div className='flex justify-center items-center h-64 text-red-500 text-lg'>Xatolik yuz berdi</div>
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full border-collapse text-sm'>
							<thead>
								<tr className='border-b-2 border-blue-200 bg-blue-50/50'>
									<th className='text-left p-2 font-semibold text-gray-700 whitespace-nowrap w-12'>t/r</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[120px]'>
										<div className='flex flex-col gap-1.5'>
											<span>Mijoz</span>
											<input
												type='text'
												placeholder='Qidirish...'
												value={filters.mijoz}
												onChange={(e) => setFilter('mijoz', e.target.value)}
												className={filterInputClass}
											/>
										</div>
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[120px]'>
										<div className='flex flex-col gap-1.5'>
											<span>Xodim</span>
											<select
												value={filters.xodim}
												onChange={(e) => setFilter('xodim', e.target.value)}
												className={filterSelectClass}
											>
												<option value=''>Barcha xodimlar</option>
												{users.map((u) => (
													<option key={u.id} value={String(u.id)}>
														{u.full_name}
														{u.phone_number ? ` (${u.phone_number})` : ''}
													</option>
												))}
											</select>
										</div>
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										<div className='flex flex-col gap-1.5'>
											<span>Zakaz (summa)</span>
											<input
												type='number'
												placeholder='Min...'
												value={filters.zakaz}
												onChange={(e) => setFilter('zakaz', e.target.value)}
												className={filterInputClass}
											/>
										</div>
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										<div className='flex flex-col gap-1.5'>
											<span>To'langan</span>
											<input
												type='number'
												placeholder='Min...'
												value={filters.tolangan}
												onChange={(e) => setFilter('tolangan', e.target.value)}
												className={filterInputClass}
											/>
										</div>
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[80px]'>
										<div className='flex flex-col gap-1.5'>
											<span>Qarz</span>
											<input
												type='number'
												placeholder='Min...'
												value={filters.qarz}
												onChange={(e) => setFilter('qarz', e.target.value)}
												className={filterInputClass}
											/>
										</div>
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[90px]'>
										<div className='flex flex-col gap-1.5'>
											<span>Umumiy qarz</span>
											<input
												type='number'
												placeholder='Min...'
												value={filters.umumiyQarz}
												onChange={(e) => setFilter('umumiyQarz', e.target.value)}
												className={filterInputClass}
											/>
										</div>
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										<div className='flex flex-col gap-1.5'>
											<span>Sanasi</span>
											<input
												type='text'
												placeholder='yyyy-mm-dd'
												value={filters.sana}
												onChange={(e) => setFilter('sana', e.target.value)}
												className={filterInputClass}
											/>
										</div>
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[110px]'>
										<div className='flex flex-col gap-1.5'>
											<span>Holati</span>
											<select
												value={filters.holati}
												onChange={(e) => setFilter('holati', e.target.value as ColumnFilters['holati'])}
												className={filterSelectClass}
											>
												<option value=''>Barcha holatlar</option>
												<option value='karzinka'>Korzinkada</option>
												<option value='yakunlangan'>Yakunlangan</option>
											</select>
										</div>
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 w-28'>Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredOrders.length === 0 ? (
									<tr>
										<td colSpan={10} className='text-center py-12 text-gray-400'>
											Ma'lumotlar yo'q
										</td>
									</tr>
								) : (
									filteredOrders.map((order, index) => {
										const isKarzinka = order.is_karzinka;
										const orderPath = isKarzinka ? `/order/${order.id}` : `/order/show/${order.id}`;
										const tolangan = tolovSummasi(order);
										return (
											<tr
												key={order.id}
												className='border-b border-gray-100 hover:bg-blue-50/30 transition-colors'
											>
												<td className='p-2 text-gray-500 font-mono'>{index + 1}</td>
												<td className='p-2'>
													<span className='font-medium text-gray-800'>
														{order.client_detail?.full_name || `ID: ${order.client}`}
													</span>
												</td>
												<td className='p-2 text-gray-600'>
													{order.created_by_detail?.full_name ?? order.employee ?? '—'}
												</td>
												<td className='p-2 text-right font-medium text-blue-700'>
													{parseFloat(order.all_product_summa || '0').toLocaleString()}
												</td>
												<td className='p-2 text-right text-gray-700'>
													{tolangan.toLocaleString()}
												</td>
												<td className='p-2 text-right text-gray-700'>
													{parseFloat(order.total_debt_today_client || '0').toLocaleString()}
												</td>
												<td className='p-2 text-right text-gray-700'>
													{parseFloat(order.total_debt_client || '0').toLocaleString()}
												</td>
												<td className='p-2 text-gray-600 whitespace-nowrap'>
													{order.created_time
														? new Date(order.created_time).toLocaleString('uz-UZ', {
																day: '2-digit',
																month: '2-digit',
																year: 'numeric',
																hour: '2-digit',
																minute: '2-digit',
														  })
														: order.date
															? new Date(order.date).toLocaleString('uz-UZ', {
																	day: '2-digit',
																	month: '2-digit',
																	year: 'numeric',
																	hour: '2-digit',
																	minute: '2-digit',
															  })
															: '—'}
												</td>
												<td className='p-2'>
													{isKarzinka ? (
														<span className='px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full border border-yellow-300'>
															Korzinkada
														</span>
													) : (
														<span className='px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-300 inline-flex items-center gap-1'>
															<CheckCircle2 size={12} />
															Yakunlangan
														</span>
													)}
												</td>
												<td className='p-2 text-center'>
													<button
														onClick={() => navigate(orderPath)}
														className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 ${
															isKarzinka
																? 'bg-yellow-500 hover:bg-yellow-600 text-white'
																: 'bg-green-500 hover:bg-green-600 text-white'
														}`}
														title={isKarzinka ? 'Davom etish' : "Ko'rish"}
													>
														{isKarzinka ? <ArrowRight size={18} /> : <Eye size={18} />}
													</button>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
