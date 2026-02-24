import { useState, useMemo, Fragment } from 'react';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DateRangePicker } from '../components/ui/date-picker';
import { expenseService } from '../services/expenseService';
import { showError, showSuccess } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import ExpenseModal from '../components/Kassa/ExpenseModal';

export function ExpensePage() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editItem, setEditItem] = useState<any | null>(null);
	const today = new Date();
	const oneMonthAgo = new Date(today);
	oneMonthAgo.setMonth(today.getMonth() - 1);
	const [dateFrom, setDateFrom] = useState<Date | undefined>(oneMonthAgo);
	const [dateTo, setDateTo] = useState<Date | undefined>(today);

	const {
		data: groupedData,
		isLoading,
		error,
	} = useQuery({
		queryKey: [
			'expenses-grouped',
			{
				filial: user?.order_filial,
				dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
				dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
			},
		],
		queryFn: () =>
			expenseService.getExpensesGroupedByDate({
				filial: user?.order_filial || undefined,
				date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
				date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
			}),
		staleTime: 30000,
		enabled: !!user?.order_filial,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => expenseService.deleteExpense(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['expenses-grouped'] });
			showSuccess('Xarajat o‘chirildi');
		},
		onError: (err: any) => {
			console.error('Failed to delete expense:', err);
			showError("O'chirishda xatolik");
		},
	});

	const groups = Array.isArray(groupedData) ? groupedData : (groupedData?.results ?? groupedData ?? []);

	const overallTotals = useMemo(() => {
		let totalCount = 0;
		let totalSumDollar = 0;
		let totalSumNaqt = 0;
		let totalTerminal = 0;

		for (const group of groups) {
			const items = group.items || [];
			totalCount += items.length;
			for (const item of items) {
				totalSumDollar += Number(item.summa_total_dollar || 0);
				totalSumNaqt += Number(item.summa_naqt || 0);
				totalTerminal += Number(item.summa_terminal || 0);
			}
		}

		return { totalCount, totalSumDollar, totalSumNaqt, totalTerminal };
	}, [groups]);

	const handleDelete = (id: number) => {
		if (!confirm("Xarajatni o'chirishni tasdiqlaysizmi?")) return;
		deleteMutation.mutate(id);
	};

	const openCreate = () => {
		setEditItem(null);
		setIsModalOpen(true);
	};

	const openEdit = (item: any) => {
		setEditItem(item);
		setIsModalOpen(true);
	};

	return (
		<div className='h-full flex flex-col p-4 sm:p-6'>
			<div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 min-h-[400px] border border-gray-100 overflow-hidden flex-1 flex flex-col'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
					<h2 className='text-2xl sm:text-3xl font-bold text-gray-800'>Xarajatlar</h2>
					<div className='flex items-center gap-3'>
						<DateRangePicker
							dateFrom={dateFrom}
							dateTo={dateTo}
							onDateFromChange={(d) => setDateFrom(d)}
							onDateToChange={(d) => setDateTo(d)}
						/>

						<button
							onClick={openCreate}
							className='px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] font-semibold'
						>
							<Plus size={18} className='mr-2' />
							<span className='hidden sm:inline'>Qo'shish</span>
							<span className='sm:hidden'>Qo'sh</span>
						</button>
					</div>
				</div>

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
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[120px]'>
										Kategoriya
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>Oylik</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[150px]'>Hodim</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										Jami ($)
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										Naqd (UZS)
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										Terminal
									</th>
									<th className='text-left p-2 font-semibold text-gray-700'>Izoh</th>
									<th className='text-left p-2 font-semibold text-gray-700 w-28'>Actions</th>
								</tr>
							</thead>
							<tbody>
								{groups.length === 0 || groups.every((g: any) => (g.items?.length || 0) === 0) ? (
									<tr>
										<td colSpan={10} className='text-center py-12 text-gray-400'>
											Ma'lumotlar yo'q
										</td>
									</tr>
								) : (
									(() => {
										let rowIndex = 0;
										return groups.map((group: any, gIdx: number) => {
											const items = group.items || [];
											const sumDollar = items.reduce(
												(s: number, item: any) => s + Number(item.summa_total_dollar || 0),
												0,
											);
											const sumNaqt = items.reduce(
												(s: number, item: any) => s + Number(item.summa_naqt || 0),
												0,
											);
											const sumTerminal = items.reduce(
												(s: number, item: any) => s + Number(item.summa_terminal || 0),
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
															<span className='ml-2 text-sm text-gray-500'>
																({items.length})
															</span>
														</td>
														<td className='p-2' />
														<td className='p-2' />
														<td className='p-2' />
														<td className='p-2 text-left font-semibold text-blue-700'>
															{sumDollar.toLocaleString()} $
														</td>
														<td className='p-2 text-left font-semibold text-blue-700'>
															{sumNaqt.toLocaleString()} UZS
														</td>
														<td className='p-2 text-left font-semibold text-blue-700'>
															{sumTerminal.toLocaleString()} UZS
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
																		{item.category_detail?.name || '-'}
																	</span>
																</td>
																<td className='p-2'>
																	{item.is_salary ? (
																		<span className='px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold'>
																			Ha
																		</span>
																	) : (
																		<span className='px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold'>
																			Yo'q
																		</span>
																	)}
																</td>
																<td className='p-2'>
																	{item.employee_detail ? (
																		<span className='font-medium text-gray-800'>
																			{item.employee_detail.full_name}
																			{item.employee_detail.phone_number ? (
																				<span className='text-gray-500 text-xs ml-1'>
																					({item.employee_detail.phone_number}
																					)
																				</span>
																			) : null}
																		</span>
																	) : (
																		<span className='text-gray-400'>-</span>
																	)}
																</td>
																<td className='p-2 text-gray-800 text-left'>
																	{Number(
																		item.summa_total_dollar || 0,
																	).toLocaleString()}{' '}
																	$
																</td>
																<td className='p-2 text-gray-800 text-left'>
																	{Number(item.summa_naqt || 0).toLocaleString()} UZS
																</td>
																<td className='p-2 text-gray-800 text-left'>
																	{Number(item.summa_terminal || 0).toLocaleString()}{' '}
																	UZS
																</td>
																<td className='p-2 text-gray-700'>
																	{item.note || '-'}
																</td>
																<td className='p-2'>
																	<div className='flex items-center gap-1'>
																		<button
																			onClick={() => openEdit(item)}
																			className='p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors'
																		>
																			<Edit size={16} />
																		</button>
																		<button
																			onClick={() => handleDelete(item.id)}
																			className='p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50'
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

								{groups.length > 0 && overallTotals.totalCount > 0 && (
									<tr className='bg-blue-50'>
										<td className='p-2 font-semibold'>Jami</td>
										<td colSpan={4} />
										<td className='p-2 text-left font-semibold text-blue-700'>
											{overallTotals.totalSumDollar.toLocaleString()} $
										</td>
										<td className='p-2 text-left font-semibold text-blue-700'>
											{overallTotals.totalSumNaqt.toLocaleString()} UZS
										</td>
										<td className='p-2 text-left font-semibold text-blue-700'>
											{overallTotals.totalTerminal.toLocaleString()} UZS
										</td>
										<td colSpan={2} />
									</tr>
								)}
							</tbody>
						</table>
					)}
				</div>
			</div>

			<ExpenseModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				initialData={editItem}
				onSuccess={() => queryClient.invalidateQueries({ queryKey: ['expenses-grouped'] })}
			/>
		</div>
	);
}

export default ExpensePage;
