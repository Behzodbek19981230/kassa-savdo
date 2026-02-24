import { useState, Fragment, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Eye, Edit, Trash2, Search, RotateCcw } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DateRangePicker } from '../ui/date-picker';
import { vozvratOrderService } from '../../services/orderService';
import { showError, showSuccess } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';

export function VozvratOrderList() {
	const today = new Date();
	const oneMonthAgo = new Date(today);
	oneMonthAgo.setMonth(today.getMonth() - 1);
	const { user } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [draftDateFrom, setDraftDateFrom] = useState<Date | undefined>(oneMonthAgo);
	const [draftDateTo, setDraftDateTo] = useState<Date | undefined>(today);
	const [appliedDateFrom, setAppliedDateFrom] = useState<Date | undefined>(oneMonthAgo);
	const [appliedDateTo, setAppliedDateTo] = useState<Date | undefined>(today);

	// React Query bilan ma'lumotlarni olish
	const {
		data: groupedData,
		isLoading,
		error,
	} = useQuery({
		queryKey: [
			'vozvrat-orders-grouped',
			{
				filial: user?.order_filial,
				dateFrom: appliedDateFrom ? format(appliedDateFrom, 'yyyy-MM-dd') : undefined,
				dateTo: appliedDateTo ? format(appliedDateTo, 'yyyy-MM-dd') : undefined,
			},
		],
		queryFn: () =>
			vozvratOrderService.getVozvratOrdersGroupedByDate({
				filial: user?.order_filial || undefined,
				date_from: appliedDateFrom ? format(appliedDateFrom, 'yyyy-MM-dd') : undefined,
				date_to: appliedDateTo ? format(appliedDateTo, 'yyyy-MM-dd') : undefined,
			}),
		staleTime: 30000, // 30 soniya
		enabled: !!user?.order_filial,
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: (id: number) => vozvratOrderService.deleteVozvratOrder(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['vozvrat-orders-grouped'] });
			showSuccess("Tovar qaytarish muvaffaqiyatli o'chirildi");
		},
		onError: (error: any) => {
			console.error('Failed to delete vozvrat order:', error);
			showError("O'chirishda xatolik");
		},
	});

	const groups = groupedData || [];

	// Overall totals hisoblash
	const overallTotals = useMemo(() => {
		let totalCount = 0;
		let totalSumma = 0;

		for (const group of groups) {
			const items = group.items || [];
			totalCount += items.length;
			for (const item of items) {
				totalSumma += parseFloat(item.summa_total_dollar || '0');
			}
		}

		return { totalCount, totalSumma };
	}, [groups]);

	const handleDelete = async (id: number) => {
		if (!confirm("Tovar qaytarishni o'chirishni tasdiqlaysizmi?")) return;
		deleteMutation.mutate(id);
	};

	const handleView = (id: number) => {
		navigate(`/tovar-qaytarish/show/${id}`);
	};

	const handleEdit = (id: number) => {
		navigate(`/tovar-qaytarish/update/${id}`);
	};

	const handleNewReturn = () => {
		navigate('/tovar-qaytarish/new');
	};

	return (
		<div className='h-full flex flex-col p-4 sm:p-6'>
			<div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 min-h-[400px] border border-gray-100 overflow-hidden flex-1 flex flex-col'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
					<h2 className='text-2xl sm:text-3xl font-bold text-gray-800'>Tovar qaytarish</h2>
					<div className='flex items-center gap-3'>
						<DateRangePicker
							dateFrom={draftDateFrom}
							dateTo={draftDateTo}
							onDateFromChange={(d) => setDraftDateFrom(d)}
							onDateToChange={(d) => setDraftDateTo(d)}
						/>

						<div className='flex items-center gap-2'>
							<button
								onClick={() => {
									setAppliedDateFrom(draftDateFrom);
									setAppliedDateTo(draftDateTo);
								}}
								className='h-9 px-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-semibold flex items-center'
							>
								<Search size={14} className='mr-2' />
								<span>Filter</span>
							</button>

							<button
								onClick={() => {
									const defaultFrom = oneMonthAgo;
									const defaultTo = today;
									setDraftDateFrom(defaultFrom);
									setDraftDateTo(defaultTo);
									setAppliedDateFrom(defaultFrom);
									setAppliedDateTo(defaultTo);
								}}
								className='h-9 px-3 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-200 flex items-center gap-2'
							>
								<RotateCcw size={14} />
								<span>Tozalash</span>
							</button>
						</div>

						<button
							onClick={handleNewReturn}
							className='px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] font-semibold'
						>
							<Plus size={18} className='mr-2' />
							<span className='hidden sm:inline'>Qaytarish</span>
							<span className='sm:hidden'>Qaytarish</span>
						</button>
					</div>
				</div>

				{/* Table */}
				<div className='flex-1 overflow-x-auto'>
					{isLoading ? (
						<div className='flex justify-center items-center h-64'>
							<Loader2 className='w-8 h-8 animate-spin text-blue-600' />
						</div>
					) : error ? (
						<div className='flex justify-center items-center h-64'>
							<p className='text-red-600'>Ma'lumotlarni yuklashda xatolik yuz berdi</p>
						</div>
					) : (
						<table className='w-full border-collapse text-sm'>
							<thead>
								<tr className='border-b-2 border-blue-200 bg-blue-50/50'>
									<th className='text-left p-2 font-semibold text-gray-700 whitespace-nowrap w-12'>
										t/r
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>Sanasi</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[120px]'>Mijoz</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[120px]'>Telefon</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										Jami ($)
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[110px]'>Holati</th>
									<th className='text-left p-2 font-semibold text-gray-700 w-28'>Actions</th>
								</tr>
							</thead>
							<tbody>
								{groups.length === 0 || groups.every((g) => (g.items?.length || 0) === 0) ? (
									<tr>
										<td colSpan={7} className='text-center py-12 text-gray-400'>
											Ma'lumotlar yo'q
										</td>
									</tr>
								) : (
									(() => {
										let rowIndex = 0;
										return groups.map((group, gIdx) => {
											const items = group.items || [];
											const sumTotal = items.reduce(
												(s: number, item: any) =>
													s + parseFloat(item.summa_total_dollar || '0'),
												0,
											);

											return (
												<Fragment key={`group-${group.date ?? gIdx}`}>
													<tr className='bg-gray-100'>
														<td className='p-2'></td>
														<td className='px-2 py-1 font-semibold text-gray-700'>
															{group.date
																? format(new Date(group.date), 'yyyy-MM-dd')
																: 'Barcha sanalar'}
														</td>
														<td className='p-2' />
														<td className='p-2' />
														<td className='p-2 text-left font-semibold text-blue-700'>
															{sumTotal.toFixed(2)} $
														</td>
														<td className='p-2' />
														<td className='p-2' />
													</tr>

													{items.map((item: any) => {
														const index = ++rowIndex;
														return (
															<tr
																key={item.id}
																className='border-b border-gray-100 group hover:bg-blue-50/30 transition-colors'
															>
																<td className='p-2 text-gray-500 font-mono'>{index}</td>
																<td className='p-2 text-gray-600 whitespace-nowrap'>
																	{item.date
																		? format(new Date(item.date), 'dd.MM.yyyy')
																		: '-'}
																</td>
																<td className='p-2'>
																	<span className='font-medium text-gray-800'>
																		{item.client_detail?.full_name || '-'}
																	</span>
																</td>
																<td className='p-2 text-gray-600'>
																	{item.client_detail?.phone_number || '-'}
																</td>
																<td className='p-2 font-semibold text-gray-900'>
																	{parseFloat(item.summa_total_dollar || '0').toFixed(
																		2,
																	)}{' '}
																	$
																</td>
																<td className='p-2'>
																	<span
																		className={`px-2 py-1 rounded-full text-xs font-semibold ${
																			item.is_karzinka
																				? 'bg-yellow-100 text-yellow-700'
																				: 'bg-green-100 text-green-700'
																		}`}
																	>
																		{item.is_karzinka
																			? 'Korzinkada'
																			: 'Yakunlangan'}
																	</span>
																</td>
																<td className='p-2'>
																	<div className='flex items-center gap-1'>
																		<button
																			onClick={() => handleView(item.id)}
																			className='p-1.5 rounded hover:bg-indigo-100 text-indigo-600 transition-colors'
																			title="Ko'rish"
																		>
																			<Eye size={16} />
																		</button>
																		{item.is_karzinka && (
																			<button
																				onClick={() => handleEdit(item.id)}
																				className='p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors'
																				title='Tahrirlash'
																			>
																				<Edit size={16} />
																			</button>
																		)}
																		<button
																			onClick={() => handleDelete(item.id)}
																			disabled={
																				deleteMutation.isPending &&
																				deleteMutation.variables === item.id
																			}
																			className='p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50'
																			title="O'chirish"
																		>
																			{deleteMutation.isPending &&
																			deleteMutation.variables === item.id ? (
																				<Loader2
																					size={16}
																					className='animate-spin'
																				/>
																			) : (
																				<Trash2 size={16} />
																			)}
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
								{/* Overall totals row */}
								{groups.length > 0 && overallTotals.totalCount > 0 && (
									<tr className='bg-blue-50'>
										<td className='p-2 font-semibold'>Jami</td>
										<td colSpan={3} />
										<td className='p-2 text-left font-semibold text-blue-700'>
											{overallTotals.totalSumma.toFixed(2)} $
										</td>
										<td colSpan={2} />
									</tr>
								)}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
}
