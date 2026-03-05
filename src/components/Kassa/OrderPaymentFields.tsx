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

    // Format USD amount
    const formatUsdAmount = (val: number) => (Math.abs(Number(val)) < 0.005 ? '0' : val.toFixed(2));

    // To'lanishi kerak summa (jami - chegirma)
    const discountNum = parseFloat(discountAmount) || 0;
    const amountToPay = calculatedTotalAmount - discountNum; // To'lanishi kerak (chegirma hisobga)
    const qaytimUzs = (parseFloat(zdachaDollar) || 0) * usdRate + (parseFloat(zdachaSom) || 0);
    const usdAmount = formatUsdAmount(amountToPay / usdRate);

    // Payment methods
    const paymentMethods = [
        {
            id: 'usd',
            name: 'US dollar naqd',
            unit: 'USD' as const,
            icon: Banknote,
            gradient: 'bg-green-600',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-700',
        },
        {
            id: 'cash',
            name: 'Naqd',
            unit: 'UZS' as const,
            icon: Banknote,
            gradient: 'bg-green-600',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-700',
        },
        {
            id: 'card',
            name: 'Plastik perevod',
            unit: 'UZS' as const,
            icon: CreditCard,
            gradient: 'bg-blue-600',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
        },
        {
            id: 'terminal',
            name: 'Terminal',
            unit: 'UZS' as const,
            icon: CreditCard,
            gradient: 'bg-blue-600',
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
    const remaining = amountToPay - paidAmount + qaytimUzs; // qaytim berilganda "qoldiq" oshadi

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

    // Qaytim dollar kiritilganda qaytim so'm avtomatik to'ldiriladi
    useEffect(() => {
        const zdD = parseFloat(zdachaDollar) || 0;
        setZdachaSom((zdD * usdRate).toFixed(0));
    }, [zdachaDollar, usdRate]);

    // OrderData o'zgarganda maydonlarni yangilash
    useEffect(() => {
        if (orderData) {
            setNote(orderData.note || '');
            setDriverInfo(orderData.driver_info || '');
            setDiscountAmount(orderData.discount_amount || '0');
            setZdachaDollar(orderData.zdacha_dollar || '0');
            // zdachaSom avtomatik hisoblanadi (yuqoridagi useEffect orqali)

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
        <div className='flex flex-col h-full bg-white border-r border-blue-200/50'>
            {/* Content */}
            <div className='flex-1 overflow-y-auto p-3 bg-white'>
                {isSaving && (
                    <div className='mb-2 text-gray-600 text-[10px] flex items-center gap-1.5'>
                        <div className='w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin'></div>
                        <span>Saqlanmoqda...</span>
                    </div>
                )}
                {/* Totals */}
                <div className='grid grid-cols-3 gap-2 mb-3'>
                    <div className='bg-indigo-50 p-2 rounded-lg border border-indigo-200'>
                        <p className='text-gray-600 mb-1 text-[10px] font-medium'>To'lanishi kerak:</p>
                        {isLoadingProducts ? (
                            <p className='text-[10px] text-gray-500'>Yuklanmoqda...</p>
                        ) : (
                            <>
                                <p className='text-lg font-bold text-indigo-700'>
                                    {usdAmount} <span className='text-[10px] font-normal text-indigo-400'>USD</span>
                                </p>
                                <p className='text-sm font-bold text-indigo-600 mt-0.5'>
                                    {amountToPay.toLocaleString()}{' '}
                                    <span className='text-[10px] font-normal text-indigo-500'>UZS</span>
                                </p>
                            </>
                        )}
                    </div>
                    <div className='bg-emerald-50 p-2 rounded-lg border border-emerald-200'>
                        <p className='text-gray-600 mb-1 text-[10px] font-medium'>To'landi:</p>
                        <p className='text-lg font-bold text-emerald-600'>
                            {formatUsdAmount(paidAmount / usdRate)}{' '}
                            <span className='text-[10px] font-normal text-emerald-400'>USD</span>
                        </p>
                        <p className='text-sm font-bold text-emerald-500 mt-0.5'>
                            {paidAmount.toLocaleString()}{' '}
                            <span className='text-[10px] font-normal text-emerald-500'>UZS</span>
                        </p>
                    </div>
                    <div
                        className={`p-2 rounded-lg border ${remaining > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}
                    >
                        <p className='text-gray-600 mb-1 text-[10px] font-medium'>Qoldi:</p>
                        <p
                            className={`text-lg font-bold ${remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                        >
                            {formatUsdAmount(Math.max(0, remaining) / usdRate)}{' '}
                            <span
                                className={`text-[10px] font-normal ${remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
                            >
                                USD
                            </span>
                        </p>
                        <p className={`text-sm font-bold mt-0.5 ${remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {Math.max(0, remaining).toLocaleString()}{' '}
                            <span
                                className={`text-[10px] font-normal ${remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
                            >
                                UZS
                            </span>
                        </p>
                    </div>
                </div>

                {/* Payment Methods Grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3'>
                    {paymentMethods.map((method) => {
                        const isSelected = (parseFloat(selectedMethods[method.id] || '') || 0) > 0;
                        return (
                            <div
                                key={method.id}
                                className={`border rounded-lg overflow-hidden shadow-sm hover:shadow transition-all duration-200 ${isSelected ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-indigo-200'
                                    }`}
                            >
                                <div
                                    className={`${method.gradient} text-white p-1.5 flex justify-between items-center`}
                                >
                                    <div className='flex items-center space-x-1.5'>
                                        <div className={`${method.iconBg} p-1 rounded`}>
                                            <method.icon className={`${method.iconColor} w-3 h-3`} />
                                        </div>
                                        <span className='font-medium text-[10px]'>{method.name}</span>
                                    </div>
                                    {isSelected && (
                                        <button
                                            onClick={() => handleRemoveMethod(method.id)}
                                            className='text-white/80 hover:text-white transition-colors bg-white/20 p-0.5 rounded'
                                            title="O'chirish"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className='p-1.5 bg-white'>
                                    <div className='relative'>
                                        <NumberInput
                                            value={String(selectedMethods[method.id] ?? '0')}
                                            onChange={(val) => handleMethodAmountChange(method.id, val)}
                                            allowDecimal={method.unit === 'USD'}
                                            placeholder='0'
                                            className='w-full border border-indigo-200 focus:border focus:border-indigo-500 py-1 pr-8 text-right font-semibold text-xs rounded focus:bg-indigo-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
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
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3'>
                    {/* Chegirma */}
                    <div className='bg-amber-50 p-2 rounded-lg border border-amber-200'>
                        <label className='block text-amber-600 text-[10px] font-semibold mb-1'>Chegirma</label>
                        <div className='relative'>
                            <NumberInput
                                value={discountAmount}
                                onChange={(val) => {
                                    hasUserChanged.current = true;
                                    setDiscountAmount(val);
                                }}
                                allowDecimal={true}
                                placeholder='0'
                                className='w-full border border-amber-200 focus:border focus:border-amber-500 py-1 pr-10 text-right font-semibold text-xs rounded focus:bg-amber-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                            />
                            <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none'>
                                UZS
                            </span>
                        </div>
                    </div>

                    {/* Qaytim dollarda */}
                    <div className='bg-green-50 p-2 rounded-lg border border-green-200'>
                        <label className='block text-green-600 text-[10px] font-semibold mb-1'>Qaytim dollarda</label>
                        <div className='relative'>
                            <NumberInput
                                value={zdachaDollar}
                                onChange={(val) => {
                                    hasUserChanged.current = true;
                                    setZdachaDollar(val);
                                }}
                                allowDecimal={true}
                                placeholder='0'
                                className='w-full border border-green-200 focus:border focus:border-green-500 py-1 pr-10 text-right font-semibold text-xs rounded focus:bg-green-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                            />
                            <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none'>
                                USD
                            </span>
                        </div>
                    </div>

                    {/* Qaytim so'mda (avto to'ldiriladi, disabled) */}
                    <div className='bg-blue-50 p-2 rounded-lg border border-blue-200'>
                        <label className='block text-blue-600 text-[10px] font-semibold mb-1'>Qaytim so'mda</label>
                        <div className='relative'>
                            <NumberInput
                                value={zdachaSom}
                                onChange={(val) => {
                                    hasUserChanged.current = true;
                                    setZdachaSom(val);
                                }}
                                allowDecimal={true}
                                placeholder='0'
                                className='w-full border border-blue-200 focus:border focus:border-blue-500 py-1 pr-10 text-right font-semibold text-xs rounded focus:bg-blue-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                                disabled
                            />
                            <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none'>
                                UZS
                            </span>
                        </div>
                    </div>
                </div>

                {/* Izoh va Yetkazib beruvchi maydonlari */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                    {/* Izoh maydoni */}
                    <div className='bg-blue-50 p-2 rounded-lg border border-blue-200'>
                        <div className='flex items-center mb-1.5'>
                            <FileText size={14} className='mr-1.5 text-blue-600' />
                            <span className='text-blue-600 text-[10px] font-semibold'>Izoh</span>
                        </div>
                        <textarea
                            value={note}
                            onChange={(e) => {
                                hasUserChanged.current = true;
                                setNote(e.target.value);
                            }}
                            placeholder='Izoh kiriting...'
                            className='w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none'
                            rows={2}
                        />
                    </div>

                    {/* Yetkazib beruvchi maydoni */}
                    <div className='bg-purple-50 p-2 rounded-lg border border-purple-200'>
                        <div className='flex items-center mb-1.5'>
                            <Truck size={14} className='mr-1.5 text-purple-600' />
                            <span className='text-purple-600 text-[10px] font-semibold'>Yetkazib beruvchi</span>
                        </div>
                        <textarea
                            value={driverInfo}
                            onChange={(e) => {
                                hasUserChanged.current = true;
                                setDriverInfo(e.target.value);
                            }}
                            placeholder="Yetkazib beruvchi ma'lumotlari..."
                            className='w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent resize-none'
                            rows={2}
                        />
                    </div>
                </div>

                {/* Footer with buttons (keeps inside the scrollable form) */}
                <div className='p-2 border-t bg-white flex justify-between items-center gap-2 shrink-0 mt-3'>
                    <button
                        onClick={() => navigate(-1)}
                        className=' h-8 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-1.5'
                    >
                        <ArrowLeft size={14} />
                        <span className='text-xs'>Orqaga</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !orderData}
                        className='h-8 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg font-semibold shadow hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
                    >
                        {isSaving ? (
                            <>
                                <div className='w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                                <span className='text-xs'>Saqlanmoqda...</span>
                            </>
                        ) : (
                            <>
                                <Save size={14} />
                                <span className='text-xs'>Saqlash</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
