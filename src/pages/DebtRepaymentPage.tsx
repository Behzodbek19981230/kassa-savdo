import { useState, useRef, Fragment, useMemo } from 'react';
import { Loader2, Plus, Trash2, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DateRangePicker } from '../components/ui/date-picker';
import { debtRepaymentService } from '../services/orderService';
import { showError, showSuccess } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import { DebtRepaymentModal } from '../components/Kassa/DebtRepaymentModal';
import { DebtRepaymentReceipt } from '../components/Kassa/DebtRepaymentReceipt';

export function DebtRepaymentPage() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<any | null>(null);
	const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
	const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
	const receiptRef = useRef<HTMLDivElement>(null);

	// React Query bilan ma'lumotlarni olish
	const {
		data: groupedData,
		isLoading,
		error,
	} = useQuery({
		queryKey: [
			'debt-repayments-grouped',
			{
				filial: user?.order_filial,
				dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
				dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
			},
		],
		queryFn: () =>
			debtRepaymentService.getDebtRepaymentsGroupedByDate({
				filial: user?.order_filial || undefined,
				date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
				date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
			}),
		staleTime: 30000, // 30 soniya
		enabled: !!user?.order_filial,
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: (id: number) => debtRepaymentService.deleteDebtRepayment(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['debt-repayments-grouped'] });
			showSuccess("Qarz to'lovi muvaffaqiyatli o'chirildi");
		},
		onError: (error: any) => {
			console.error('Failed to delete debt repayment:', error);
			showError("O'chirishda xatolik");
		},
	});

	const groups = groupedData || [];

	// Overall totals hisoblash
	const overallTotals = useMemo(() => {
		let totalCount = 0;
		let totalPaid = 0;
		let totalOldDebt = 0;
		let totalNewDebt = 0;

		for (const group of groups) {
			const items = group.items || [];
			totalCount += items.length;
			for (const item of items) {
				const paidAmount =
					Number(item.summa_naqt || 0) +
					Number(item.summa_dollar || 0) * Number(item.exchange_rate || 1) +
					Number(item.summa_transfer || 0) +
					Number(item.summa_terminal || 0);
				totalPaid += paidAmount;
				totalOldDebt += Number(item.old_total_debt_client || 0);
				totalNewDebt += Number(item.total_debt_client || 0);
			}
		}

		return { totalCount, totalPaid, totalOldDebt, totalNewDebt };
	}, [groups]);

	const handleDelete = async (id: number) => {
		if (!confirm("Qarz to'lovini o'chirishni tasdiqlaysizmi?")) return;
		deleteMutation.mutate(id);
	};

	const handleDownload = (item: any) => {
		setSelectedItem(item);
		// Small delay to ensure state is set before printing
		setTimeout(() => {
			if (receiptRef.current) {
				handlePrint();
			}
		}, 100);
	};

	const handlePrint = useReactToPrint({
		contentRef: receiptRef,
		documentTitle: `Qarz-hisobi-${selectedItem?.id || 'unknown'}`,
		pageStyle: `
            @page {
                size: A4 landscape;
                margin: 10mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `,
	});

	const handleModalSuccess = () => {
		queryClient.invalidateQueries({ queryKey: ['debt-repayments-grouped'] });
	};

	return (
		<div className='h-full flex flex-col p-4 sm:p-6'>
			<div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 min-h-[400px] border border-gray-100 overflow-hidden flex-1 flex flex-col'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
					<h2 className='text-2xl sm:text-3xl font-bold text-gray-800'>To'langan qarzlar</h2>
					<div className='flex items-center gap-3'>
						<DateRangePicker
							dateFrom={dateFrom}
							dateTo={dateTo}
							onDateFromChange={(d) => setDateFrom(d)}
							onDateToChange={(d) => setDateTo(d)}
						/>

						<button
							onClick={() => setIsModalOpen(true)}
							className='px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] font-semibold'
						>
							<Plus size={18} className='mr-2' />
							<span className='hidden sm:inline'>Qarz to'lash</span>
							<span className='sm:hidden'>Qarz to'lash</span>
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
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										Eski qarz
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										Yangi qarz
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										To'landi
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[110px]'>Status</th>
									<th className='text-left p-2 font-semibold text-gray-700 w-28'>Actions</th>
								</tr>
							</thead>
							<tbody>
								{groups.length === 0 || groups.every((g) => (g.items?.length || 0) === 0) ? (
									<tr>
										<td colSpan={8} className='text-center py-12 text-gray-400'>
											Ma'lumotlar yo'q
										</td>
									</tr>
								) : (
									(() => {
										let rowIndex = 0;
										return groups.map((group, gIdx) => {
											const items = group.items || [];
											const sumOldDebt = items.reduce(
												(s: number, item: any) => s + Number(item.old_total_debt_client || 0),
												0,
											);
											const sumNewDebt = items.reduce(
												(s: number, item: any) => s + Number(item.total_debt_client || 0),
												0,
											);
											const sumPaid = items.reduce((s: number, item: any) => {
												const paidAmount =
													Number(item.summa_naqt || 0) +
													Number(item.summa_dollar || 0) * Number(item.exchange_rate || 1) +
													Number(item.summa_transfer || 0) +
													Number(item.summa_terminal || 0);
												return s + paidAmount;
											}, 0);

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
															{sumOldDebt.toLocaleString()} UZS
														</td>
														<td className='p-2 text-right font-semibold text-blue-700'>
															{sumNewDebt.toLocaleString()} UZS
														</td>
														<td className='p-2 text-right font-semibold text-green-700'>
															{sumPaid.toLocaleString()} UZS
														</td>
														<td className='p-2' />
														<td className='p-2' />
													</tr>

													{items.map((item: any) => {
														const paidAmount =
															Number(item.summa_naqt || 0) +
															Number(item.summa_dollar || 0) *
																Number(item.exchange_rate || 1) +
															Number(item.summa_transfer || 0) +
															Number(item.summa_terminal || 0);
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
																		{item.client_detail?.full_name ||
																			`ID: ${item.client}`}
																	</span>
																</td>
																<td className='p-2 text-gray-800 text-left'>
																	{Number(
																		item.old_total_debt_client || 0,
																	).toLocaleString()}{' '}
																	UZS
																</td>
																<td className='p-2 text-gray-800 text-left'>
																	{Number(
																		item.total_debt_client || 0,
																	).toLocaleString()}{' '}
																	UZS
																</td>
																<td className='p-2 font-semibold text-gray-900 text-left'>
																	{paidAmount.toLocaleString()} UZS
																</td>
																<td className='p-2'>
																	<span
																		className={`px-2 py-1 rounded-full text-xs font-semibold ${
																			item.debt_status
																				? 'bg-green-100 text-green-700'
																				: 'bg-yellow-100 text-yellow-700'
																		}`}
																	>
																		{item.debt_status ? "To'langan" : 'Kutilmoqda'}
																	</span>
																</td>
																<td className='p-2'>
																	<div className='flex items-center gap-1'>
																		<button
																			onClick={() => handleDownload(item)}
																			className='p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors'
																			title='Yuklab olish'
																		>
																			<Download size={16} />
																		</button>
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
										<td colSpan={2} />
										<td className='p-2 text-right font-semibold text-blue-700'>
											{overallTotals.totalOldDebt.toLocaleString()} UZS
										</td>
										<td className='p-2 text-right font-semibold text-blue-700'>
											{overallTotals.totalNewDebt.toLocaleString()} UZS
										</td>
										<td className='p-2 text-right font-semibold text-green-700'>
											{overallTotals.totalPaid.toLocaleString()} UZS
										</td>
										<td colSpan={2} />
									</tr>
								)}
							</tbody>
						</table>
					)}
				</div>
			</div>

			{/* Debt Repayment Modal */}
			<DebtRepaymentModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSuccess={handleModalSuccess}
			/>

			{/* Hidden Receipt for Printing */}
			{selectedItem && (
				<div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
					<div ref={receiptRef}>
						<DebtRepaymentReceipt
							date={selectedItem.date}
							clientName={selectedItem.client_detail?.full_name || `ID: ${selectedItem.client}`}
							filialName={
								selectedItem.filial_detail?.name || user?.order_filial_detail?.name || 'Elegant'
							}
							exchangeRate={Number(selectedItem.exchange_rate || 12350)}
							filialAddress={selectedItem.filial_detail?.address || user?.order_filial_detail?.address}
							filialPhone={
								selectedItem.filial_detail?.phone_number || user?.order_filial_detail?.phone_number
							}
							filialLogo={selectedItem.filial_detail?.logo || user?.order_filial_detail?.logo}
							oldDebt={
								Number(selectedItem.old_total_debt_client || 0) /
								Number(selectedItem.exchange_rate || 12350)
							}
							paidAmountDollar={Number(selectedItem.summa_dollar || 0)}
							totalPaidAmountDollar={
								(Number(selectedItem.summa_naqt || 0) +
									Number(selectedItem.summa_dollar || 0) *
										Number(selectedItem.exchange_rate || 12350) +
									Number(selectedItem.summa_transfer || 0) +
									Number(selectedItem.summa_terminal || 0)) /
								Number(selectedItem.exchange_rate || 12350)
							}
							remainingDebt={
								Number(selectedItem.total_debt_client || 0) /
								Number(selectedItem.exchange_rate || 12350)
							}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
