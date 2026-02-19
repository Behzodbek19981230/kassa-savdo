import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Input, Label } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Autocomplete, AutocompleteOption } from '../ui/Autocomplete';
import { debtRepaymentService, DebtRepaymentRequest } from '../../services/orderService';
import { clientService, Client } from '../../services/clientService';
import { showError, showSuccess } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { USD_RATE } from '../../constants';

interface DebtRepaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export function DebtRepaymentModal({ isOpen, onClose, onSuccess }: DebtRepaymentModalProps) {
	const { user } = useAuth();
	const [selectedClient, setSelectedClient] = useState<Client | null>(null);
	const [clients, setClients] = useState<Client[]>([]);
	const [isSearchingClients, setIsSearchingClients] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [debtStatus, setDebtStatus] = useState(true);

	// Form fields
	const [date, setDate] = useState<Date | undefined>(new Date());
	const [note, setNote] = useState('');
	const [summaTotalDollar, setSummaTotalDollar] = useState<string>('0');
	const [discountAmount, setDiscountAmount] = useState<string>('0');
	const [summaDollar, setSummaDollar] = useState<string>('0');
	const [summaSom, setSummaSom] = useState<string>('0');
	const [summaKarta, setSummaKarta] = useState<string>('0');
	const [summaTerminal, setSummaTerminal] = useState<string>('0');
	const [zdachaDollar, setZdachaDollar] = useState<string>('0');
	const [zdachaSom, setZdachaSom] = useState<string>('0');

	const exchangeRate = USD_RATE;
	const clientDebt = selectedClient?.total_debt ? Number(selectedClient.total_debt) / exchangeRate : 0;

	// Mijozlarni qidirish - useCallback bilan memoize qilish (debounce uchun)
	const searchClients = useCallback(async (query: string) => {
		setIsSearchingClients(true);
		try {
			const response = await clientService.getClients(query || '');
			setClients(response.results.filter((c) => c.is_active && !c.is_delete));
		} catch (error) {
			console.error('Failed to search clients:', error);
			setClients([]);
		} finally {
			setIsSearchingClients(false);
		}
	}, []);

	// Modal ochilganda faqat bir marta mijozlarni yuklash
	useEffect(() => {
		if (isOpen) {
			searchClients('');
		}
	}, [isOpen, searchClients]);

	// Mijoz tanlash
	const handleClientSelect = async (clientId: string) => {
		if (!clientId) {
			setSelectedClient(null);
			return;
		}
		try {
			const client = await clientService.getClient(parseInt(clientId));
			setSelectedClient(client);
		} catch (error) {
			console.error('Failed to load client:', error);
			showError("Mijoz ma'lumotlarini yuklashda xatolik");
		}
	};

	const autocompleteOptions: AutocompleteOption[] = clients.map((client) => ({
		id: client.id.toString(),
		label: `${client.full_name}${client.phone_number ? ` (${client.phone_number})` : ''}`,
		value: client.id.toString(),
	}));

	// Formani tozalash
	const resetForm = () => {
		setSelectedClient(null);
		setDate(new Date());
		setNote('');
		setSummaTotalDollar('0');
		setDiscountAmount('0');
		setSummaDollar('0');
		setSummaSom('0');
		setSummaKarta('0');
		setSummaTerminal('0');
		setZdachaDollar('0');
		setZdachaSom('0');
		setDebtStatus(true);
	};

	// Modal yopilganda formani tozalash
	useEffect(() => {
		if (!isOpen) {
			resetForm();
		}
	}, [isOpen]);

