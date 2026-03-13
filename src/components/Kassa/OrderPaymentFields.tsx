import { useState, useEffect, useRef } from 'react';
import { FileText, Truck, Banknote, CreditCard, X, ArrowLeft, Save } from 'lucide-react';
import NumberInput from '../ui/NumberInput';
import { OrderResponse } from '../../types';
import { orderService, vozvratOrderService } from '../../services/orderService';
import { showError, showSuccess } from '../../lib/toast';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import type { OrderItem } from '../../types';

interface OrderPaymentFieldsProps {
    orderData: OrderResponse | null;
    onOrderUpdate?: (order: OrderResponse) => void;
    totalAmount?: number;
    refreshTrigger?: number; // Yangi mahsulot qo'shilganda yangilash uchun
    isVozvratOrder?: boolean;
    /** Agar parent allaqachon order-products ni olib kelgan bo'lsa, shu yerda qayta zapros qilmaymiz */
    orderProducts?: OrderItem[];
    orderProductsLoading?: boolean;
}

export function OrderPaymentFields({
    orderData,
    onOrderUpdate,
    totalAmount: _totalAmount = 0,
    refreshTrigger = 0,
    isVozvratOrder = false,
    orderProducts: orderProductsFromParent,
    orderProductsLoading = false,
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
    const [orderStatusChecked, setOrderStatusChecked] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const isInitialMount = useRef(true);
    const hasUserChanged = useRef(false);

    const usdRate = orderData?.exchange_rate != null ? Number(orderData.exchange_rate) : displayRate;

    const shouldFetchOrderProducts = !orderProductsFromParent;
    const orderProductsQueryKey = ['orderPaymentProducts', orderData?.id, isVozvratOrder, refreshTrigger];
    const { data: fetchedOrderProducts = [], isFetching: isFetchingOrderProducts } = useQuery<OrderItem[]>({
        queryKey: orderProductsQueryKey,
        queryFn: async () => {
            if (!orderData?.id) return [] as OrderItem[];
            const list = isVozvratOrder
                ? await vozvratOrderService.getVozvratOrderProducts(orderData.id)
                : await orderService.getOrderProducts(orderData.id);
            return (list || []).filter((p: any) => !p.is_delete) as OrderItem[];
        },
        enabled: shouldFetchOrderProducts && !!orderData?.id,
        // Refreshdan keyin UI tezroq chiqishi uchun: eski data saqlanadi, fokusda refetch yo'q
        staleTime: 5_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: true,
        retry: 1,
    });

    const orderProducts: OrderItem[] = (orderProductsFromParent ?? fetchedOrderProducts) as OrderItem[];
    const isLoadingProducts = orderProductsLoading || (shouldFetchOrderProducts ? isFetchingOrderProducts : false);

    // Jami summani hisoblash (order-history-product lardan)
    // PaymentModal'dagidek: avval all_product_summa ni tekshirish (USD da), keyin orderProducts dan hisoblash
    const discountNum = parseFloat(discountAmount) || 0;

    // baseTotalUsd - PaymentModal'dagidek hisoblash
    const baseTotalUsd = (() => {

        // Keyin orderProducts dan price_dollar * count ni hisoblash (USD da)
        if (orderProducts && orderProducts.length > 0) {
            const totalFromProducts = orderProducts.reduce((sum, product) => {
                const priceDollar = Number(product.price_dollar) || 0;
                const count = Number(product.count) || 0;
                return sum + priceDollar * count;
            }, 0);
            if (totalFromProducts > 0) return totalFromProducts;
        }
        // Fallback: calculatedTotalAmountUzs dan USD ga aylantirish
        const calculatedTotalAmountUzs = orderProducts.reduce((sum, product) => {
            const priceSum = Number(product.price_sum) || 0;
            const count = Number(product.count) || 0;
            return sum + priceSum * count;
        }, 0);
        return usdRate > 0 ? calculatedTotalAmountUzs / usdRate : 0;
    })();

    // amountToPayUsd - chegirmasiz baseTotalUsd (chegirma qoldiqdan ayiriladi)
    const amountToPayUsd = baseTotalUsd;

    // Ko'rsatish uchun chegirma bilan to'lanishi kerak bo'lgan summa
    const amountToPayUsdWithDiscount = baseTotalUsd;
    const amountToPay = Math.round(amountToPayUsdWithDiscount * usdRate); // UZS

    const usdAmount = formatMoney(amountToPayUsdWithDiscount);
    const usdAmountUzs = formatMoney(amountToPay);

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
    // Rounding qilish kerak - kasr qismi bo'lmaydi
    const getPaidAmountInUzs = (methods: { [key: string]: string }) => {
        const cash = parseFloat(methods.cash || '') || 0;
        const usd = parseFloat(methods.usd || '') || 0;
        const card = parseFloat(methods.card || '') || 0;
        const terminal = parseFloat(methods.terminal || '') || 0;

        return cash + usd * usdRate + card + terminal;
    };
    const getPaidAmountInDollar = (methods: { [key: string]: string }) => {
        const cash = parseFloat(methods.cash || '') || 0;
        const usd = parseFloat(methods.usd || '') || 0;
        const card = parseFloat(methods.card || '') || 0;
        const terminal = parseFloat(methods.terminal || '') || 0;
        return cash / usdRate + usd + card / usdRate + terminal / usdRate;
    };

    // To'langan summa: selectedMethods dan yoki orderData dan (default)
    // Rounding qilish kerak - kasr qismi bo'lmaydi
    const paidAmountFromOrderData = orderData
        ? Number(orderData.summa_total_dollar)
        : 0;

    // Agar selectedMethods bo'sh bo'lsa, orderData dan olish, aks holda selectedMethods dan
    const paidAmountSumm = Object.keys(selectedMethods).length > 0 ? getPaidAmountInUzs(selectedMethods) : paidAmountFromOrderData * usdRate;
    const paidAmountDollar = Object.keys(selectedMethods).length > 0 ? getPaidAmountInDollar(selectedMethods) : paidAmountFromOrderData;

    // Rounding qilish kerak - kasr qismi bo'lmaydi (PaymentModal'dagidek)
    const zdachaDollarNum = parseFloat(zdachaDollar) || 0;

    // Qoldiqni USD da hisoblaymiz - chegirma qoldiqdan ayiriladi (PaymentModal'dagidek)
    const paidAmountUsd = paidAmountDollar;
    const remainingUsd = amountToPayUsd - paidAmountUsd + zdachaDollarNum - discountNum;
    // Agar USD da 0 ga yaqin bo'lsa (0.01 dan kichik), uni 0 qilamiz
    const remainingUsdRounded = Math.abs(remainingUsd) < 0.01 ? 0 : remainingUsd;
    // remaining: musbat = hali to'lanmagan (Qoldi), manfiy = qaytim kerak (Qaytim), zdacha kiritilsa qaytim kamayadi
    // PaymentModal'dagidek Math.round qilish kerak - remainingUsdRounded dan hisoblanadi
    const remaining = Math.round(remainingUsdRounded * usdRate);

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
    // Rounding qilish kerak - kasr qismi bo'lmaydi
    useEffect(() => {
        const zdD = parseFloat(zdachaDollar) || 0;
        setZdachaSom(String(Math.round(zdD * usdRate)));
    }, [zdachaDollar, usdRate]);

    // OrderData o'zgarganda maydonlarni yangilash
    useEffect(() => {
        if (orderData) {
            setNote(orderData.note || '');
            setDriverInfo(orderData.driver_info || '');
            
            // Vozvrat order uchun default qiymatlar bo'sh bo'lishi kerak
            if (isVozvratOrder) {
                setDiscountAmount(orderData.discount_amount && orderData.discount_amount > 0 ? String(orderData.discount_amount) : '');
                setZdachaDollar(orderData.zdacha_dollar && orderData.zdacha_dollar > 0 ? String(orderData.zdacha_dollar) : '');
                
                // Payment methods ni yuklash - faqat 0 dan katta qiymatlar bo'lsa
                const methods: { [key: string]: string } = {};
                if (orderData.summa_naqt && orderData.summa_naqt > 0) methods.cash = String(orderData.summa_naqt);
                if (orderData.summa_dollar && orderData.summa_dollar > 0) methods.usd = String(orderData.summa_dollar);
                if (orderData.summa_transfer && orderData.summa_transfer > 0) methods.card = String(orderData.summa_transfer);
                if (orderData.summa_terminal && orderData.summa_terminal > 0) methods.terminal = String(orderData.summa_terminal);
                setSelectedMethods(methods);
            } else {
                // Oddiy order uchun eski mantiq
                setDiscountAmount(orderData.discount_amount || '0');
                setZdachaDollar(orderData.zdacha_dollar || '0');
                
                // Payment methods ni yuklash
                const methods: { [key: string]: string } = {};
                if (orderData.summa_naqt) methods.cash = String(orderData.summa_naqt);
                if (orderData.summa_dollar) methods.usd = String(orderData.summa_dollar);
                if (orderData.summa_transfer) methods.card = String(orderData.summa_transfer);
                if (orderData.summa_terminal) methods.terminal = String(orderData.summa_terminal);
                setSelectedMethods(methods);
            }
            
            setOrderStatusChecked(orderData.order_status || false);
            // zdachaSom avtomatik hisoblanadi (yuqoridagi useEffect orqali)

            // Birinchi yuklanishni belgilash
            if (isInitialMount.current) {
                isInitialMount.current = false;
                hasUserChanged.current = false;
            }
            
            // Xatolarni tozalash
            setErrors({});
        }
    }, [orderData, isVozvratOrder]);

    // Saqlash funksiyasi
    const handleSave = async () => {
        if (!orderData) return;

        // Xatolarni tozalash
        setErrors({});

        // Vozvrat order uchun majburiy maydonlarni tekshirish
        if (isVozvratOrder) {
            const summa_naqt_num = parseFloat(selectedMethods.cash || '') || 0;
            const summa_dollar_num = parseFloat(selectedMethods.usd || '') || 0;
            const summa_transfer_num = parseFloat(selectedMethods.card || '') || 0;
            const summa_terminal_num = parseFloat(selectedMethods.terminal || '') || 0;

            const newErrors: { [key: string]: string } = {};

            if (summa_naqt_num === 0 && summa_dollar_num === 0 && summa_transfer_num === 0 && summa_terminal_num === 0) {
                newErrors.payment = 'Kamida bitta to\'lov usulini kiriting';
                setErrors(newErrors);
                return;
            }

            // Agar xatolar bo'lsa, to'xtatish
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
        }

        setIsSaving(true);
        try {
            const summa_naqt = String(selectedMethods.cash ?? '');
            const summa_dollar = String(selectedMethods.usd ?? '');
            const summa_transfer = String(selectedMethods.card ?? '');
            const summa_terminal = String(selectedMethods.terminal ?? '');

            // summa_total_dollar - to'lov summalarining yig'indisi USD da
            const summa_naqt_num = parseFloat(summa_naqt) || 0;
            const summa_dollar_num = parseFloat(summa_dollar) || 0;
            const summa_transfer_num = parseFloat(summa_transfer) || 0;
            const summa_terminal_num = parseFloat(summa_terminal) || 0;
            // Rounding qilish kerak - 2 xona kasr
            const summa_total_dollar =
                Math.round(
                    (summa_dollar_num + (summa_naqt_num + summa_transfer_num + summa_terminal_num) / usdRate) * 100,
                ) / 100;

            // all_product_summa - mahsulotlar jami narxi USD da
            // Rounding qilish kerak - 2 xona kasr
            const all_product_summa = Math.round(baseTotalUsd * 100) / 100;

            const payload = {
                note: note,
                driver_info: driverInfo,
                discount_amount: parseFloat(discountAmount) || 0,
                zdacha_dollar: parseFloat(zdachaDollar) || 0,
                zdacha_som: parseFloat(zdachaSom) || 0,
                summa_naqt: summa_naqt_num,
                summa_dollar: summa_dollar_num,
                summa_transfer: summa_transfer_num,
                summa_terminal: summa_terminal_num,
                summa_total_dollar: summa_total_dollar,
                all_product_summa: all_product_summa,
                update_status: 1,
                order_status: orderStatusChecked,
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
            navigate('/');
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

    // Data qayta yuklanayotgan bo'lsa ham (modal yopilganda/refetch), butun component loading bo'lib tursin
    if (isLoadingProducts) {
        return (
            <div className='p-6 bg-white rounded-xl border-2 border-gray-200'>
                <p className='text-gray-500 text-center'>Hisob-kitoblar yuklanmoqda...</p>
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
                                    {usdAmountUzs} <span className='text-[10px] font-normal text-indigo-500'>UZS</span>
                                </p>
                            </>
                        )}
                    </div>
                    <div className='bg-emerald-50 p-2 rounded-lg border border-emerald-200'>
                        <p className='text-gray-600 mb-1 text-[10px] font-medium'>To'landi:</p>
                        <p className='text-lg font-bold text-emerald-600'>
                            {formatMoney(paidAmountDollar)}{' '}
                            <span className='text-[10px] font-normal text-emerald-400'>USD</span>
                        </p>
                        <p className='text-sm font-bold text-emerald-500 mt-0.5'>
                            {formatMoney(paidAmountSumm)}{' '}
                            <span className='text-[10px] font-normal text-emerald-500'>UZS</span>
                        </p>
                    </div>
                    <div
                        className={`p-2 rounded-lg border ${remainingUsdRounded < 0 ? 'bg-orange-50 border-orange-200' : remainingUsdRounded > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}
                    >
                        <p className='text-gray-600 mb-1 text-[10px] font-medium'>
                            {remainingUsdRounded < 0 ? 'Qaytim:' : 'Qoldi:'}
                        </p>
                        <p
                            className={`text-lg font-bold ${remainingUsdRounded < 0 ? 'text-orange-600' : remainingUsdRounded > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                        >
                            {formatMoney(Math.abs(remainingUsdRounded))}{' '}
                            <span
                                className={`text-[10px] font-normal ${remainingUsdRounded < 0 ? 'text-orange-500' : remainingUsdRounded > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
                            >USD</span>
                        </p>
                        <p
                            className={`text-sm font-bold mt-0.5 ${remainingUsdRounded < 0 ? 'text-orange-600' : remainingUsdRounded > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                        >
                            {formatMoney(Math.abs(remaining))}{' '}
                            <span
                                className={`text-[10px] font-normal ${remainingUsdRounded < 0 ? 'text-orange-500' : remainingUsdRounded > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
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
                                className={`border rounded-lg overflow-hidden shadow-sm hover:shadow transition-all duration-200 ${isSelected ? 'border-indigo-400 ring-1 ring-indigo-200' : errors.payment ? 'border-red-400' : 'border-indigo-200'
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
                                            value={String(selectedMethods[method.id] ?? '')}
                                            onChange={(val) => {
                                                handleMethodAmountChange(method.id, val);
                                                // Xatoni tozalash
                                                if (errors.payment) {
                                                    setErrors({ ...errors, payment: '' });
                                                }
                                            }}
                                            allowDecimal={method.unit === 'USD'}
                                            placeholder={isVozvratOrder ? '' : '0'}
                                            className={`w-full border ${errors.payment ? 'border-red-400' : 'border-indigo-200'} focus:border focus:border-indigo-500 py-1 pr-8 text-right font-semibold text-xs rounded focus:bg-indigo-50/50 focus-visible:ring-0 focus-visible:ring-offset-0`}
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
                {/* Xato xabari - payment methods tagida */}
                {errors.payment && (
                    <div className='mb-3'>
                        <p className='text-red-500 text-xs'>{errors.payment}</p>
                    </div>
                )}

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
                                placeholder={isVozvratOrder ? '' : '0'}
                                className='w-full border border-amber-200 focus:border focus:border-amber-500 py-1 pr-10 text-right font-semibold text-xs rounded focus:bg-amber-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                            />
                            <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none'>
                                USD
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
                                placeholder={isVozvratOrder ? '' : '0'}
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
                                placeholder={isVozvratOrder ? '' : '0'}
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
                            <span className='text-[9px] text-gray-500 ml-1'>(ixtiyoriy)</span>
                        </div>
                        <textarea
                            value={note}
                            onChange={(e) => {
                                hasUserChanged.current = true;
                                setNote(e.target.value);
                            }}
                            placeholder='Izoh kiriting (ixtiyoriy)...'
                            className='w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none'
                            rows={2}
                        />
                    </div>

                    {/* Yetkazib beruvchi maydoni */}
                    <div className='bg-purple-50 p-2 rounded-lg border border-purple-200'>
                        <div className='flex items-center mb-1.5'>
                            <Truck size={14} className='mr-1.5 text-purple-600' />
                            <span className='text-purple-600 text-[10px] font-semibold'>Yetkazib beruvchi</span>
                            <span className='text-[9px] text-gray-500 ml-1'>(ixtiyoriy)</span>
                        </div>
                        <textarea
                            value={driverInfo}
                            onChange={(e) => {
                                hasUserChanged.current = true;
                                setDriverInfo(e.target.value);
                            }}
                            placeholder="Yetkazib beruvchi ma'lumotlari (ixtiyoriy)..."
                            className='w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent resize-none'
                            rows={2}
                        />
                    </div>
                    {/* Order Status Checkbox */}
                    <div className='mt-3 w-40'>
                        <label
                            htmlFor='orderStatus'
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 shadow-sm border cursor-pointer transition-all ${orderStatusChecked
                                ? 'bg-green-600 border-green-400'
                                : 'bg-red-600 border-red-400 animate-pulse'
                                }`}
                        >
                            <input
                                type='checkbox'
                                id='orderStatus'
                                checked={orderStatusChecked}
                                onChange={(e) => setOrderStatusChecked(e.target.checked)}
                                className='w-4 h-4 text-white border border-white rounded focus:ring-0 cursor-pointer accent-white'
                                disabled={orderData?.order_status === true}
                            />
                            <span className='text-sm font-bold text-white select-none'>Tasdiqlandimi?</span>
                        </label>
                    </div>
                </div>

                {/* Footer with buttons (keeps inside the scrollable form) */}
                <div className='p-2 border-t bg-white flex justify-between items-center gap-2 shrink-0 mt-3'>
                    <button
                        onClick={() => navigate(-1)}
                        className=' h-7 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-1.5'
                    >
                        <ArrowLeft size={14} />
                        <span className='text-xs'>Orqaga</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !orderData}
                        className='h-7 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg font-semibold shadow hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
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
