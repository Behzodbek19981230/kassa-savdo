import { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Printer, Banknote, CreditCard, CheckCircle2, FileText, Truck, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import NumberInput from '../ui/NumberInput';
import { Receipt } from './Receipt';
import { CartItem, Customer, Sale, OrderResponse } from '../../types';
import { useSales } from '../../contexts/SalesContext';
import { orderService } from '../../services/orderService';
import { showSuccess, showError } from '../../lib/toast';
import { useNavigate } from 'react-router-dom';

interface PaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onComplete?: () => void;
	totalAmount: number;
	usdRate: number;
	items?: CartItem[];
	customer?: Customer;
	kassirName?: string;
	orderData?: OrderResponse | null;
	onOrderUpdate?: (order: OrderResponse) => void;
}
export function PaymentModal({
	isOpen,
	onClose,
	onComplete,
	totalAmount,
	usdRate,
	items = [],
	customer,
	kassirName,
	orderData,
	onOrderUpdate,
}: PaymentModalProps) {
	const { addSale } = useSales();
	const [paidAmount, setPaidAmount] = useState(0);
	const [selectedMethods, setSelectedMethods] = useState<{ [key: string]: string }>({
		usd: '0',
		cash: '0',
		card: '0',
		terminal: '0',
	});
	const receiptRef = useRef<HTMLDivElement>(null);
	const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
	const [note, setNote] = useState('');
	const [driverInfo, setDriverInfo] = useState('');
	const [isVozvrat, setIsVozvrat] = useState(false);
	const [orderStatusChecked, setOrderStatusChecked] = useState(true);
	const [isCompleting, setIsCompleting] = useState(false);
	const [discountAmount, setDiscountAmount] = useState<string>('');
	const [zdachaDollar, setZdachaDollar] = useState<string>('');
	const [zdachaSom, setZdachaSom] = useState<string>('');
	const router = useNavigate();
	// OrderData o'zgarganda note va driverInfo ni yangilash
	useEffect(() => {
		if (orderData) {
			setNote(orderData.note || '');
			setDriverInfo(orderData.driver_info || '');
			setOrderStatusChecked(orderData.order_status ?? true);
			setIsVozvrat(orderData.is_debtor_product ?? false);
			if (Number(orderData.discount_amount ?? 0) > 0) setDiscountAmount(String(orderData.discount_amount ?? ''));
			if (Number(orderData.zdacha_dollar ?? 0) > 0) setZdachaDollar(String(orderData.zdacha_dollar ?? ''));
			if (Number(orderData.zdacha_som ?? 0) > 0) setZdachaSom(String(orderData.zdacha_som ?? ''));
		}
	}, [orderData]);

	// Hook'lar har doim bir xil tartibda chaqirilishi kerak
	const handlePrint = useReactToPrint({
		contentRef: receiptRef,
		documentTitle: `Check-${orderNumber}`,
		pageStyle: `
            @page {
                size: A4;
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

	const formatUsdAmount = (val: number) => (Math.abs(Number(val)) < 0.005 ? '0' : val.toFixed(2));
	const usdAmount = formatUsdAmount(totalAmount / usdRate);
	const remaining = totalAmount - paidAmount;

	const paymentMethods = [
		{
			id: 'usd',
			name: 'US dollar naqd',
			unit: 'USD' as const,
			icon: Banknote,
			gradient: 'from-green-700 to-emerald-800',
			iconBg: 'bg-green-100',
			iconColor: 'text-green-700',
		},
		{
			id: 'cash',
			name: 'Naqd',
			unit: 'UZS' as const,
			icon: Banknote,
			gradient: 'from-lime-500 to-green-600',
			iconBg: 'bg-lime-100',
			iconColor: 'text-lime-700',
		},

		{
			id: 'card',
			name: 'Plastik perevod',
			unit: 'UZS' as const,
			icon: CreditCard,
			gradient: 'from-blue-400 to-cyan-500',
			iconBg: 'bg-blue-100',
			iconColor: 'text-blue-700',
		},
		{
			id: 'terminal',
			name: 'Terminal',
			unit: 'UZS' as const,
			icon: CreditCard,
			gradient: 'from-blue-400 to-cyan-500',
			iconBg: 'bg-blue-100',
			iconColor: 'text-blue-700',
		},
	];

	// Jami to'landi (har doim UZS da): naqd/card/terminal = so'm, dollar = USD* kurs
	const getPaidAmountInUzs = (methods: { [key: string]: string }) => {
		const cash = parseFloat(methods.cash || '') || 0;
		const usd = parseFloat(methods.usd || '') || 0;
		const card = parseFloat(methods.card || '') || 0;
		const terminal = parseFloat(methods.terminal || '') || 0;
		return cash + usd * usdRate + card + terminal;
	};

	const handleMethodAmountChange = (methodId: string, amount: string) => {
		// `amount` is a normalized numeric string (e.g. "10000.5") from NumberInput
		const next = { ...selectedMethods, [methodId]: amount };
		setSelectedMethods(next);
		setPaidAmount(getPaidAmountInUzs(next));
	};

	const handleRemoveMethod = (methodId: string) => {
		const newMethods = { ...selectedMethods };
		delete newMethods[methodId];
		setSelectedMethods(newMethods);
		setPaidAmount(getPaidAmountInUzs(newMethods));
	};

	// keep paidAmount in sync with selectedMethods (initialisation and updates)
	useEffect(() => {
		setPaidAmount(getPaidAmountInUzs(selectedMethods));
	}, [selectedMethods, usdRate]);

	const handleComplete = async () => {
		if (orderData) {
			setIsCompleting(true);
			try {
				// Payment methods ni API polylariga map qilish
				const summa_naqt = parseFloat(selectedMethods.cash || '') || 0;
				const summa_dollar = parseFloat(selectedMethods.usd || '') || 0;
				const summa_transfer = parseFloat(selectedMethods.card || '') || 0;
				// Terminal to'lovi (so'mda)
				const summa_terminal = parseFloat(selectedMethods.terminal || '') || 0;

				// Summa total dollar (jami summa USD da)
				const summa_total_dollar = totalAmount;

				// Agar order_status belgilanmasa, barcha summa maydonlarini 0 jo'natamiz
				const zeroSums = !orderStatusChecked;

				// Order-history ga PATCH qilish
				const updateData = {
					is_karzinka: false,
					note: note,
					driver_info: driverInfo,
					summa_naqt: summa_naqt,
					summa_dollar: summa_dollar,
					summa_transfer: summa_transfer,
					summa_terminal: summa_terminal,
					summa_total_dollar: summa_total_dollar,
					all_product_summa: totalAmount,
					// order_status va vozvrat/is_debtor_product
					order_status: orderStatusChecked,
					discount_amount: parseFloat(discountAmount) || 0,
					zdacha_dollar: parseFloat(zdachaDollar) || 0,
					zdacha_som: parseFloat(zdachaSom) || 0,
				};

				const updatedOrder = await orderService.sellOrder(orderData.id, updateData);
				const mergedOrder: OrderResponse = {
					...updatedOrder,
					client_detail: updatedOrder.client_detail || orderData.client_detail,
				};
				onOrderUpdate?.(mergedOrder);

				// Savdo ma'lumotlarini saqlash
				const sale: Sale = {
					id: Date.now().toString(),
					orderNumber,
					date: new Date(),
					items: [...items],
					totalAmount,
					paidAmount,
					customer,
					kassirName,
					paymentMethods: Object.fromEntries(
						Object.entries(selectedMethods).map(([k, v]) => [k, parseFloat(v || '') || 0]),
					) as any,
				};

				addSale(sale);
				// handlePrint();
				showSuccess('Savdo muvaffaqiyatli tugallandi');
				onComplete?.(); // Cart ni tozalash va boshqa ishlar
				onClose();
				router('/');
			} catch (error: any) {
				console.error('Failed to complete order:', error);
				const errorMessage =
					error?.response?.data?.detail || error?.message || 'Savdo tugallashda xatolik yuz berdi';
				showError(errorMessage);
			} finally {
				setIsCompleting(false);
			}
		}
	};

	return (
		<Dialog.Root
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50' />
				<Dialog.Content className='fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-indigo-200 z-50 overflow-hidden p-0'>
					{/* Header */}
					<div className='flex justify-between items-center p-5 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 shrink-0'>
						<div className='flex items-center gap-3'>
							<div className='flex items-center gap-2 bg-white/80 border-2 border-indigo-200 rounded-xl px-4 py-2.5 shadow-sm'>
								<span className='text-sm font-medium text-gray-600'>Kurs:</span>
								<span className='text-lg font-bold text-indigo-700'>
									1 USD = {Number(usdRate).toLocaleString('uz-UZ')} UZS
								</span>
							</div>
						</div>
						<div className='flex items-center gap-2'>
							<div className='flex items-center gap-1 bg-white/80 border-2 border-indigo-200 rounded-xl px-3 py-1.5 shadow-sm'>
								<input
									type='checkbox'
									id='orderStatus'
									checked={orderStatusChecked}
									onChange={(e) => setOrderStatusChecked(e.target.checked)}
									className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
								/>
								<label htmlFor='orderStatus' className='text-sm text-gray-700'>
									Tasdiqlandimi?
								</label>
							</div>
							<button
								onClick={handlePrint}
								className='px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors flex items-center space-x-2'
								title='Chop etish (PDF)'
							>
								<Printer size={18} />
								<span>Chop qilish</span>
							</button>
						</div>
					</div>

					{/* Content - scroll */}
					<div className='p-6 bg-white overflow-y-auto flex-1 min-h-0'>
						{/* Totals */}
						<div className='grid grid-cols-3 gap-6 mb-8'>
							<div className='bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border-2 border-indigo-200'>
								<p className='text-gray-600 mb-2 font-medium'>To'lanishi kerak:</p>
								<p className='text-3xl font-bold text-indigo-700'>
									{usdAmount} <span className='text-sm font-normal text-indigo-400'>USD</span>
								</p>
								<p className='text-xl font-bold text-indigo-600 mt-1'>
									{totalAmount.toLocaleString()}{' '}
									<span className='text-sm font-normal text-indigo-500'>UZS</span>
								</p>
							</div>
							<div className='bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-2xl border-2 border-emerald-200'>
								<p className='text-gray-600 mb-2 font-medium'>To'landi:</p>
								<p className='text-3xl font-bold text-emerald-600'>
									{formatUsdAmount(paidAmount / usdRate)}{' '}
									<span className='text-sm font-normal text-emerald-400'>USD</span>
								</p>
								<p className='text-xl font-bold text-emerald-500 mt-1'>
									{paidAmount.toLocaleString()}{' '}
									<span className='text-sm font-normal text-emerald-500'>UZS</span>
								</p>
							</div>
							<div
								className={`p-5 rounded-2xl border-2 ${remaining > 0 ? 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-200' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'}`}
							>
								<p className='text-gray-600 mb-2 font-medium'>Qoldi:</p>
								<p
									className={`text-3xl font-bold ${remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
								>
									{formatUsdAmount(Math.max(0, remaining) / usdRate)}{' '}
									<span
										className={`text-sm font-normal ${remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
									>
										USD
									</span>
								</p>
								<p className='text-xl font-bold mt-1'>
									{Math.max(0, remaining).toLocaleString()}{' '}
									<span
										className={`text-sm font-normal ${remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
									>
										UZS
									</span>
								</p>
							</div>
						</div>

						{/* Payment Methods Grid */}
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6'>
							{paymentMethods.map((method) => {
								const isSelected = (parseFloat(selectedMethods[method.id] || '') || 0) > 0;
								return (
									<div
										key={method.id}
										className={`border-2 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 ${
											isSelected
												? 'border-indigo-400 ring-1 ring-indigo-200'
												: 'border-indigo-200'
										}`}
									>
										<div
											className={`bg-gradient-to-r ${method.gradient} text-white p-2.5 flex justify-between items-center`}
										>
											<div className='flex items-center space-x-2'>
												<div className={`${method.iconBg} p-1.5 rounded-md`}>
													<method.icon className={`${method.iconColor} w-4 h-4`} />
												</div>
												<span className='font-medium text-xs'>{method.name}</span>
											</div>
											{isSelected && (
												<button
													onClick={() => handleRemoveMethod(method.id)}
													className='text-white/80 hover:text-white transition-colors bg-white/20 p-0.5 rounded'
												>
													<X size={14} />
												</button>
											)}
										</div>
										<div className='p-2.5 bg-white'>
											<div className='relative'>
												<NumberInput
													value={String(selectedMethods[method.id] ?? '0')}
													onChange={(val) => handleMethodAmountChange(method.id, val)}
													allowDecimal={method.unit === 'USD'}
													placeholder={method.unit === 'USD' ? '0' : '0'}
													className='w-full border-2 border-indigo-200 focus:border-2 focus:border-indigo-500 py-1.5 pr-10 text-right font-semibold text-base rounded-lg focus:bg-indigo-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
												/>
												<span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none'>
													{method.unit}
												</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>

						{/* Chegirma va Qaytim maydonlari */}
						<div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
							{/* Chegirma */}
							<div className='bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-amber-200'>
								<label className='block text-amber-600 text-sm font-semibold mb-2'>Chegirma</label>
								<div className='relative'>
									<NumberInput
										value={discountAmount}
										onChange={(val) => setDiscountAmount(val)}
										allowDecimal={true}
										placeholder='0'
										className='w-full border-2 border-amber-200 focus:border-2 focus:border-amber-500 py-2 pr-12 text-right font-semibold text-base rounded-lg focus:bg-amber-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
									/>
									<span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none'>
										UZS
									</span>
								</div>
							</div>

							{/* Qaytim dollarda */}
							<div className='bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200'>
								<label className='block text-green-600 text-sm font-semibold mb-2'>
									Qaytim dollarda
								</label>
								<div className='relative'>
									<NumberInput
										value={zdachaDollar}
										onChange={(val) => setZdachaDollar(val)}
										allowDecimal={true}
										placeholder='0'
										className='w-full border-2 border-green-200 focus:border-2 focus:border-green-500 py-2 pr-12 text-right font-semibold text-base rounded-lg focus:bg-green-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
									/>
									<span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none'>
										USD
									</span>
								</div>
							</div>

							{/* Qaytim so'mda */}
							<div className='bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200'>
								<label className='block text-blue-600 text-sm font-semibold mb-2'>Qaytim so'mda</label>
								<div className='relative'>
									<NumberInput
										value={zdachaSom}
										onChange={(val) => setZdachaSom(val)}
										allowDecimal={true}
										placeholder='0'
										className='w-full border-2 border-blue-200 focus:border-2 focus:border-blue-500 py-2 pr-12 text-right font-semibold text-base rounded-lg focus:bg-blue-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
									/>
									<span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none'>
										UZS
									</span>
								</div>
							</div>
						</div>

						{/* Izoh va Yetkazib beruvchi maydonlari */}
						{orderData && (
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								{/* Izoh maydoni */}
								<div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200'>
									<div className='flex items-center mb-3'>
										<FileText size={18} className='mr-2 text-blue-600' />
										<span className='text-blue-600 text-sm font-semibold'>Izoh</span>
									</div>
									<textarea
										value={note}
										onChange={(e) => setNote(e.target.value)}
										placeholder='Izoh kiriting...'
										className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
										rows={3}
									/>
								</div>

								{/* Yetkazib beruvchi maydoni */}
								<div className='bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200'>
									<div className='flex items-center mb-3'>
										<Truck size={18} className='mr-2 text-purple-600' />
										<span className='text-purple-600 text-sm font-semibold'>Yetkazib beruvchi</span>
									</div>
									<textarea
										value={driverInfo}
										onChange={(e) => setDriverInfo(e.target.value)}
										placeholder="Yetkazib beruvchi ma'lumotlari..."
										className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none'
										rows={3}
									/>
								</div>
							</div>
						)}
					</div>

					{/* Footer with Close and Complete buttons (below content) */}
					<div className='p-4 border-t bg-white flex justify-between items-center gap-3 shrink-0'>
						<button
							onClick={onClose}
							className='px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors flex items-center space-x-2'
						>
							<X size={16} />
							<span>Yopish</span>
						</button>
						<button
							onClick={handleComplete}
							disabled={isCompleting || !orderData}
							className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
						>
							{isCompleting ? (
								<>
									<Loader2 className='w-4 h-4 animate-spin' />
									<span>Saqlanmoqda...</span>
								</>
							) : (
								<>
									<CheckCircle2 size={18} />
									<span>Tugallash</span>
								</>
							)}
						</button>
					</div>
				</Dialog.Content>

				{/* Hidden Receipt for Printing */}
				<div style={{ display: 'none' }}>
					<div ref={receiptRef}>
						<Receipt
							items={items}
							totalAmount={totalAmount}
							usdAmount={usdAmount}
							usdRate={usdRate}
							customer={customer}
							kassirName={kassirName}
							orderNumber={orderNumber}
							date={new Date()}
							paidAmount={paidAmount}
							remainingDebt={remaining}
							filialLogo={
								orderData?.order_filial_detail?.logo ?? orderData?.client_detail?.filial_detail?.logo
							}
						/>
					</div>
				</div>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
