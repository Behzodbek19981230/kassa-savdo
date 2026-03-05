import { useState, useMemo, Fragment } from 'react';
import { Loader2, Plus, Trash2, Edit, Search, RotateCcw, X, Pencil } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DateRangePicker } from '../components/ui/date-picker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/Select';
import { Autocomplete } from '../components/ui/Autocomplete';
import { userService } from '../services/userService';
import api from '../services/api';
import { expenseService } from '../services/expenseService';
import { showError, showSuccess } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import ExpenseModal from '../components/Kassa/ExpenseModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Expense, ExpenseGroup } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ExpensePage() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editItem, setEditItem] = useState<any | null>(null);
	const [viewItem, setViewItem] = useState<any | null>(null);
	const today = new Date();
	const oneMonthAgo = new Date(today);
	oneMonthAgo.setMonth(today.getMonth() - 1);
	const [draftDateFrom, setDraftDateFrom] = useState<Date | undefined>(oneMonthAgo);
	const [draftDateTo, setDraftDateTo] = useState<Date | undefined>(today);
	const [appliedDateFrom, setAppliedDateFrom] = useState<Date | undefined>(oneMonthAgo);
	const [appliedDateTo, setAppliedDateTo] = useState<Date | undefined>(today);

	const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
	const [isLoadingCategories, setIsLoadingCategories] = useState(false);
	const [draftCategory, setDraftCategory] = useState<number | null>(null);
	const [appliedCategory, setAppliedCategory] = useState<number | null>(null);
	// Employee filter
	const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
	const [appliedEmployeeId, setAppliedEmployeeId] = useState<number | null>(null);
	const [employeeOptions, setEmployeeOptions] = useState<{ id: string; label: string; value: string }[]>([]);

	// Load categories once
	useMemo(() => {
		let mounted = true;
		(async () => {
			setIsLoadingCategories(true);
			try {
				const res = await api.get('/v1/expense-category');
				const data = res.data;
				const list = Array.isArray(data) ? data : (data?.results ?? data);
				if (!mounted) return;
				setCategories(Array.isArray(list) ? list.map((c: any) => ({ id: c.id, name: c.name })) : []);
			} catch (err) {
				console.error('Failed to load expense categories', err);
			} finally {
				setIsLoadingCategories(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);
	const formatCurrency = (value: string | number | undefined) => {
		if (!value) return '0.00';
		const num = typeof value === 'string' ? parseFloat(value) : value;
		return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
	};
	const {
		data: groupedData,
		isLoading,
		error,
	} = useQuery({
		queryKey: [
			'expenses-grouped',
			{
				filial: user?.order_filial,
				dateFrom: appliedDateFrom ? format(appliedDateFrom, 'yyyy-MM-dd') : undefined,
				dateTo: appliedDateTo ? format(appliedDateTo, 'yyyy-MM-dd') : undefined,
				category: appliedCategory ?? undefined,
				employee: appliedEmployeeId ?? undefined,
			},
		],
		queryFn: () =>
			expenseService.getExpensesGroupedByDate({
				filial: user?.order_filial || undefined,
				date_from: appliedDateFrom ? format(appliedDateFrom, 'yyyy-MM-dd') : undefined,
				date_to: appliedDateTo ? format(appliedDateTo, 'yyyy-MM-dd') : undefined,
				category: appliedCategory ?? undefined,
				employee: appliedEmployeeId ?? undefined,
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

		for (const group of groups) {
			const items = group.items || [];
			totalCount += items.length;
			for (const item of items) {
				totalSumDollar += Number(item.summa_total_dollar || 0);
			}
		}

		return { totalCount, totalSumDollar };
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
		<div className='h-full flex flex-col p-2 sm:p-3'>
			<div className='bg-white rounded-xl shadow-xl p-2 sm:p-3 min-h-[400px] border border-gray-100 overflow-hidden flex-1 flex flex-col'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
					<h2 className='text-xl sm:text-2xl font-bold text-gray-800'>Xarajatlar</h2>
					<div className='flex items-center gap-3'>
						<DateRangePicker
							dateFrom={draftDateFrom}
							dateTo={draftDateTo}
							onDateFromChange={(d) => setDraftDateFrom(d)}
							onDateToChange={(d) => setDraftDateTo(d)}
						/>

						<div className='w-56'>
							<Autocomplete
								options={employeeOptions}
								value={selectedEmployeeId ? String(selectedEmployeeId) : ''}
								onChange={(v) => setSelectedEmployeeId(v ? Number(v) : null)}
								onSearchChange={async (q) => {
									const res = await userService.getUsers({ search: q || '', limit: 100 });
									const items = res.results || [];
									setEmployeeOptions(
										items.map((u: any) => ({
											id: String(u.id),
											label: u.full_name || u.username || `ID:${u.id}`,
											value: String(u.id),
										})),
									);
								}}
								placeholder="Xodim bo'yicha filtrlash"
							/>
						</div>

						<Select
							value={draftCategory ? String(draftCategory) : 'all'}
							onValueChange={(v) => setDraftCategory(v && v !== 'all' ? Number(v) : null)}
						>
							<SelectTrigger className='h-9 text-sm min-w-[160px]'>
								<SelectValue placeholder='Barcha kategoriyalar' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>Barcha kategoriyalar</SelectItem>
								{isLoadingCategories ? (
									<SelectItem value='all'>Yuklanmoqda...</SelectItem>
								) : (
									categories.map((c) => (
										<SelectItem key={c.id} value={String(c.id)}>
											{c.name}
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>

						<div className='flex items-center gap-1.5'>
							<button
								onClick={() => {
									setAppliedDateFrom(draftDateFrom);
									setAppliedDateTo(draftDateTo);
									setAppliedCategory(draftCategory);
									setAppliedEmployeeId(selectedEmployeeId);
								}}
								className='h-7 px-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-md text-xs font-semibold flex items-center'
							>
								<Search size={12} className='mr-1.5' />
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
									setDraftCategory(null);
									setAppliedCategory(null);
									setSelectedEmployeeId(null);
									setAppliedEmployeeId(null);
								}}
								className='h-7 px-2 bg-white text-gray-700 rounded-md text-xs font-medium border border-gray-200 flex items-center gap-1.5'
							>
								<RotateCcw size={12} />
								<span>Tozalash</span>
							</button>
						</div>

						<button
							onClick={openCreate}
							className='px-3 py-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-xs'
						>
							<Plus size={14} className='mr-1.5' />
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
						<Table>
							<TableHeader>
								<TableRow className='border-b-2 border-blue-200 bg-blue-50/50'>
									<TableHead className='w-[60px]'>t/r</TableHead>
									<TableHead>Sanasi</TableHead>
									<TableHead>Kategoriya</TableHead>
									<TableHead>Xodim</TableHead>
									<TableHead className='text-right'>Jami ($)</TableHead>
									<TableHead className='text-right'>Dollar ($)</TableHead>
									<TableHead className='text-right'>So'm</TableHead>
									<TableHead className='text-right'>Kilik</TableHead>
									<TableHead className='text-right'>Terminal</TableHead>
									<TableHead className='text-right'>Transfer</TableHead>

									<TableHead className='text-right'>Amallar</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{groups.map((group: ExpenseGroup) => {
									return (
										<Fragment key={`group-${group.date}`}>
											<TableRow className='bg-gray-100'>
												<TableCell>
													<div className='flex items-center gap-2'>
														<Badge>{group.items.length}</Badge>
													</div>
												</TableCell>
												<TableCell className='font-semibold text-gray-700'>
													{format(new Date(group.date), 'yyyy-MM-dd')}
												</TableCell>
												<TableCell />
												<TableCell />
												<TableCell className='text-right font-semibold text-blue-600'>
													{formatCurrency(group.totals?.summa_total_dollar)}
												</TableCell>
												<TableCell className='text-right font-semibold text-blue-600'>
													{formatCurrency(group.totals?.summa_dollar)}
												</TableCell>
												<TableCell className='text-right font-semibold text-blue-600'>
													{formatCurrency(group.totals?.summa_naqt)}
												</TableCell>
												<TableCell className='text-right font-semibold text-blue-600'>
													{formatCurrency(group.totals?.summa_kilik)}
												</TableCell>
												<TableCell className='text-right font-semibold text-blue-600'>
													{formatCurrency(group.totals?.summa_terminal)}
												</TableCell>
												<TableCell className='text-right font-semibold text-blue-600'>
													{formatCurrency(group.totals?.summa_transfer)}
												</TableCell>
												<TableCell />
											</TableRow>
											{group.items.map((it, idx: number) => (
												<TableRow
													key={it.id}
													className='border-b border-gray-100 group hover:bg-blue-50/30 transition-colors cursor-pointer'
													onClick={() => setViewItem(it)}
												>
													<TableCell className='font-medium'>
														{group.items.length - idx}
													</TableCell>
													<TableCell>{it.date}</TableCell>
													<TableCell>{it.category_detail?.name || '-'}</TableCell>
													<TableCell>{it.employee_detail?.full_name || '-'}</TableCell>
													<TableCell className='text-right  font-semibold'>
														{formatCurrency(it.summa_total_dollar)}
													</TableCell>
													<TableCell className='text-right'>
														{formatCurrency(it.summa_dollar)}
													</TableCell>
													<TableCell className='text-right'>
														{formatCurrency(it.summa_naqt)}
													</TableCell>
													<TableCell className='text-right'>
														{formatCurrency(it.summa_kilik)}
													</TableCell>
													<TableCell className='text-right'>
														{formatCurrency(it.summa_terminal)}
													</TableCell>
													<TableCell className='text-right'>
														{formatCurrency(it.summa_transfer)}
													</TableCell>
													<TableCell
														className='text-right'
														onClick={(e) => e.stopPropagation()}
													>
														<div className='flex items-center justify-end gap-1'>
															<Button
																size='icon'
																variant='ghost'
																className='h-8 w-8'
																onClick={() => openEdit(it)}
															>
																<Pencil className='h-4 w-4' />
															</Button>
															<Button
																size='icon'
																variant='ghost'
																className='h-8 w-8 text-destructive hover:text-destructive'
																onClick={() => {
																	if (it.is_salary) {
																		alert("Oylik xarajatni o'chirish mumkin emas");
																		return;
																	}
																	handleDelete(it.id);
																}}
															>
																<Trash2 className='h-4 w-4' />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
										</Fragment>
									);
								})}
							</TableBody>
						</Table>
					)}
				</div>
			</div>

			<ExpenseModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				initialData={editItem}
				onSuccess={() => queryClient.invalidateQueries({ queryKey: ['expenses-grouped'] })}
			/>

			{/* View Expense Detail Modal */}
			{viewItem && (
				<div
					className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center'
					onClick={() => setViewItem(null)}
				>
					<div
						className='bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 border-2 border-indigo-200 overflow-hidden'
						onClick={(e) => e.stopPropagation()}
					>
						<div className='flex justify-between items-center p-4 sm:p-5 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50'>
							<h3 className='text-lg sm:text-xl font-bold text-gray-900'>Xarajat tafsilotlari</h3>
							<button
								onClick={() => setViewItem(null)}
								className='text-gray-500 hover:text-indigo-600 hover:bg-white p-2 rounded-xl transition-all duration-200'
							>
								<X size={24} />
							</button>
						</div>
						<div className='p-4 sm:p-6 space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<span className='text-xs text-indigo-600 font-semibold'>Sana</span>
									<p className='text-gray-800 font-medium'>
										{viewItem.date ? format(new Date(viewItem.date), 'dd.MM.yyyy') : '-'}
									</p>
								</div>
								<div>
									<span className='text-xs text-indigo-600 font-semibold'>Kategoriya</span>
									<p className='text-gray-800 font-medium'>{viewItem.category_detail?.name || '-'}</p>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<span className='text-xs text-indigo-600 font-semibold'>Oylik</span>
									<p className='text-gray-800 font-medium'>
										{viewItem.is_salary ? (
											<span className='px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold'>
												Ha
											</span>
										) : (
											<span className='px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold'>
												Yo'q
											</span>
										)}
									</p>
								</div>
								<div>
									<span className='text-xs text-indigo-600 font-semibold'>Hodim</span>
									<p className='text-gray-800 font-medium'>
										{viewItem.employee_detail?.full_name || '-'}
									</p>
								</div>
							</div>

							<div className='border-t border-gray-200 pt-4'>
								<span className='text-xs text-indigo-600 font-semibold block mb-2'>Summalar</span>
								<div className='grid grid-cols-2 gap-3'>
									<div className='bg-blue-50 rounded-lg p-3'>
										<span className='text-xs text-gray-500'>Jami ($)</span>
										<p className='text-lg font-bold text-blue-700'>
											{Number(viewItem.summa_total_dollar || 0).toLocaleString()} $
										</p>
									</div>
									<div className='bg-green-50 rounded-lg p-3'>
										<span className='text-xs text-gray-500'>Dollar ($)</span>
										<p className='text-lg font-bold text-green-700'>
											{Number(viewItem.summa_dollar || 0).toLocaleString()} $
										</p>
									</div>
									<div className='bg-purple-50 rounded-lg p-3'>
										<span className='text-xs text-gray-500'>Naqd (UZS)</span>
										<p className='text-lg font-bold text-purple-700'>
											{Number(viewItem.summa_naqt || 0).toLocaleString()}
										</p>
									</div>
									<div className='bg-orange-50 rounded-lg p-3'>
										<span className='text-xs text-gray-500'>Kilik (UZS)</span>
										<p className='text-lg font-bold text-orange-700'>
											{Number(viewItem.summa_kilik || 0).toLocaleString()}
										</p>
									</div>
									<div className='bg-cyan-50 rounded-lg p-3'>
										<span className='text-xs text-gray-500'>Terminal (UZS)</span>
										<p className='text-lg font-bold text-cyan-700'>
											{Number(viewItem.summa_terminal || 0).toLocaleString()}
										</p>
									</div>
									<div className='bg-pink-50 rounded-lg p-3'>
										<span className='text-xs text-gray-500'>Transfer (UZS)</span>
										<p className='text-lg font-bold text-pink-700'>
											{Number(viewItem.summa_transfer || 0).toLocaleString()}
										</p>
									</div>
								</div>
							</div>

							{viewItem.note && (
								<div className='border-t border-gray-200 pt-4'>
									<span className='text-xs text-indigo-600 font-semibold block mb-2'>Izoh</span>
									<p className='text-gray-700 bg-gray-50 rounded-lg p-3'>{viewItem.note}</p>
								</div>
							)}

							<div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
								<button
									onClick={() => setViewItem(null)}
									className='px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors'
								>
									Yopish
								</button>
								<button
									onClick={() => {
										openEdit(viewItem);
										setViewItem(null);
									}}
									className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2'
								>
									<Edit size={16} />
									Tahrirlash
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default ExpensePage;
