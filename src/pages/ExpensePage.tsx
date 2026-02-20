import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { showError, showSuccess } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import ExpenseModal from '../components/Kassa/ExpenseModal';

export function ExpensePage() {
	const { user } = useAuth();
	const [data, setData] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editItem, setEditItem] = useState<any | null>(null);

	useEffect(() => {
		loadData();
	}, [page]);

	const loadData = async () => {
		setIsLoading(true);
		try {
			const res = await expenseService.getExpenses({ page, page_size: 50, filial: user?.order_filial });
			setData(res.results || []);
			setTotalCount(res.count || 0);
		} catch (err) {
			console.error(err);
			showError('Xarajatlarni yuklashda xatolik');
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Xarajatni o'chirishni tasdiqlaysizmi?")) return;
		try {
			await expenseService.deleteExpense(id);
			showSuccess("Xarajat o'chirildi");
			loadData();
		} catch (err) {
			console.error(err);
			showError("O'chirishda xatolik");
		}
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
				<div className='flex items-center justify-between mb-4'>
					<h2 className='text-2xl sm:text-3xl font-bold text-gray-800'>Xarajatlar</h2>
					<button
						onClick={openCreate}
						className='px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl flex items-center gap-2'
					>
						<Plus /> Qo'sh
					</button>
				</div>

				<div className='flex-1 overflow-x-auto'>
					{isLoading ? (
						<div className='flex justify-center items-center h-64'>
							<Loader2 className='w-8 h-8 animate-spin text-blue-600' />
						</div>
					) : (
						<table className='w-full border-collapse text-sm'>
							<thead>
								<tr className='border-b-2 border-blue-200 bg-blue-50/50'>
									<th className='text-left p-2 font-semibold text-gray-700 whitespace-nowrap w-12'>
										#
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>Sana</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[120px]'>
										Kategoriya
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										Oylik
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[150px]'>
										Hodim
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										Jami ($)
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										To'langan ($)
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
										Naqd (UZS)
									</th>
									<th className='text-left p-2 font-semibold text-gray-700 min-w-[110px]'>
										Terminal
									</th>
									<th className='text-left p-2 font-semibold text-gray-700'>Izoh</th>
									<th className='text-left p-2 font-semibold text-gray-700 w-28'>Actions</th>
								</tr>
							</thead>
							<tbody>
								{data.length === 0 ? (
									<tr>
										<td colSpan={11} className='text-center py-12 text-gray-400'>
											Ma'lumotlar yo'q
										</td>
									</tr>
								) : (
									data.map((item, idx) => (
										<tr
											key={item.id}
											className='border-b border-gray-100 group hover:bg-blue-50/30 transition-colors'
										>
											<td className='p-2 text-gray-500 font-mono'>{(page - 1) * 50 + idx + 1}</td>
											<td className='p-2 text-gray-600 whitespace-nowrap'>
												{item.date ? new Date(item.date).toLocaleDateString() : '-'}
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
																({item.employee_detail.phone_number})
															</span>
														) : null}
													</span>
												) : (
													<span className='text-gray-400'>-</span>
												)}
											</td>
											<td className='p-2 text-gray-800 text-left'>
												{Number(item.summa_total_dollar || 0).toLocaleString()} $
											</td>
											<td className='p-2 text-gray-800 text-left'>
												{Number(item.summa_dollar || 0).toLocaleString()} $
											</td>
											<td className='p-2 text-gray-800 text-left'>
												{Number(item.summa_naqt || 0).toLocaleString()} UZS
											</td>
											<td className='p-2 text-gray-800 text-left'>
												{Number(item.summa_terminal || 0).toLocaleString()} UZS
											</td>
											<td className='p-2 text-gray-700'>{item.note || '-'}</td>
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
														className='p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors'
													>
														<Trash2 size={16} />
													</button>
												</div>
											</td>
										</tr>
									))
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
				onSuccess={() => loadData()}
			/>
		</div>
	);
}

export default ExpensePage;