	// Qarz to'lash
	const handleSubmit = async () => {
		if (!selectedClient) {
			showError('Mijozni tanlang');
			return;
		}

		if (!user?.order_filial) {
			showError("Filial ma'lumotlari topilmadi");
			return;
		}

		setIsSubmitting(true);
		try {
			const oldTotalDebt = selectedClient.total_debt ? Number(selectedClient.total_debt) : 0;
			const totalPaid =
				Number(summaSom || 0) +
				Number(summaDollar || 0) * exchangeRate +
				Number(summaKarta || 0) +
				Number(summaTerminal || 0);

			const newTotalDebt = Math.max(0, oldTotalDebt - totalPaid + Number(discountAmount || 0));

			const payload: DebtRepaymentRequest = {
				filial: user.order_filial,
				client: selectedClient.id,
				employee: user.id || 0,
				exchange_rate: exchangeRate,
				date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
				note: note,
				old_total_debt_client: oldTotalDebt,
				total_debt_client: newTotalDebt,
				summa_total_dollar: Number(summaTotalDollar || 0),
				summa_dollar: Number(summaDollar || 0),
				summa_naqt: Number(summaSom || 0),
				summa_kilik: 0,
				summa_terminal: Number(summaTerminal || 0),
				summa_transfer: Number(summaKarta || 0),
				discount_amount: Number(discountAmount || 0),
				zdacha_dollar: Number(zdachaDollar || 0),
				zdacha_som: Number(zdachaSom || 0),
				is_delete: false,
				debt_status: debtStatus,
			};

			await debtRepaymentService.createDebtRepayment(payload);
			showSuccess("Qarz muvaffaqiyatli to'landi");
			onSuccess?.();
			onClose();
		} catch (error: any) {
			console.error('Failed to create debt repayment:', error);
			const errorMessage = error?.response?.data?.detail || error?.message || "Qarz to'lashda xatolik";
			showError(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50' />
				<Dialog.Content className='fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border-2 border-indigo-200 z-50 overflow-hidden'>
					{/* Header */}
					<div className='flex justify-between items-center p-4 sm:p-5 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50'>
						<h2 className='text-lg sm:text-xl font-bold text-gray-900'>Qarz to'lash</h2>
						<button
							onClick={onClose}
							className='text-gray-500 hover:text-indigo-600 hover:bg-white p-2 rounded-xl transition-all duration-200'
						>
							<X size={24} />
						</button>
					</div>

					{/* Content */}
					<div className='flex-1 overflow-y-auto p-4 sm:p-6'>
						<div className='space-y-4'>
							{/* Mijoz tanlash va Qarz */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Mijoz
									</Label>
									<Autocomplete
										options={autocompleteOptions}
										value={selectedClient?.id?.toString() || ''}
										onChange={handleClientSelect}
										onSearchChange={searchClients}
										placeholder='Mijozni tanlang...'
										emptyMessage='Mijoz topilmadi'
										className='!h-9 !min-h-9'
									/>
								</div>
								<div className='flex items-end'>
									<div className='w-full'>
										<Label className='block text-xs text-red-600 mb-1 ml-1 font-semibold'>
											Qarzi ($)
										</Label>
										<div className='px-3 py-2 bg-red-50 border border-red-200 rounded-lg'>
											<span className='text-base font-bold text-red-700'>
												{clientDebt.toFixed(2)}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Toggle Switch */}
							<div className='flex items-center justify-end gap-3'>
								<span className='text-sm font-semibold text-gray-700'>Status:</span>
								<button
									type='button'
									onClick={() => setDebtStatus(!debtStatus)}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										debtStatus ? 'bg-blue-600' : 'bg-gray-300'
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											debtStatus ? 'translate-x-6' : 'translate-x-1'
										}`}
									/>
								</button>
							</div>

							{/* Form Fields */}
							<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
								{/* Sana */}
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Sana
									</Label>
									<DatePicker
										date={date}
										onDateChange={setDate}
										placeholder='Sana tanlang'
										className='w-full'
									/>
								</div>

								{/* Jami Summa ($) */}
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Jami Summa ($)
									</Label>
									<Input
										type='number'
										step='0.01'
										value={summaTotalDollar}
										onChange={(e) => setSummaTotalDollar(e.target.value)}
										placeholder='0.00'
										className='w-full'
									/>
								</div>

								{/* Chegirma ($) */}
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Chegirma ($)
									</Label>
									<Input
										type='number'
										step='0.01'
										value={discountAmount}
										onChange={(e) => setDiscountAmount(e.target.value)}
										placeholder='0.00'
										className='w-full'
									/>
								</div>

								{/* Summa ($) */}
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Summa ($)
									</Label>
									<Input
										type='number'
										step='0.01'
										value={summaDollar}
										onChange={(e) => setSummaDollar(e.target.value)}
										placeholder='0.00'
										className='w-full'
									/>
								</div>

								{/* Summa so'm */}
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Summa so'm
									</Label>
									<Input
										type='number'
										step='1'
										value={summaSom}
										onChange={(e) => setSummaSom(e.target.value)}
										placeholder='0'
										className='w-full'
									/>
								</div>

								{/* Summa karta */}
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Summa karta
									</Label>
									<Input
										type='number'
										step='1'
										value={summaKarta}
										onChange={(e) => setSummaKarta(e.target.value)}
										placeholder='0'
										className='w-full'
									/>
								</div>

								{/* Summa terminal */}
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Summa terminal
									</Label>
									<Input
										type='number'
										step='1'
										value={summaTerminal}
										onChange={(e) => setSummaTerminal(e.target.value)}
										placeholder='0'
										className='w-full'
									/>
								</div>

								{/* Qaytim ($) */}
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Qaytim ($)
									</Label>
									<Input
										type='number'
										step='0.01'
										value={zdachaDollar}
										onChange={(e) => setZdachaDollar(e.target.value)}
										placeholder='0.00'
										className='w-full'
									/>
								</div>

								{/* Qaytim so'm */}
								<div>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Qaytim so'm
									</Label>
									<Input
										type='number'
										step='1'
										value={zdachaSom}
										onChange={(e) => setZdachaSom(e.target.value)}
										placeholder='0'
										className='w-full'
									/>
								</div>
							</div>

							{/* Izoh */}
							<div>
								<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>Izoh</Label>
								<textarea
									value={note}
									onChange={(e) => setNote(e.target.value)}
									placeholder='Izoh kiriting...'
									className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none'
									rows={3}
								/>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className='border-t border-gray-200 p-4 sm:p-5 flex justify-end gap-3'>
						<button
							onClick={onClose}
							className='px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors'
						>
							Bekor qilish
						</button>
						<button
							onClick={handleSubmit}
							disabled={isSubmitting || !selectedClient}
							className='bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
						>
							{isSubmitting ? (
								<>
									<div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
									<span>To'lanmoqda...</span>
								</>
							) : (
								<span>Qarzni to'lash</span>
							)}
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
