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
import { formatMoney } from '../../lib/utils';

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
        usd: '',
        cash: '',
        card: '',
        terminal: '',
    });
    const receiptRef = useRef<HTMLDivElement>(null);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const [note, setNote] = useState('');
    const [driverInfo, setDriverInfo] = useState('');
    const [_isVozvrat, setIsVozvrat] = useState(false);
    const [orderStatusChecked, setOrderStatusChecked] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const [discountAmount, setDiscountAmount] = useState<string>('');
    const [zdachaDollar, setZdachaDollar] = useState<string>('');
    const [zdachaSom, setZdachaSom] = useState<string>('');
    const [paymentFieldErrors, setPaymentFieldErrors] = useState<string[]>([]);
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



    const formatUsdAmount = (val: number) => formatMoney(Math.abs(Number(val)) < 0.005 ? 0 : val);
    const discountNum = parseFloat(discountAmount) || 0;
    // all_product_summa is stored/sent in USD. Use it as base USD total when present;
    // otherwise convert `totalAmount` (UZS) to USD as fallback.
    // Agar orderData mavjud bo'lsa va all_product_summa mavjud bo'lsa, uni ishlatish kerak (USD da)
    // Aks holda, items dan yoki totalAmount dan hisoblash kerak
    const baseTotalUsd = (() => {
        if (orderData?.all_product_summa) {
            const parsed = parseFloat(String(orderData.all_product_summa)) || 0;
            if (parsed > 0) return parsed;
        }
        // Agar items mavjud bo'lsa va ular quantity va price_dollar ga ega bo'lsa, ularni hisoblaymiz
        // price_dollar birlik narx, quantity = count
        if (items && items.length > 0) {
            const totalFromItems = items.reduce(
                (sum, item) => {
                    const priceDollar = Number(item.price_dollar) || 0;
                    const quantity = Number(item.quantity || 0) || 0;
                    return sum + priceDollar * quantity;
                },
                0,
            );
            if (totalFromItems > 0) return totalFromItems;
        }
        // Fallback: totalAmount UZS da, uni USD ga aylantiramiz
        return usdRate > 0 ? totalAmount / usdRate : 0;
    })();
    // amount to pay in USD (base USD total minus discount in USD)
    const amountToPayUsd = baseTotalUsd - discountNum;
    const amountToPay = amountToPayUsd * usdRate; // UZS
    const zdachaUzs = (parseFloat(zdachaDollar) || 0) * usdRate;
    const remaining = amountToPay - paidAmount + zdachaUzs; // manfiy = qaytim kerak, zdacha kiritilsa kamayadi
    const usdAmount = formatUsdAmount(amountToPayUsd);

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

    // Jami to'landi (har doim UZS da): naqd/card/terminal = so'm, dollar = USD* kurs
    const getPaidAmountInUzs = (methods: { [key: string]: string }) => {
        const cash = parseFloat(methods.cash || '') || 0;
        const usd = parseFloat(methods.usd || '') || 0;
        const card = parseFloat(methods.card || '') || 0;
        const terminal = parseFloat(methods.terminal || '') || 0;
        return cash + usd * usdRate + card + terminal;
    };

    const handleMethodAmountChange = (methodId: string, amount: string) => {
        const next = { ...selectedMethods, [methodId]: amount };
        setSelectedMethods(next);
        setPaidAmount(getPaidAmountInUzs(next));
        setPaymentFieldErrors((prev) => prev.filter((id) => id !== methodId));
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

    // Qaytim dollar kiritilganda qaytim so'm avtomatik to'ldiriladi
    useEffect(() => {
        const zdD = parseFloat(zdachaDollar) || 0;
        setZdachaSom((zdD * usdRate).toFixed(0));
    }, [zdachaDollar, usdRate]);

    const handleComplete = async () => {
        if (orderData) {
            // Validatsiya: barcha to'lov usullariga kamida 0 kiritilishi shart
            const methodKeys = ['usd', 'cash', 'card', 'terminal'];
            const emptyFields = methodKeys.filter((k) => {
                const v = selectedMethods[k];
                return v == null || String(v).trim() === '';
            });
            if (emptyFields.length > 0) {
                setPaymentFieldErrors(emptyFields);
                showError("Barcha to'lov usullariga kamida 0 kiriting.");
                return;
            }
            setPaymentFieldErrors([]);

            setIsCompleting(true);
            try {
                // Normalize empty payment method fields to '0'
                const normalizedMethods = { ...selectedMethods };
                methodKeys.forEach((k) => {
                    if (normalizedMethods[k] == null || normalizedMethods[k] === '') normalizedMethods[k] = '0';
                });
                if (JSON.stringify(normalizedMethods) !== JSON.stringify(selectedMethods)) {
                    setSelectedMethods(normalizedMethods);
                }

                // Ensure discount and zdacha fields are at least '0'
                if (discountAmount === '') setDiscountAmount('0');
                if (zdachaDollar === '') setZdachaDollar('0');
                if (zdachaSom === '') setZdachaSom('0');

                // Payment methods ni API polylariga map qilish
                const summa_naqt = parseFloat(normalizedMethods.cash || '') || 0;
                const summa_dollar = parseFloat(normalizedMethods.usd || '') || 0;
                const summa_transfer = parseFloat(normalizedMethods.card || '') || 0;
                const summa_terminal = parseFloat(normalizedMethods.terminal || '') || 0;

                // Compute totals:
                // - `summa_total_dollar` should be sum of all payment methods in USD
                //   summa_dollar (USD) + (summa_naqt + summa_transfer + summa_terminal) / usdRate
                // - `all_product_summa` should be total product sum in USD (baseTotalUsd)
                const summa_total_dollar = summa_dollar + (summa_naqt + summa_transfer + summa_terminal) / usdRate;

                // all_product_summa - mahsulotlar jami narxi USD da
                const totalDollarFromItems =
                    items.length > 0
                        ? items.reduce(
                            (s, i) => {
                                const priceDollar = Number(i.price_dollar) || 0;
                                const quantity = Number(i.quantity || 0) || 0;
                                return s + priceDollar * quantity;
                            },
                            0,
                        )
                        : baseTotalUsd; // Agar items bo'lmasa, baseTotalUsd dan foydalanamiz
                const all_product_summa = totalDollarFromItems; // USD (send all_product_summa in USD)

                const updateData = {
                    is_karzinka: false,
                    note: note,
                    driver_info: driverInfo,
                    summa_naqt: summa_naqt,
                    summa_dollar: summa_dollar,
                    summa_transfer: summa_transfer,
                    summa_terminal: summa_terminal,
                    summa_total_dollar: summa_total_dollar,
                    all_product_summa: all_product_summa,
                    // order_status va vozvrat/is_debtor_product
                    order_status: orderStatusChecked,
                    // discountAmount input is in USD in UI — send discount in USD (all_product_summa is USD)
                    discount_amount: parseFloat(discountAmount || '0') || 0,
                    zdacha_dollar: parseFloat(zdachaDollar || '0') || 0,
                    zdacha_som: parseFloat(zdachaSom || '0') || 0,
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
                <Dialog.Content className='fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-indigo-200 z-50 overflow-hidden p-2'>
                    {/* Header */}
                    <div className='flex justify-between items-center p-2 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 shrink-0'>
                        <div className='flex items-center gap-2'>
                            <div className='flex items-center gap-1.5 bg-white/80 border border-indigo-200 rounded-lg px-2 py-1 shadow-sm'>
                                <span className='text-[10px] font-medium text-gray-600'>Kurs:</span>
                                <span className='text-xs font-bold text-indigo-700'>
                                    1 USD = {formatMoney(usdRate)} UZS
                                </span>
                            </div>
                        </div>
                        <div className='flex items-center gap-1.5'>
                            <label
                                htmlFor='orderStatus'
                                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 shadow-sm border cursor-pointer transition-all ${orderStatusChecked
                                    ? 'bg-green-600 border-green-400'
                                    : 'bg-red-600 border-red-400 animate-pulse'
                                    }`}
                            >
                                <input
                                    type='checkbox'
                                    id='orderStatus'
                                    checked={orderStatusChecked}
                                    onChange={(e) => setOrderStatusChecked(e.target.checked)}
                                    className='w-3 h-3 text-white border border-white rounded focus:ring-0 cursor-pointer accent-white'
                                />
                                <span className='text-[11px] font-bold text-white select-none'>Tasdiqlandimi?</span>
                            </label>
                        </div>
                    </div>

                    {/* Content - scroll */}
                    <div className='p-3 bg-white overflow-y-auto flex-1 min-h-0'>
                        {/* Totals */}
                        <div className='grid grid-cols-3 gap-2 mb-3'>
                            <div className='bg-indigo-50 p-2 rounded-lg border border-indigo-200'>
                                <p className='text-gray-600 mb-1 text-[10px] font-medium'>To'lanishi kerak:</p>
                                <p className='text-lg font-bold text-indigo-700'>
                                    {usdAmount} <span className='text-[10px] font-normal text-indigo-400'>USD</span>
                                </p>
                                <p className='text-sm font-bold text-indigo-600 mt-0.5'>
                                    {formatMoney(amountToPay)}{' '}
                                    <span className='text-[10px] font-normal text-indigo-500'>UZS</span>
                                </p>
                            </div>
                            <div className='bg-emerald-50 p-2 rounded-lg border border-emerald-200'>
                                <p className='text-gray-600 mb-1 text-[10px] font-medium'>To'landi:</p>
                                <p className='text-lg font-bold text-emerald-600'>
                                    {formatUsdAmount(paidAmount / usdRate)}{' '}
                                    <span className='text-[10px] font-normal text-emerald-400'>USD</span>
                                </p>
                                <p className='text-sm font-bold text-emerald-500 mt-0.5'>
                                    {formatMoney(paidAmount)}{' '}
                                    <span className='text-[10px] font-normal text-emerald-500'>UZS</span>
                                </p>
                            </div>
                            <div
                                className={`p-2 rounded-lg border ${remaining < 0 ? 'bg-orange-50 border-orange-200' : remaining > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}
                            >
                                <p className='text-gray-600 mb-1 text-[10px] font-medium'>
                                    {remaining < 0 ? 'Qaytim:' : 'Qoldi:'}
                                </p>
                                <p
                                    className={`text-lg font-bold ${remaining < 0 ? 'text-orange-600' : remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                                >
                                    {formatUsdAmount(Math.abs(remaining) / usdRate)}{' '}
                                    <span
                                        className={`text-[10px] font-normal ${remaining < 0 ? 'text-orange-500' : remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
                                    >
                                        USD
                                    </span>
                                </p>
                                <p
                                    className={`text-sm font-bold mt-0.5 ${remaining < 0 ? 'text-orange-600' : remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                                >
                                    {formatMoney(Math.abs(remaining))}{' '}
                                    <span
                                        className={`text-[10px] font-normal ${remaining < 0 ? 'text-orange-500' : remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
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
                                const hasError = paymentFieldErrors.includes(method.id);
                                return (
                                    <div
                                        key={method.id}
                                        className={`border rounded-lg overflow-hidden shadow-sm hover:shadow transition-all duration-200 ${hasError
                                            ? 'border-red-500 ring-1 ring-red-200'
                                            : isSelected
                                                ? 'border-indigo-400 ring-1 ring-indigo-200'
                                                : 'border-indigo-200'
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
                                                    onChange={(val) => handleMethodAmountChange(method.id, val)}
                                                    allowDecimal={method.unit === 'USD'}
                                                    placeholder={'0'}
                                                    className={`w-full py-1 pr-8 text-right font-semibold text-xs rounded focus:bg-indigo-50/50 focus-visible:ring-0 focus-visible:ring-offset-0 ${hasError
                                                        ? 'border-2 border-red-500 focus:border-red-500 bg-red-50/50'
                                                        : 'border border-indigo-200 focus:border focus:border-indigo-500'
                                                        }`}
                                                />
                                                <span className='absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none'>
                                                    {method.unit}
                                                </span>
                                            </div>
                                            {hasError && (
                                                <p className='text-[10px] text-red-600 mt-0.5'>Kamida 0 kiriting</p>
                                            )}
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
                                        onChange={(val) => setDiscountAmount(val)}
                                        allowDecimal={true}
                                        placeholder=''
                                        className='w-full border border-amber-200 focus:border focus:border-amber-500 py-1 pr-10 text-right font-semibold text-xs rounded focus:bg-amber-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                                    />
                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none'>
                                        USD
                                    </span>
                                </div>
                            </div>

                            {/* Qaytim dollarda */}
                            <div className='bg-green-50 p-2 rounded-lg border border-green-200'>
                                <label className='block text-green-600 text-[10px] font-semibold mb-1'>
                                    Qaytim dollarda
                                </label>
                                <div className='relative'>
                                    <NumberInput
                                        value={zdachaDollar}
                                        onChange={(val) => setZdachaDollar(val)}
                                        allowDecimal={true}
                                        placeholder=''
                                        className='w-full border border-green-200 focus:border focus:border-green-500 py-1 pr-10 text-right font-semibold text-xs rounded focus:bg-green-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                                    />
                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none'>
                                        USD
                                    </span>
                                </div>
                            </div>

                            {/* Qaytim so'mda (avto to'ldiriladi, disabled) */}
                            <div className='bg-blue-50 p-2 rounded-lg border border-blue-200'>
                                <label className='block text-blue-600 text-[10px] font-semibold mb-1'>
                                    Qaytim so'mda
                                </label>
                                <div className='relative'>
                                    <NumberInput
                                        value={zdachaSom}
                                        onChange={(val) => setZdachaSom(val)}
                                        allowDecimal={true}
                                        placeholder=''
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
                        {orderData && (
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
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder='Izoh kiriting (ixtiyoriy)...'
                                        className='w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none'
                                        rows={2}
                                    />
                                </div>

                                {/* Yetkazib beruvchi maydoni */}
                                <div className='bg-purple-50 p-2 rounded-lg border border-purple-200'>
                                    <div className='flex items-center mb-1.5'>
                                        <Truck size={14} className='mr-1.5 text-purple-600' />
                                        <span className='text-purple-600 text-[10px] font-semibold'>
                                            Yetkazib beruvchi
                                        </span>
                                        <span className='text-[9px] text-gray-500 ml-1'>(ixtiyoriy)</span>
                                    </div>
                                    <textarea
                                        value={driverInfo}
                                        onChange={(e) => setDriverInfo(e.target.value)}
                                        placeholder="Yetkazib beruvchi ma'lumotlari (ixtiyoriy)..."
                                        className='w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent resize-none'
                                        rows={2}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer with Close and Complete buttons (below content) */}
                    <div className='p-2 border-t bg-white flex justify-between items-center gap-2 shrink-0'>
                        <button
                            onClick={onClose}
                            className='h-7 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-1.5'
                        >
                            <X size={14} />
                            <span className='text-xs'>Yopish</span>
                        </button>
                        <button
                            onClick={handleComplete}
                            disabled={isCompleting || !orderData}
                            className='h-7 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg font-semibold shadow hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
                        >
                            {isCompleting ? (
                                <>
                                    <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                    <span className='text-xs'>Saqlanmoqda...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={14} />
                                    <span className='text-xs'>Tugallash</span>
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
