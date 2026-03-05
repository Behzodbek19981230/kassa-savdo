import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Label } from '../ui/Input';
import NumberInput from '../ui/NumberInput';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DatePicker } from '../ui/DatePicker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { expenseService } from '../../services/expenseService';
import api from '../../services/api';
import { showError, showSuccess } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';
import { userService, User } from '../../services/userService';

interface ExpenseModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	initialData?: any | null;
}

export function ExpenseModal({ isOpen, onClose, onSuccess, initialData = null }: ExpenseModalProps) {
	const { user } = useAuth();
	const { displayRate } = useExchangeRate();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const expenseSchema = z
		.object({
			category: z
				.string()
				.min(1, 'Kategoriya tanlanishi shart')
				.refine((val) => val !== '' && val !== undefined && val !== null, {
					message: 'Kategoriya tanlanishi shart',
				}),
			summa_total_dollar: z.string().min(1, "Bo'sh bo'lmasligi kerak").default('0'),
			summa_dollar: z.string().min(1, "Bo'sh bo'lmasligi kerak").default('0'),
			summa_naqt: z.string().min(1, "Bo'sh bo'lmasligi kerak").default('0'),
			summa_kilik: z.string().min(1, "Bo'sh bo'lmasligi kerak").default('0'),
			summa_terminal: z.string().min(1, "Bo'sh bo'lmasligi kerak").default('0'),
			summa_transfer: z.string().min(1, "Bo'sh bo'lmasligi kerak").default('0'),
			date: z.date({ message: 'Sana tanlanishi shart' }),
			note: z.string().optional(),
			is_salary: z.boolean().optional(),
			employee: z.string().optional(),
		})
		.refine(
			(data) => {
				if (data.is_salary === true) {
					return data.employee && data.employee.length > 0;
				}
				return true;
			},
			{
				message: 'Oylik uchun hodim tanlanishi shart',
				path: ['employee'],
			},
		);

	type FormValues = z.input<typeof expenseSchema>;

	const {
		control,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(expenseSchema),
		mode: 'onSubmit',
		defaultValues: {
			category: initialData?.category?.toString() || '',
			summa_total_dollar:
				initialData?.summa_total_dollar != null ? initialData.summa_total_dollar.toString() : '0',
			summa_dollar: initialData?.summa_dollar != null ? initialData.summa_dollar.toString() : '0',
			summa_naqt: initialData?.summa_naqt != null ? initialData.summa_naqt.toString() : '0',
			summa_kilik: initialData?.summa_kilik != null ? initialData.summa_kilik.toString() : '0',
			summa_terminal: initialData?.summa_terminal != null ? initialData.summa_terminal.toString() : '0',
			summa_transfer: initialData?.summa_transfer != null ? initialData.summa_transfer.toString() : '0',
			date: initialData?.date ? new Date(initialData.date) : new Date(),
			note: initialData?.note || '',
			is_salary: initialData?.is_salary || false,
			employee: initialData?.employee?.toString() || '',
		},
	});

	const watchedSummaDollar = watch('summa_dollar');
	const watchedSummaNaqt = watch('summa_naqt');
	const watchedSummaKilik = watch('summa_kilik');
	const watchedSummaTerminal = watch('summa_terminal');
	const watchedSummaTransfer = watch('summa_transfer');

	useEffect(() => {
		const d = Number(watchedSummaDollar || 0);
		const n = Number(watchedSummaNaqt || 0);
		const k = Number(watchedSummaKilik || 0);
		const t = Number(watchedSummaTerminal || 0);
		const tr = Number(watchedSummaTransfer || 0);

		const sumUzs = n + k + t + tr;
		const rate = displayRate || 1;
		const total = d + sumUzs / rate;

		setValue('summa_total_dollar', total.toFixed(3));
	}, [
		watchedSummaDollar,
		watchedSummaNaqt,
		watchedSummaKilik,
		watchedSummaTerminal,
		watchedSummaTransfer,
		displayRate,
		setValue,
	]);

	const isSalary = watch('is_salary');

	const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
	const [, setIsLoadingCategories] = useState(false);
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
				const res = await userService.getUsers({ limit: 100 });
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
			summa_total_dollar:
				initialData?.summa_total_dollar != null ? Number(initialData.summa_total_dollar).toFixed(0) : '0',
			summa_dollar: initialData?.summa_dollar != null ? Number(initialData.summa_dollar).toFixed(0) : '0',
			summa_naqt: initialData?.summa_naqt != null ? Number(initialData.summa_naqt).toFixed(0) : '0',
			summa_kilik: initialData?.summa_kilik != null ? Number(initialData.summa_kilik).toFixed(0) : '0',
			summa_terminal: initialData?.summa_terminal != null ? Number(initialData.summa_terminal).toFixed(0) : '0',
			summa_transfer: initialData?.summa_transfer != null ? Number(initialData.summa_transfer).toFixed(0) : '0',
			date: initialData?.date ? new Date(initialData.date) : new Date(),
			note: initialData?.note || '',
			is_salary: initialData?.is_salary || false,
			employee: initialData?.employee?.toString() || '',
		});
	}, [initialData, reset]);

	// Helper to round to 2 decimal places
	const toFixed2 = (val: string | number | undefined): number => {
		const num = Number(val || 0);
		return Math.round(num * 100) / 100;
	};

	const onSubmit = async (values: FormValues) => {
		// Manual category check
		if (!values.category || values.category === '') {
			showError('Kategoriya tanlanishi shart');
			return;
		}

		setIsSubmitting(true);
		const payload = {
			filial: user?.order_filial || 0,
			category: values.category ? Number(values.category) : undefined,
			summa_total_dollar: toFixed2(values.summa_total_dollar),
			summa_dollar: toFixed2(values.summa_dollar),
			summa_naqt: toFixed2(values.summa_naqt),
			summa_kilik: toFixed2(values.summa_kilik),
			summa_terminal: toFixed2(values.summa_terminal),
			summa_transfer: toFixed2(values.summa_transfer),
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
										Kategoriya <span className='text-red-500'>*</span>
									</Label>
									<Controller
										control={control}
										name='category'
										render={({ field }) => (
											<Select
												value={field.value || undefined}
												onValueChange={(v) => field.onChange(v)}
											>
												<SelectTrigger
													className={
														errors.category ? 'border-red-500 ring-1 ring-red-500' : ''
													}
												>
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
									{errors.category && (
										<p className='text-red-500 text-xs mt-1 ml-1'>{errors.category.message}</p>
									)}
								</div>

								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Sana <span className='text-red-500'>*</span>
									</Label>
									<Controller
										control={control}
										name='date'
										render={({ field }) => (
											<DatePicker
												date={field.value}
												onDateChange={field.onChange}
												className={`w-full ${errors.date ? 'border-red-500 ring-1 ring-red-500' : ''}`}
											/>
										)}
									/>
									{errors.date && (
										<p className='text-red-500 text-xs mt-1 ml-1'>{errors.date.message}</p>
									)}
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
												disabled
												value={field.value ?? ''}
												onChange={(v) => field.onChange(v)}
												className={`w-full ${errors.summa_total_dollar ? 'border-red-500 ring-1 ring-red-500' : ''}`}
											/>
										)}
									/>
									{errors.summa_total_dollar && (
										<p className='text-red-500 text-xs mt-1 ml-1'>
											{errors.summa_total_dollar.message}
										</p>
									)}
								</div>
							</div>

							{/* Employee Selection - Only shown when is_salary is true */}
							{isSalary && (
								<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
									<div>
										<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
											Hodim <span className='text-red-500'>*</span>
										</Label>
										<Controller
											control={control}
											name='employee'
											render={({ field }) => (
												<Select
													value={field.value || undefined}
													onValueChange={(v) => field.onChange(v)}
												>
													<SelectTrigger
														className={
															errors.employee ? 'border-red-500 ring-1 ring-red-500' : ''
														}
													>
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
										{errors.employee && (
											<p className='text-red-500 text-xs mt-1 ml-1'>{errors.employee.message}</p>
										)}
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
									{errors.summa_dollar && (
										<p className='text-red-500 text-xs mt-1 ml-1'>{errors.summa_dollar.message}</p>
									)}
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
									{errors.summa_naqt && (
										<p className='text-red-500 text-xs mt-1 ml-1'>{errors.summa_naqt.message}</p>
									)}
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
									{errors.summa_kilik && (
										<p className='text-red-500 text-xs mt-1 ml-1'>{errors.summa_kilik.message}</p>
									)}
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
									{errors.summa_terminal && (
										<p className='text-red-500 text-xs mt-1 ml-1'>
											{errors.summa_terminal.message}
										</p>
									)}
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
									{errors.summa_transfer && (
										<p className='text-red-500 text-xs mt-1 ml-1'>
											{errors.summa_transfer.message}
										</p>
									)}
								</div>
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
											className='w-full px-3 py-2 rounded-xl text-sm border text-gray-800  border-indigo-200 bg-white focus-visible:outline-none focus-visible:ring-0 focus:border-indigo-300 transition-all duration-200  resize-none'
											rows={4}
										/>
									)}
								/>
							</div>
						</div>

						<div className='border-t border-gray-200 p-3 flex justify-end gap-2'>
							<button
								type='button'
								onClick={onClose}
								className='px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 text-xs transition-colors'
							>
								Bekor qilish
							</button>
							<button
								type='submit'
								disabled={isSubmitting}
								className='bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
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
