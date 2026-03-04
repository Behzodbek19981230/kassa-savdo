import { useState, useEffect, useRef } from 'react';
import { FileText, Truck, Banknote, CreditCard, X, ArrowLeft, Save } from 'lucide-react';
import NumberInput from '../ui/NumberInput';
import { OrderResponse } from '../../types';
import { orderService, vozvratOrderService } from '../../services/orderService';
import { showError, showSuccess } from '../../lib/toast';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';
import { useNavigate } from 'react-router-dom';

interface OrderPaymentFieldsProps {
	orderData: OrderResponse | null;
	onOrderUpdate?: (order: OrderResponse) => void;
	totalAmount?: number;
	refreshTrigger?: number; // Yangi mahsulot qo'shilganda yangilash uchun
	isVozvratOrder?: boolean;
}

export function OrderPaymentFields({
	orderData,
	onOrderUpdate,
	totalAmount: _totalAmount = 0,
	refreshTrigger = 0,
	isVozvratOrder = false,
}: OrderPaymentFieldsProps) {
	const navigate = useNavigate();
	const { displayRate } = useExchangeRate();
	const [note, setNote] = useState('');
	const [driverInfo, setDriverInfo] = useState('');
	const [discountAmount, setDiscountAmount] = useState<string>('0');
	const [zdachaDollar, setZdachaDollar] = useState<string>('0');
	const [zdachaSom, setZdachaSom] = useState<string>('0');
	const [isSaving, setIsSaving] = useState(false);
	const [selectedMethods, setSelectedMethods] = useState<{ [key: string]: string }>({});
	const [orderProducts, setOrderProducts] = useState<any[]>([]);
	const [isLoadingProducts, setIsLoadingProducts] = useState(false);
	const isInitialMount = useRef(true);
	const hasUserChanged = useRef(false);

	const usdRate = orderData?.exchange_rate != null ? Number(orderData.exchange_rate) : displayRate;

	// Order-history-product larni yuklash: vozvrat bo'lsa vozvrat_order bo'yicha, oddiy order bo'lsa order_history bo'yicha
	useEffect(() => {
		const loadOrderProducts = async () => {
			if (!orderData?.id) return;
			setIsLoadingProducts(true);
			try {
				const list = isVozvratOrder
					? await vozvratOrderService.getVozvratOrderProducts(orderData.id)
					: await orderService.getOrderProducts(orderData.id);
				const filtered = (list || []).filter((p: any) => !p.is_delete);
				setOrderProducts(filtered);
			} catch (error) {
				console.error('Failed to load order products:', error);
				setOrderProducts([]);
			} finally {
				setIsLoadingProducts(false);
			}
		};
		loadOrderProducts();
	}, [orderData?.id, orderData?.all_product_summa, refreshTrigger, isVozvratOrder]);

	// Jami summani hisoblash (order-history-product lardan)
	const calculatedTotalAmount = orderProducts.reduce((sum, product) => {
		const priceSum = Number(product.price_sum) || 0;
		return sum + priceSum;
	}, 0);

	// To'lanishi kerak summa (jami - chegirma)
	const totalAmountToPay = calculatedTotalAmount - (parseFloat(discountAmount) || 0);

	// Payment methods
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

	// Jami to'landi (har doim UZS da)
	const getPaidAmountInUzs = (methods: { [key: string]: string }) => {
		const cash = parseFloat(methods.cash || '') || 0;
		const usd = parseFloat(methods.usd || '') || 0;
		const card = parseFloat(methods.card || '') || 0;
		const terminal = parseFloat(methods.terminal || '') || 0;
		return cash + usd * usdRate + card + terminal;
	};

	// To'langan summa: selectedMethods dan yoki orderData dan (default)
	const paidAmountFromMethods = getPaidAmountInUzs(selectedMethods);
	const paidAmountFromOrderData = orderData
		? (Number(orderData.summa_naqt) || 0) +
			(Number(orderData.summa_dollar) || 0) * usdRate +
			(Number(orderData.summa_transfer) || 0) +
			(Number(orderData.summa_terminal) || 0)
		: 0;

	// Agar selectedMethods bo'sh bo'lsa, orderData dan olish, aks holda selectedMethods dan
	const paidAmount = Object.keys(selectedMethods).length > 0 ? paidAmountFromMethods : paidAmountFromOrderData;
	const remaining = totalAmountToPay - paidAmount;

	const handleMethodAmountChange = (methodId: string, amount: string) => {
		hasUserChanged.current = true;
		setSelectedMethods({ ...selectedMethods, [methodId]: amount });
	};

	const handleRemoveMethod = (methodId: string) => {
		const newMethods = { ...selectedMethods };
		delete newMethods[methodId];
		hasUserChanged.current = true;
		setSelectedMethods(newMethods);
	};

	// OrderData o'zgarganda maydonlarni yangilash
	useEffect(() => {
		if (orderData) {
			setNote(orderData.note || '');
			setDriverInfo(orderData.driver_info || '');
			setDiscountAmount(orderData.discount_amount || '0');
			setZdachaDollar(orderData.zdacha_dollar || '0');
			setZdachaSom(orderData.zdacha_som || '0');

			// Payment methods ni yuklash
			const methods: { [key: string]: string } = {};
			if (orderData.summa_naqt) methods.cash = String(orderData.summa_naqt);
			if (orderData.summa_dollar) methods.usd = String(orderData.summa_dollar);
			if (orderData.summa_transfer) methods.card = String(orderData.summa_transfer);
			if (orderData.summa_terminal) methods.terminal = String(orderData.summa_terminal);
			setSelectedMethods(methods);

			// Birinchi yuklanishni belgilash
			if (isInitialMount.current) {
				isInitialMount.current = false;
				hasUserChanged.current = false;
			}
		}
	}, [orderData]);

	// Saqlash funksiyasi
	const handleSave = async () => {
		if (!orderData) return;

		setIsSaving(true);
		try {
			const summa_naqt = String(selectedMethods.cash ?? '0');
			const summa_dollar = String(selectedMethods.usd ?? '0');
			const summa_transfer = String(selectedMethods.card ?? '0');
			const summa_terminal = String(selectedMethods.terminal ?? '0');
			const payload = {
				note: note,
				driver_info: driverInfo,
				discount_amount: parseFloat(discountAmount) || 0,
				zdacha_dollar: parseFloat(zdachaDollar) || 0,
				zdacha_som: parseFloat(zdachaSom) || 0,
				summa_naqt: parseFloat(summa_naqt) || 0,
				summa_dollar: parseFloat(summa_dollar) || 0,
				summa_transfer: parseFloat(summa_transfer) || 0,
				summa_terminal: parseFloat(summa_terminal) || 0,
				update_status: 1,
			};

			if (isVozvratOrder) {
				(payload as any).is_vazvrat_status = true;
			}
			let updatedOrder;
			if (isVozvratOrder) {
				updatedOrder = await vozvratOrderService.editVozvratOrder(orderData.id, payload);
			} else {
				updatedOrder = await orderService.updateOrder(orderData.id, payload);
			}
			onOrderUpdate?.(updatedOrder);
			showSuccess("Ma'lumotlar muvaffaqiyatli saqlandi");
		} catch (error: any) {
			console.error('Failed to update order:', error);
			const errorMessage = error?.response?.data?.detail || error?.message || "Ma'lumotlarni saqlashda xatolik";
			showError(errorMessage);
		} finally {
			setIsSaving(false);
		}
	};

	if (!orderData) {
		return (
			<div className='p-6 bg-white rounded-xl border-2 border-gray-200'>
				<p className='text-gray-500 text-center'>Order ma'lumotlari yuklanmoqda...</p>
			</div>
		);
	}

	return (
		<div className='flex flex-col h-full bg-gradient-to-b from-white to-blue-50/30 border-r border-blue-200/50'>
			{/* Content */}
			<div className='flex-1 overflow-y-auto p-3 sm:p-4 bg-white'>
				{isSaving && (
					<div className='mb-3 text-gray-600 text-xs flex items-center gap-2'>
						<div className='w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin'></div>
						<span>Saqlanmoqda...</span>
					</div>
				)}
				{/* Totals */}
				<div className='grid grid-cols-3 gap-2 sm:gap-3 mb-4'>
					<div className='bg-gradient-to-br from-indigo-50 to-blue-50 p-2 sm:p-3 rounded-lg border border-indigo-200'>
						<p className='text-gray-600 mb-1 text-xs font-medium'>To'lanishi kerak:</p>
						{isLoadingProducts ? (
							<p className='text-xs text-gray-500'>Yuklanmoqda...</p>
						) : (
							<>
								<p className='text-lg sm:text-xl font-bold text-indigo-700'>
									{(remaining / usdRate).toFixed(2)}{' '}
									<span className='text-xs font-normal text-indigo-400'>USD</span>
								</p>
								<p className='text-sm font-bold text-indigo-600 mt-0.5'>
									{remaining.toLocaleString()}{' '}
									<span className='text-xs font-normal text-indigo-500'>UZS</span>
								</p>
							</>
						)}
					</div>
					<div className='bg-gradient-to-br from-emerald-50 to-green-50 p-2 sm:p-3 rounded-lg border border-emerald-200'>
						<p className='text-gray-600 mb-1 text-xs font-medium'>To'landi:</p>
						<p className='text-lg sm:text-xl font-bold text-emerald-600'>
							{(paidAmount / usdRate).toFixed(2)}{' '}
							<span className='text-xs font-normal text-emerald-400'>USD</span>
						</p>
						<p className='text-sm font-bold text-emerald-500 mt-0.5'>
							{paidAmount.toLocaleString()}{' '}
							<span className='text-xs font-normal text-emerald-500'>UZS</span>
						</p>
					</div>
					<div
						className={`p-2 sm:p-3 rounded-lg border ${remaining > 0 ? 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-200' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'}`}
					>
						<p className='text-gray-600 mb-1 text-xs font-medium'>Qoldi:</p>
						{remaining > 0 ? (
							<>
								<p className='text-lg sm:text-xl font-bold text-rose-600'>
									{(remaining / usdRate).toFixed(2)}{' '}
									<span className='text-xs font-normal text-rose-400'>USD</span>
								</p>
								<p className='text-sm font-bold text-rose-500 mt-0.5'>
									{Math.max(0, remaining).toLocaleString()}{' '}
									<span className='text-xs font-normal text-rose-500'>UZS</span>
								</p>
							</>
						) : (
							<p className='text-lg sm:text-xl font-bold text-emerald-600'>
								0.00 <span className='text-xs font-normal text-emerald-400'>USD</span>
							</p>
						)}
					</div>
				</div>

				{/* Payment Methods Grid */}
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4'>
					{paymentMethods.map((method) => {
						const isSelected = (parseFloat(selectedMethods[method.id] || '') || 0) > 0;
						return (
							<div
								key={method.id}
								className={`border rounded-lg overflow-hidden shadow-sm hover:shadow transition-all duration-200 ${
									isSelected ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-indigo-200'
								}`}
							>
								<div
									className={`bg-gradient-to-r ${method.gradient} text-white p-1.5 sm:p-2 flex justify-between items-center`}
								>
									<div className='flex items-center space-x-1.5'>
										<div className={`${method.iconBg} p-1 rounded`}>
											<method.icon className={`${method.iconColor} w-3 h-3`} />
										</div>
										<span className='font-medium text-[10px] sm:text-xs'>{method.name}</span>
									</div>
									{isSelected && (
										<button
											onClick={() => handleRemoveMethod(method.id)}
											className='text-white/80 hover:text-white transition-colors bg-white/20 p-0.5 rounded'
										>
											<X size={12} />
										</button>
									)}
								</div>
								<div className='p-1.5 sm:p-2 bg-white'>
									<div className='relative'>
										<NumberInput
											value={String(selectedMethods[method.id] ?? '0')}
											onChange={(val) => handleMethodAmountChange(method.id, val)}
											allowDecimal={method.unit === 'USD'}
											placeholder='0'
											className='w-full border border-indigo-200 focus:border focus:border-indigo-500 py-1 pr-8 text-right font-semibold text-sm rounded focus:bg-indigo-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
										/>
										<span className='absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none'>
											{method.unit}
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Chegirma va Qaytim maydonlari */}
				<div className='grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4'>
					{/* Chegirma */}
					<div className='bg-gradient-to-br from-amber-50 to-orange-50 p-2 sm:p-3 rounded-lg border border-amber-200'>
						<label className='block text-amber-600 text-xs font-semibold mb-1'>Chegirma</label>
						<div className='relative'>
							<NumberInput
								value={discountAmount}
								onChange={(val) => {
									hasUserChanged.current = true;
									setDiscountAmount(val);
								}}
								allowDecimal={true}
								placeholder='0'
								className='w-full border border-amber-200 focus:border focus:border-amber-500 py-1 pr-10 text-right font-semibold text-sm rounded focus:bg-amber-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
							/>
							<span className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none'>
								UZS
							</span>
						</div>
					</div>

					{/* Qaytim dollarda */}
					<div className='bg-gradient-to-br from-green-50 to-emerald-50 p-2 sm:p-3 rounded-lg border border-green-200'>
						<label className='block text-green-600 text-xs font-semibold mb-1'>Qaytim dollarda</label>
						<div className='relative'>
							<NumberInput
								value={zdachaDollar}
								onChange={(val) => {
									hasUserChanged.current = true;
									setZdachaDollar(val);
								}}
								allowDecimal={true}
								placeholder='0'
								className='w-full border border-green-200 focus:border focus:border-green-500 py-1 pr-10 text-right font-semibold text-sm rounded focus:bg-green-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
							/>
							<span className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none'>
								USD
							</span>
						</div>
					</div>

					{/* Qaytim so'mda */}
					<div className='bg-gradient-to-br from-blue-50 to-cyan-50 p-2 sm:p-3 rounded-lg border border-blue-200'>
						<label className='block text-blue-600 text-xs font-semibold mb-1'>Qaytim so'mda</label>
						<div className='relative'>
							<NumberInput
								value={zdachaSom}
								onChange={(val) => {
									hasUserChanged.current = true;
									setZdachaSom(val);
								}}
								allowDecimal={true}
								placeholder='0'
								className='w-full border border-blue-200 focus:border focus:border-blue-500 py-1 pr-10 text-right font-semibold text-sm rounded focus:bg-blue-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
							/>
							<span className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none'>
								UZS
							</span>
						</div>
					</div>
				</div>

				{/* Izoh va Yetkazib beruvchi maydonlari */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3'>
					{/* Izoh maydoni */}
					<div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-2 sm:p-3 rounded-lg border border-blue-200'>
						<div className='flex items-center mb-1.5'>
							<FileText size={14} className='mr-1.5 text-blue-600' />
							<span className='text-blue-600 text-xs font-semibold'>Izoh</span>
						</div>
						<textarea
							value={note}
							onChange={(e) => {
								hasUserChanged.current = true;
								setNote(e.target.value);
							}}
							placeholder='Izoh kiriting...'
							className='w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none'
							rows={2}
						/>
					</div>

					{/* Yetkazib beruvchi maydoni */}
					<div className='bg-gradient-to-br from-purple-50 to-pink-50 p-2 sm:p-3 rounded-lg border border-purple-200'>
						<div className='flex items-center mb-1.5'>
							<Truck size={14} className='mr-1.5 text-purple-600' />
							<span className='text-purple-600 text-xs font-semibold'>Yetkazib beruvchi</span>
						</div>
						<textarea
							value={driverInfo}
							onChange={(e) => {
								hasUserChanged.current = true;
								setDriverInfo(e.target.value);
							}}
							placeholder="Yetkazib beruvchi ma'lumotlari..."
							className='w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent resize-none'
							rows={2}
						/>
					</div>
				</div>

				{/* Footer with buttons (keeps inside the scrollable form) */}
				<div className='p-3 sm:p-4 border-t bg-white flex justify-between items-center gap-3 shrink-0'>
					<button
						onClick={() => navigate(-1)}
						className='px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors flex items-center space-x-2'
					>
						<ArrowLeft size={16} />
						<span>Orqaga</span>
					</button>
					<button
						onClick={handleSave}
						disabled={isSaving || !orderData}
						className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
					>
						{isSaving ? (
							<>
								<div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
								<span>Saqlanmoqda...</span>
							</>
						) : (
							<>
								<Save size={18} />
								<span>Saqlash</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
