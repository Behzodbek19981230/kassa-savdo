import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Label, Input } from '../ui/Input';
import NumberInput from '../ui/NumberInput';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '../ui/DatePicker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { expenseService } from '../../services/expenseService';
import api from '../../services/api';
import { showError, showSuccess } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { userService, User } from '../../services/userService';

interface ExpenseModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	initialData?: any | null;
}

export function ExpenseModal({ isOpen, onClose, onSuccess, initialData = null }: ExpenseModalProps) {
	const { user } = useAuth();
	const [isSubmitting, setIsSubmitting] = useState(false);

	interface FormValues {
		category?: string;
		summa_total_dollar?: string;
		summa_dollar?: string;
		summa_naqt?: string;
		summa_kilik?: string;
		summa_terminal?: string;
		summa_transfer?: string;
		date?: Date | undefined;
		note?: string;
		is_salary?: boolean;
		employee?: string;
	}

	const { control, handleSubmit, reset, watch } = useForm<FormValues>({
		defaultValues: {
			category: initialData?.category?.toString() || '',
			summa_total_dollar: initialData?.summa_total_dollar?.toString() || '0',
			summa_dollar: initialData?.summa_dollar?.toString() || '0',
			summa_naqt: initialData?.summa_naqt?.toString() || '0',
			summa_kilik: initialData?.summa_kilik?.toString() || '0',
			summa_terminal: initialData?.summa_terminal?.toString() || '0',
			summa_transfer: initialData?.summa_transfer?.toString() || '0',
			date: initialData?.date ? new Date(initialData.date) : new Date(),
			note: initialData?.note || '',
			is_salary: initialData?.is_salary || false,
			employee: initialData?.employee?.toString() || '',
		},
	});

	const isSalary = watch('is_salary');

	const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
	const [isLoadingCategories, setIsLoadingCategories] = useState(false);
	const [employees, setEmployees] = useState<User[]>([]);
	const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		const load = async () => {
			setIsLoadingCategories(true);
			try {
				const res = await api.get('/v1/expense-category');
				const data = res.data;
				const list = Array.isArray(data) ? data : (data?.results ?? data);
				setCategories(Array.isArray(list) ? list.map((c: any) => ({ id: c.id, name: c.name })) : []);
			} catch (err) {
				console.error('Failed to load expense categories', err);
			} finally {
				setIsLoadingCategories(false);
			}
		};
		load();
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const loadEmployees = async () => {
			setIsLoadingEmployees(true);
			try {
				const res = await userService.getUsers({ page_size: 100 });
				setEmployees(res.results || []);
			} catch (err) {
				console.error('Failed to load employees', err);
				setEmployees([]);
			} finally {
				setIsLoadingEmployees(false);
			}
		};
		loadEmployees();
	}, [isOpen]);

	useEffect(() => {
		reset({
			category: initialData?.category?.toString() || '',
			summa_total_dollar: initialData?.summa_total_dollar?.toString() || '0',
			summa_dollar: initialData?.summa_dollar?.toString() || '0',
			summa_naqt: initialData?.summa_naqt?.toString() || '0',
			summa_kilik: initialData?.summa_kilik?.toString() || '0',
			summa_terminal: initialData?.summa_terminal?.toString() || '0',
			summa_transfer: initialData?.summa_transfer?.toString() || '0',
			date: initialData?.date ? new Date(initialData.date) : new Date(),
			note: initialData?.note || '',
			is_salary: initialData?.is_salary || false,
			employee: initialData?.employee?.toString() || '',
		});
	}, [initialData, reset]);

	const onSubmit = async (values: FormValues) => {
		setIsSubmitting(true);
		const payload = {
			filial: user?.order_filial || 0,
			category: values.category ? Number(values.category) : undefined,
			summa_total_dollar: Number(values.summa_total_dollar || 0),
			summa_dollar: Number(values.summa_dollar || 0),
			summa_naqt: Number(values.summa_naqt || 0),
			summa_kilik: Number(values.summa_kilik || 0),
			summa_terminal: Number(values.summa_terminal || 0),
			summa_transfer: Number(values.summa_transfer || 0),
			date: values.date ? values.date.toISOString().split('T')[0] : undefined,
			note: values.note || '',
			is_delete: false,
			is_salary: values.is_salary === true,
			employee: values.is_salary === true && values.employee ? Number(values.employee) : undefined,
		} as any;

		try {
			if (initialData && initialData.id) {
				await expenseService.updateExpense(initialData.id, payload);
				showSuccess('Xarajat yangilandi');
			} else {
				await expenseService.createExpense(payload);
				showSuccess("Xarajat qo'shildi");
			}
			onSuccess && onSuccess();
			onClose();
		} catch (error: any) {
			console.error('Expense save error', error);
			const msg = error?.response?.data?.detail || error?.message || 'Xatolik yuz berdi';
			showError(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50' />
				<Dialog.Content className='fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border-2 border-indigo-200 z-50 overflow-hidden'>
					<div className='flex justify-between items-center p-4 sm:p-5 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50'>
						<h3 className='text-lg sm:text-xl font-bold text-gray-900'>
							{initialData?.id ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}
						</h3>
						<button
							onClick={onClose}
							className='text-gray-500 hover:text-indigo-600 hover:bg-white p-2 rounded-xl transition-all duration-200'
						>
							<X size={24} />
						</button>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className='flex-1 overflow-y-auto p-4 sm:p-6'>
						<div className='space-y-4'>
							{/* Is Salary Radio Button */}
							<div className='mb-4'>
								<Label className='block text-xs text-indigo-600 mb-2 ml-1 font-semibold'>
									Xarajat turi
								</Label>
								<div className='flex gap-4'>
									<Controller
										control={control}
										name='is_salary'
										render={({ field }) => (
											<label className='flex items-center gap-2 cursor-pointer'>
												<input
													type='radio'
													checked={field.value === false}
													onChange={() => field.onChange(false)}
													className='w-4 h-4 text-indigo-600 focus:ring-indigo-500'
												/>
												<span className='text-sm text-gray-700'>Oddiy xarajat</span>
											</label>
										)}
									/>
									<Controller
										control={control}
										name='is_salary'
										render={({ field }) => (
											<label className='flex items-center gap-2 cursor-pointer'>
												<input
													type='radio'
													checked={field.value === true}
													onChange={() => field.onChange(true)}
													className='w-4 h-4 text-indigo-600 focus:ring-indigo-500'
												/>
												<span className='text-sm text-gray-700'>Oylik</span>
											</label>
										)}
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Kategoriya
									</Label>
									<Controller
										control={control}
										name='category'
										render={({ field }) => (
											<Select value={field.value || undefined} onValueChange={(v) => field.onChange(v)}>
												<SelectTrigger>
													<SelectValue placeholder='— Tanlang —' />
												</SelectTrigger>
												<SelectContent>
													{categories.map((c) => (
														<SelectItem key={c.id} value={c.id.toString()}>
															{c.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>

								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Sana
									</Label>
									<Controller
										control={control}
										name='date'
										render={({ field }) => (
											<DatePicker
												date={field.value}
												onDateChange={field.onChange}
												className='w-full'
											/>
										)}
									/>
								</div>

								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Jami summa ($)
									</Label>
									<Controller
										control={control}
										name='summa_total_dollar'
										render={({ field }) => (
											<NumberInput
												value={field.value ?? '0'}
												onChange={(v) => field.onChange(v)}
												className='w-full'
											/>
										)}
									/>
								</div>
							</div>

							{/* Employee Selection - Only shown when is_salary is true */}
							{isSalary && (
								<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
									<div>
										<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
											Hodim
										</Label>
										<Controller
											control={control}
											name='employee'
											render={({ field }) => (
												<Select value={field.value || undefined} onValueChange={(v) => field.onChange(v)}>
													<SelectTrigger>
														<SelectValue placeholder='— Tanlang —' />
													</SelectTrigger>
													<SelectContent>
														{isLoadingEmployees ? (
															<div className='px-2 py-1.5 text-sm text-gray-500'>
																Yuklanmoqda...
															</div>
														) : (
															employees.map((emp) => (
																<SelectItem key={emp.id} value={emp.id.toString()}>
																	{emp.full_name}
																	{emp.phone_number ? ` (${emp.phone_number})` : ''}
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
											)}
										/>
									</div>
								</div>
							)}

							<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Summa ($)
									</Label>
									<Controller
										control={control}
										name='summa_dollar'
										render={({ field }) => (
											<NumberInput
												value={field.value ?? '0'}
												onChange={(v) => field.onChange(v)}
												className='w-full'
											/>
										)}
									/>
								</div>

								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Summa so'm
									</Label>
									<Controller
										control={control}
										name='summa_naqt'
										render={({ field }) => (
											<NumberInput
												value={field.value ?? '0'}
												onChange={(v) => field.onChange(v)}
												className='w-full'
											/>
										)}
									/>
								</div>

								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Summa kilik
									</Label>
									<Controller
										control={control}
										name='summa_kilik'
										render={({ field }) => (
											<NumberInput
												value={field.value ?? '0'}
												onChange={(v) => field.onChange(v)}
												className='w-full'
											/>
										)}
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Summa terminal
									</Label>
									<Controller
										control={control}
										name='summa_terminal'
										render={({ field }) => (
											<NumberInput
												value={field.value ?? '0'}
												onChange={(v) => field.onChange(v)}
												className='w-full'
											/>
										)}
									/>
								</div>

								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Summa transfer
									</Label>
									<Controller
										control={control}
										name='summa_transfer'
										render={({ field }) => (
											<NumberInput
												value={field.value ?? '0'}
												onChange={(v) => field.onChange(v)}
												className='w-full'
											/>
										)}
									/>
								</div>

								{/* note moved below as textarea */}
							</div>
							{/* Izoh (full width textarea) */}
							<div>
								<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>Izoh</Label>
								<Controller
									control={control}
									name='note'
									render={({ field }) => (
										<textarea
											{...field}
											placeholder='Izoh'
											className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none'
											rows={4}
										/>
									)}
								/>
							</div>
						</div>

						<div className='border-t border-gray-200 p-4 sm:p-5 flex justify-end gap-3'>
							<button
								type='button'
								onClick={onClose}
								className='px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors'
							>
								Bekor qilish
							</button>
							<button
								type='submit'
								disabled={isSubmitting}
								className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{isSubmitting ? 'Saqlanmoqda...' : initialData?.id ? 'Saqlash' : "Qo'shish"}
							</button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

export default ExpenseModal;
