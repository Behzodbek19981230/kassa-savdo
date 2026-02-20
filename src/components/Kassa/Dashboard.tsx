import { Plus, Eye, Loader2, ArrowRight, CheckCircle2, Edit, Trash2, X } from 'lucide-react';
import { useState, useMemo, Fragment } from 'react';
import { DateRangePicker } from '../ui/date-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOrdersMySelf } from '../../hooks/useOrders';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { OrderResponse } from '../../services/orderService';
import { orderService } from '../../services/orderService';
import { userService } from '../../services/userService';
import { showError, showSuccess } from '../../lib/toast';
import clsx from 'clsx';

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
	holati: '' | 'karzinka' | 'yakunlangan';
}

const defaultFilters: ColumnFilters = {
	mijoz: '',
	xodim: '',
	zakaz: '',
	tolangan: '',
	qarz: '',
	umumiyQarz: '',
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
	const queryClient = useQueryClient();
	const [filters, setFilters] = useState<ColumnFilters>(defaultFilters);
	const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
	const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
	const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [orderToDelete, setOrderToDelete] = useState<any | null>(null);

	// Barcha filterlar backend params orqali
	const orderParams = useMemo(() => {
		const today = format(new Date(), 'yyyy-MM-dd');
		const df = dateFrom ? format(dateFrom, 'yyyy-MM-dd') : today;
		const dt = dateTo ? format(dateTo, 'yyyy-MM-dd') : today;
		return {
			date_from: df,
			date_to: dt,
			page_size: 500,
			search: filters.mijoz.trim() || undefined,
			created_by: filters.xodim.trim() ? parseInt(filters.xodim, 10) : undefined,
			is_karzinka: filters.holati === 'karzinka' ? true : filters.holati === 'yakunlangan' ? false : undefined,
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
		dateFrom,
		dateTo,
	]);

	const { data: ordersData, isLoading, error, refetch } = useOrdersMySelf(orderParams);

	const { data: usersData } = useQuery({
		queryKey: ['users-list'],
		queryFn: () => userService.getUsers({ page_size: 200 }),
		staleTime: 60000,
	});
	const users = usersData?.results || [];

	const groupedResults = ordersData?.results || [];
	const isGroupedByDate = groupedResults.length > 0 && (groupedResults[0] as any).items !== undefined;
	const groups = useMemo(() => {
		if (!isGroupedByDate) {
			return [
				{
					date: null,
					count: groupedResults.length,
					items: groupedResults,
				},
			];
		}
		return groupedResults as Array<any>;
	}, [ordersData]);

	const overallTotals = useMemo(() => {
		let totalCount = 0;
		let totalZakaz = 0;
		let totalTolangan = 0;
		for (const g of groups) {
			const items = (g.items || []).filter((o: any) => !o.is_delete);
			totalCount += items.length;
			for (const o of items) {
				totalZakaz += parseFloat(o.all_product_summa || '0') || 0;
				totalTolangan += tolovSummasi(o as OrderResponse);
			}
		}
		return { totalCount, totalZakaz, totalTolangan };
	}, [groups]);

	const setFilter = (key: keyof ColumnFilters, value: string | '' | 'karzinka' | 'yakunlangan') => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	// Order ni tahrirlash
	const handleEdit = (order: any) => {
		navigate(`/order/update/${order.id}`);
	};

	// Order ni o'chirish modalini ochish
	const handleDeleteClick = (order: any) => {
		setOrderToDelete(order);
		setDeleteModalOpen(true);
	};

	// Order ni o'chirish
	const handleDelete = async () => {
		if (!orderToDelete) return;

		setDeletingOrderId(orderToDelete.id);
		try {
			await orderService.deleteOrder(orderToDelete.id);
			showSuccess("Savdo muvaffaqiyatli o'chirildi");
			// Query ni invalidate qilish va refetch - ro'yxatni yangilash
			queryClient.invalidateQueries({ queryKey: ['orders-my-self'] });
			await refetch();
			setDeleteModalOpen(false);
			setOrderToDelete(null);
		} catch (error: any) {
			console.error('Failed to delete order:', error);
			const errorMessage =
				error?.response?.data?.detail || error?.message || "Savdoni o'chirishda xatolik yuz berdi";
			showError(errorMessage);
		} finally {
			setDeletingOrderId(null);
		}
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
				<div className='mb-4'>
					<DateRangePicker
						dateFrom={dateFrom}
						dateTo={dateTo}
						onDateFromChange={(d) => setDateFrom(d)}
						onDateToChange={(d) => setDateTo(d)}
					/>
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
									<th className='text-left p-2 font-semibold text-gray-700 whitespace-nowrap w-12'>
										t/r
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										<div className='flex flex-col gap-1.5'>
											<span>Sanasi</span>
										</div>
									</th>
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
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[110px]'>
										<div className='flex flex-col gap-1.5'>
											<span>Holati</span>
											<select
												value={filters.holati}
												onChange={(e) =>
													setFilter('holati', e.target.value as ColumnFilters['holati'])
												}
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
								{groups.length === 0 || groups.every((g) => (g.items?.length || 0) === 0) ? (
									<tr>
										<td colSpan={10} className='text-center py-12 text-gray-400'>
											Ma'lumotlar yo'q
										</td>
									</tr>
								) : (
									(() => {
										let rowIndex = 0;
										return groups.map((group, gIdx) => {
											const items = (group.items || []).filter((o: any) => !o.is_delete);
											const sumZakaz = items.reduce(
												(s: number, o: any) =>
													s + (parseFloat(o.all_product_summa || '0') || 0),
												0,
											);
											const sumTolangan = items.reduce(
												(s: number, o: any) => s + tolovSummasi(o as OrderResponse),
												0,
											);
											return (
												<Fragment key={`group-${group.date ?? gIdx}`}>
													<tr className='bg-gray-100'>
														<td className='p-2'>Jami</td>
														<td className='px-2 py-1 font-semibold text-gray-700'>
															{group.date
																? format(new Date(group.date), 'yyyy-MM-dd')
																: 'Barcha sanalar'}
															<span className='ml-2 text-sm text-gray-500'>
																({items.length})
															</span>
														</td>
														<td className='p-2' />
														<td className='p-2 text-right font-semibold text-blue-700'>
															{sumZakaz.toLocaleString()}
														</td>
														<td className='p-2 text-right font-semibold'>
															{sumTolangan.toLocaleString()}
														</td>
														<td className='p-2' />
														<td className='p-2' />
														<td className='p-2' />
														<td className='p-2' />
														<td className='p-2' />
													</tr>

													{items.map((order: any) => {
														const isKarzinka = order.is_karzinka;
														const orderPath = isKarzinka
															? `/order/${order.id}`
															: `/order/show/${order.id}`;
														const tolangan = tolovSummasi(order as OrderResponse);
														const index = ++rowIndex;
														return (
															<tr
																key={order.id}
																className={clsx(
																	'border-b border-gray-100 group hover:bg-blue-50/30 transition-colors',
																	{
																		'bg-red-300': !order.order_status,
																	},
																)}
															>
																<td className='p-2 text-gray-500 font-mono'>{index}</td>
																<td className='p-2 text-gray-600 whitespace-nowrap'>
																	{order.created_time
																		? new Date(order.created_time).toLocaleString(
																				'uz-UZ',
																				{
																					day: '2-digit',
																					month: '2-digit',
																					year: 'numeric',
																					hour: '2-digit',
																					minute: '2-digit',
																				},
																			)
																		: order.date
																			? new Date(order.date).toLocaleString(
																					'uz-UZ',
																					{
																						day: '2-digit',
																						month: '2-digit',
																						year: 'numeric',
																						hour: '2-digit',
																						minute: '2-digit',
																					},
																				)
																			: '—'}
																</td>
																<td className='p-2'>
																	<span className='font-medium text-gray-800'>
																		{order.client_detail?.full_name ||
																			`ID: ${order.client}`}
																	</span>
																</td>
																<td className='p-2 text-gray-600'>
																	{order.created_by_detail?.full_name ??
																		order.employee ??
																		'—'}
																</td>
																<td className='p-2 text-right font-medium text-blue-700'>
																	{parseFloat(
																		order.all_product_summa || '0',
																	).toLocaleString()}
																</td>
																<td className='p-2 text-right text-gray-700'>
																	{tolangan.toLocaleString()}
																</td>
																<td className='p-2 text-right text-gray-700'>
																	{parseFloat(
																		order.total_debt_today_client || '0',
																	).toLocaleString()}
																</td>
																<td className='p-2 text-right text-gray-700'>
																	{parseFloat(
																		order.total_debt_client || '0',
																	).toLocaleString()}
																</td>
																<td className='p-2 group-hover:bg-blue-50/30 transition-colors'>
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
																<td className='p-2 text-center group-hover:bg-blue-50/30 transition-colors'>
																	<div className='flex items-center justify-center gap-1'>
																		{/* Edit button */}
																		{!isKarzinka && (
																			<button
																				onClick={() => handleEdit(order)}
																				className='inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 bg-blue-500 hover:bg-blue-600 text-white'
																				title='Tahrirlash'
																			>
																				<Edit size={16} />
																			</button>
																		)}
																		{/* View/Continue button */}
																		<button
																			onClick={() => navigate(orderPath)}
																			className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 ${
																				isKarzinka
																					? 'bg-yellow-500 hover:bg-yellow-600 text-white'
																					: 'bg-green-500 hover:bg-green-600 text-white'
																			}`}
																			title={
																				isKarzinka ? 'Davom etish' : "Ko'rish"
																			}
																		>
																			{isKarzinka ? (
																				<ArrowRight size={18} />
																			) : (
																				<Eye size={18} />
																			)}
																		</button>
																		{/* Delete button */}
																		<button
																			onClick={() => handleDeleteClick(order)}
																			disabled={deletingOrderId === order.id}
																			className='inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
																			title="O'chirish"
																		>
																			<Trash2 size={16} />
																		</button>
																	</div>
																</td>
															</tr>
														);
													})}
												</Fragment>
											);
										});
									})()
								)}
								{/* overall totals row */}
								<tr className='bg-blue-50'>
									<td className='p-2 font-semibold'>Jami</td>
									<td colSpan={2} />
									<td className='p-2 text-right font-semibold text-blue-700'>
										{overallTotals.totalZakaz.toLocaleString()}
									</td>
									<td className='p-2 text-right font-semibold'>
										{overallTotals.totalTolangan.toLocaleString()}
									</td>
									<td className='p-2 text-right font-semibold'></td>
									<td className='p-2 text-right font-semibold'></td>
									<td colSpan={3} />
								</tr>
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Delete Confirmation Modal */}
			{deleteModalOpen && (
				<div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
					<div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-200'>
						<div className='flex justify-between items-center p-5 border-b-2 border-red-100 bg-gradient-to-r from-red-50 to-pink-50'>
							<h3 className='text-xl font-bold text-gray-900'>Savdoni o'chirish</h3>
							<button
								onClick={() => {
									setDeleteModalOpen(false);
									setOrderToDelete(null);
								}}
								disabled={deletingOrderId !== null}
								className='text-gray-500 hover:text-red-600 hover:bg-white p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								<X size={24} />
							</button>
						</div>

						<div className='p-6 bg-white'>
							<p className='text-gray-700 mb-6'>
								Savdo #{orderToDelete?.id} ni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
							</p>

							<div className='flex gap-3 justify-end'>
								<button
									onClick={() => {
										setDeleteModalOpen(false);
										setOrderToDelete(null);
									}}
									disabled={deletingOrderId !== null}
									className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
								>
									Bekor qilish
								</button>
								<button
									onClick={handleDelete}
									disabled={deletingOrderId !== null}
									className='px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
								>
									{deletingOrderId !== null ? (
										<>
											<Loader2 className='w-4 h-4 animate-spin' />
											<span>O'chirilmoqda...</span>
										</>
									) : (
										<>
											<Trash2 className='w-4 h-4' />
											<span>Ha, o'chirish</span>
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
