import { useEffect, useRef, useState, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Banknote, CreditCard, AlertTriangle, Pencil, ChevronLeft, Printer, User } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { pdfService } from '../../services/pdfService';
import { OrderResponse } from '../../types';
import { showError, showSuccess } from '../../lib/toast';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';
import { Input } from '../ui/Input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatMoney } from '../../lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { useRole } from '@/hooks/useRole';

interface ProductByModel {
    model_id: number;
    model: string;
    product: any[];
}

interface OrderProductsByModelResponse {
    order_history: OrderResponse;
    products: ProductByModel[];
}

export function OrderShowPage() {
    const { id } = useParams<{ id: string }>();
    const { displayRate } = useExchangeRate();
    const roles = useRole();
    const [data, setData] = useState<OrderProductsByModelResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const handleBack = () => window.history.back();

    /** PDF service orqali yuklab, yangi tabda ochish */
    const openPdfInNewTab = async (orderPk: number, type: 'client' | 'worker') => {
        try {
            const blob = await pdfService.getOrderHistoryPdf(orderPk, type);
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (e: any) {
            console.error('PDF yuklash xatosi', e);
            showError(e?.response?.data?.detail || e?.message || 'PDF yuklashda xatolik');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const response = await orderService.getOrderProductsByModel(parseInt(id));
                setData(response);
            } catch (error: any) {
                console.error('Failed to load order data:', error);
                const errorMessage =
                    error?.response?.data?.detail || error?.message || "Ma'lumotlarni yuklashda xatolik";
                showError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (isLoading) {
        return (
            <div className='flex items-center justify-center h-full'>
                <Loader2 className='w-8 h-7 animate-spin text-indigo-600' />
            </div>
        );
    }

    if (!data) {
        return <div className='p-6 text-center text-gray-500'>Ma'lumotlar topilmadi</div>;
    }

    const { order_history, products } = data;
    const usdRate = order_history?.exchange_rate != null ? Number(order_history.exchange_rate) : displayRate;

    const totalPaidUSD = Number(order_history?.summa_total_dollar);
    function GivenCountCell({
        productId,
        count,
        givenCount,
        onUpdated,
        canEdit,
    }: {
        productId: number;
        count: number;
        givenCount: number;
        onUpdated: (productId: number, newValue: number) => void;
        canEdit: boolean;
    }) {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(String(givenCount));
        const [isSaving, setIsSaving] = useState(false);
        const inputRef = useRef<HTMLInputElement | null>(null);
        const isDifferent = givenCount !== count;
        const roles = useRole();

        useEffect(() => {
            if (isEditing && inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, [isEditing]);

        const handleSave = async () => {
            const parsed = Number(value);
            if (isNaN(parsed) || parsed < 0) {
                setValue(String(givenCount));
                setIsEditing(false);
                return;
            }
            if (parsed === givenCount) {
                setIsEditing(false);
                return;
            }
            setIsSaving(true);
            try {
                const response = await orderService.updateGivenCount(productId, parsed);
                console.log(response);
                onUpdated(productId, parsed);
                showSuccess(`Berilgan soni: ${parsed}`);
            } catch (err: any) {
                console.error(err);
                showError('Berilgan sonini yangilashda xatolik');
                setValue(String(givenCount));
            } finally {
                setIsSaving(false);
                setIsEditing(false);
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
                setValue(String(givenCount));
                setIsEditing(false);
            }
        };

        if (isEditing) {
            return (
                <div className='flex items-center justify-end gap-1'>
                    <Input
                        ref={inputRef}
                        type='number'
                        min={0}
                        value={value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => handleSave()}
                        disabled={isSaving}
                        className='h-7 w-20 text-right text-sm px-1.5 '
                    />
                    {isSaving && <Loader2 className='h-3.5 w-3.5 animate-spin text-gray-500' />}
                </div>
            );
        }

        // Faqat sklad_manager / admin / super_admin tahrirlashi mumkin
        if (!canEdit) {
            return (
                <div className='flex items-center justify-end gap-1.5'>
                    <Badge variant={isDifferent ? 'destructive' : 'default'} className='text-base font-bold'>
                        <span className='text-sm'>{givenCount}</span>
                    </Badge>
                    {isDifferent && (
                        <AlertTriangle
                            className='h-4.5 w-4.5 text-red-500 flex-shrink-0'
                            aria-label={`Soni: ${count}, Berilgan: ${givenCount}`}
                        />
                    )}
                </div>
            );
        }

        return (
            <div
                className='flex items-center justify-end gap-1.5 cursor-pointer group/cell'
                onClick={() => setIsEditing(true)}
                title='Bosib tahrirlang'
            >
                <Badge variant={isDifferent ? 'destructive' : 'default'} className='text-base font-bold'>
                    <span className='text-sm'>{givenCount}</span>
                </Badge>
                {isDifferent && (
                    <AlertTriangle
                        className='h-4.5 w-4.5 text-red-500 flex-shrink-0'
                        aria-label={`Soni: ${count}, Berilgan: ${givenCount}`}
                    />
                )}
                <span className='inline-flex items-center justify-center h-6 w-6 rounded bg-gray-100 text-gray-600 opacity-0 group-hover/cell:opacity-100 transition-opacity'>
                    <Pencil className='h-3.5 w-3.5' />
                </span>
            </div>
        );
    }
    /** Update given_count locally after successful API call */
    const handleGivenCountUpdated = (productId: number, newValue: number) => {
        setData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                products: prev.products.map((group) => ({
                    ...group,
                    product: group.product.map((p: any) => (p.id === productId ? { ...p, given_count: newValue } : p)),
                })),
            };
        });
    };

    return (
        <div className='h-full overflow-y-auto p-2 sm:p-3'>
            {/* Price Difference Alert */}
            {(roles.isAdmin || roles.isSuperAdmin) && order_history.price_difference && (
                <div className='bg-orange-100 border-2 border-orange-400 rounded-lg p-2 mb-3 flex items-center gap-3'>
                    <AlertTriangle className='h-6 w-6 text-orange-600 flex-shrink-0' />
                    <div>
                        <p className='font-bold text-orange-800 text-sm'>Mahsulot narxida tafovut aniqlandi!</p>
                    </div>
                </div>
            )}

            {/* Order History Ma'lumotlari */}
            <div className='bg-white rounded-lg shadow-md p-2 sm:p-3 mb-2'>
                <div className='flex flex-col sm:flex-row items-center justify-between gap-2 mb-2 pb-1.5 border-b border-gray-200'>
                    {/* Left: client name + phone */}
                    <div className='flex items-center gap-3 min-w-0'>
                        <div className='min-w-0'>
                            <div className='text-sm font-semibold text-gray-800 truncate'>
                                {order_history.client_detail?.full_name || "Noma'lum"}
                            </div>
                            <div className='text-xs text-gray-500 truncate'>
                                {order_history.client_detail?.phone_number || ''}
                            </div>
                        </div>
                    </div>

                    {/* Center: timestamp (hidden on very small screens) */}
                    <div className='hidden sm:block text-xs text-gray-500'>
                        <div className='text-xs text-gray-500'>Buyurtma vaqti:</div>

                        {order_history.created_time
                            ? new Date(order_history.created_time).toLocaleTimeString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })
                            : '—'}
                    </div>

                    {/* Right: compact actions */}
                    <div className='flex items-center gap-1.5'>
                        <Button
                            variant='ghost'
                            size='sm'
                            className='px-1.5 py-1 flex items-center gap-1'
                            onClick={handleBack}
                        >
                            <ChevronLeft className='h-3.5 w-3.5 text-rose-600' />
                            <span className='text-xs text-rose-700'>Orqaga</span>
                        </Button>

                        <Button
                            variant='outline'
                            size='sm'
                            className='px-1.5 py-1 flex items-center gap-1'
                            onClick={() => id && openPdfInNewTab(parseInt(id), 'worker')}
                        >
                            <Printer className='h-3.5 w-3.5 text-indigo-600' />
                            <span className='text-xs text-indigo-700'>Hodim uchun</span>
                        </Button>

                        <Button
                            variant='outline'
                            size='sm'
                            className='px-1.5 py-1 flex items-center gap-1'
                            onClick={() => id && openPdfInNewTab(parseInt(id), 'client')}
                        >
                            <User className='h-3.5 w-3.5 text-emerald-600' />
                            <span className='text-xs text-emerald-700'>Mijoz uchun</span>
                        </Button>
                    </div>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-2'>
                    {/* Kassir */}
                    <div className='bg-green-50 p-1.5 rounded border border-green-200'>
                        <p className='text-[9px] font-semibold text-green-600 mb-0.5 uppercase tracking-wide'>Kassir</p>
                        <p className='font-bold text-gray-800 text-xs mb-0.5'>
                            {order_history.created_by_detail?.full_name || "Noma'lum"}
                        </p>
                        <p className='text-xs text-gray-600'>{order_history.created_by_detail?.phone_number || ''}</p>
                    </div>

                    {/* Dollar kursi */}
                    <div className='bg-gradient-to-br from-cyan-50 to-teal-50 p-2 rounded border border-cyan-200'>
                        <p className='text-[10px] font-semibold text-cyan-600 mb-1 uppercase tracking-wide'>
                            Dollar kursi
                        </p>
                        <p className='font-bold text-gray-800 text-xs'>
                            {usdRate > 0 ? Number(usdRate).toLocaleString() : '-'}
                        </p>
                    </div>

                    {/* Jami to'lanadigan summa */}
                    {(() => {
                        const allProductSummaUSD = Number(order_history.all_product_summa || 0);
                        const discountAmountUSD = Number(order_history.discount_amount || 0);
                        const payableUSD = allProductSummaUSD;

                        return (
                            <div className='bg-gradient-to-br from-indigo-50 to-blue-50 p-2 rounded border-2 border-indigo-300'>
                                <p className='text-[10px] font-semibold text-indigo-600 mb-1 uppercase tracking-wide'>
                                    Jami to'lanadigan summa ($)
                                </p>
                                <p className='text-xs font-semibold text-indigo-600'>{formatMoney(payableUSD)} USD</p>
                            </div>
                        );
                    })()}

                    {/* To'langan summa */}
                    <div className='bg-gradient-to-br from-indigo-50 to-blue-50 p-2 rounded border-2 border-indigo-300'>
                        <p className='text-[10px] font-semibold text-indigo-600 mb-1 uppercase tracking-wide'>
                            To'langan summa ($)
                        </p>
                        <p className='text-xs font-semibold text-indigo-600'>{formatMoney(totalPaidUSD)} USD</p>
                    </div>

                    {/* Chegirma */}
                    <div className='bg-gradient-to-br from-rose-50 to-red-50 p-2 rounded border border-rose-200'>
                        <p className='text-[10px] font-semibold text-rose-600 mb-1 uppercase tracking-wide'>
                            Chegirma ($)
                        </p>
                        <p className='font-bold text-rose-700 text-base mb-0.5'>
                            {formatMoney(Number(order_history.discount_amount || 0))} USD
                        </p>
                        <p className='text-xs font-semibold text-rose-600'>
                            {usdRate > 0
                                ? formatMoney(Number(order_history.discount_amount || 0) * usdRate)
                                : formatMoney(Number(order_history.discount_amount || 0))}{' '}
                            UZS
                        </p>
                    </div>

                    {/* Foyda */}
                    {(roles.isSuperAdmin || roles.isAdmin) && (
                        <div className='bg-gradient-to-br from-emerald-50 to-green-50 p-2 rounded border border-emerald-200'>
                            <p className='text-[10px] font-semibold text-emerald-600 mb-1 uppercase tracking-wide'>
                                Foyda ($)
                            </p>
                            <p className='font-bold text-emerald-700 text-base mb-0.5'>
                                {formatMoney(Number(order_history.all_profit_dollar || 0))} USD
                            </p>
                            <p className='text-xs font-semibold text-emerald-600'>
                                {usdRate > 0
                                    ? formatMoney(Number(order_history.all_profit_dollar || 0) * usdRate)
                                    : '-'}{' '}
                                UZS
                            </p>
                        </div>
                    )}

                    {/* Qolgan qarz */}
                    {(() => {
                        const totalDebtClient = Number(order_history.total_debt_client || 0);

                        return (
                            <div className='bg-gradient-to-br from-red-50 to-pink-50 p-2 rounded border border-red-200'>
                                <p className='text-[10px] font-semibold text-red-600 mb-1 uppercase tracking-wide'>
                                    Qolgan qarz ($)
                                </p>
                                <p className='font-bold text-red-700 text-base mb-0.5'>
                                    {formatMoney(totalDebtClient)} USD
                                </p>
                                <p className='text-xs font-semibold text-red-600'>
                                    {usdRate > 0 ? (totalDebtClient * usdRate).toLocaleString() : '-'} UZS
                                </p>
                            </div>
                        );
                    })()}
                </div>
                <div className='mt-2 col-span-2'>
                    {/* To'lov usullari */}
                    <div>
                        <p className='text-[10px] font-semibold text-gray-600 mb-2 uppercase tracking-wide'>
                            To'lov usullari
                        </p>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2'>
                            {Number(order_history.summa_dollar || 0) > 0 && (
                                <div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
                                    <div className='bg-gradient-to-r from-green-700 to-emerald-800 text-white p-1.5 sm:p-2 flex justify-between items-center'>
                                        <div className='flex items-center space-x-1.5'>
                                            <div className='bg-green-100 p-1 rounded'>
                                                <Banknote className='text-green-700 w-3 h-3' />
                                            </div>
                                            <span className='font-medium text-[10px] sm:text-xs'>US dollar naqd</span>
                                        </div>
                                    </div>
                                    <div className='p-1.5 sm:p-2 bg-white'>
                                        <div className='text-right flex items-center justify-end gap-1'>
                                            <p className='font-semibold text-xs text-gray-800'>
                                                {formatMoney(Number(order_history.summa_dollar))}
                                            </p>
                                            <span className='text-[10px] font-medium text-gray-500'>USD</span>
                                            <p className='text-[10px] text-gray-600 mt-0.5'>
                                                ({formatMoney(Number(order_history.summa_dollar) * usdRate)} UZS)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {Number(order_history.summa_naqt || 0) > 0 && (
                                <div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
                                    <div className='bg-gradient-to-r from-lime-500 to-green-600 text-white p-1.5 sm:p-2 flex justify-between items-center'>
                                        <div className='flex items-center space-x-1.5'>
                                            <div className='bg-lime-100 p-1 rounded'>
                                                <Banknote className='text-lime-700 w-3 h-3' />
                                            </div>
                                            <span className='font-medium text-[10px] sm:text-xs'>Naqd</span>
                                        </div>
                                    </div>
                                    <div className='p-1.5 sm:p-2 bg-white'>
                                        <div className='text-right flex items-center justify-end gap-1'>
                                            <p className='font-semibold text-xs text-gray-800'>
                                                {formatMoney(Number(order_history.summa_naqt))}
                                            </p>
                                            <span className='text-[10px] font-medium text-gray-500'>UZS</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {Number(order_history.summa_transfer || 0) > 0 && (
                                <div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
                                    <div className='bg-gradient-to-r from-blue-400 to-cyan-500 text-white p-1.5 sm:p-2 flex justify-between items-center'>
                                        <div className='flex items-center space-x-1.5'>
                                            <div className='bg-blue-100 p-1 rounded'>
                                                <CreditCard className='text-blue-700 w-3 h-3' />
                                            </div>
                                            <span className='font-medium text-[10px] sm:text-xs'>Plastik perevod</span>
                                        </div>
                                    </div>
                                    <div className='p-1.5 sm:p-2 bg-white'>
                                        <div className='text-right flex items-center justify-end gap-1'>
                                            <p className='font-semibold text-xs text-gray-800'>
                                                {formatMoney(Number(order_history.summa_transfer))}
                                            </p>
                                            <span className='text-[10px] font-medium text-gray-500'>UZS</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {Number(order_history.summa_terminal || 0) > 0 && (
                                <div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
                                    <div className='bg-gradient-to-r from-blue-400 to-cyan-500 text-white p-1.5 sm:p-2 flex justify-between items-center'>
                                        <div className='flex items-center space-x-1.5'>
                                            <div className='bg-blue-100 p-1 rounded'>
                                                <CreditCard className='text-blue-700 w-3 h-3' />
                                            </div>
                                            <span className='font-medium text-[10px] sm:text-xs'>Terminal</span>
                                        </div>
                                    </div>
                                    <div className='p-1.5 sm:p-2 bg-white'>
                                        <div className='text-right flex items-center justify-end gap-1'>
                                            <p className='font-semibold text-xs text-gray-800'>
                                                {formatMoney(Number(order_history.summa_terminal))}
                                            </p>
                                            <span className='text-[10px] font-medium text-gray-500'>UZS</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className='mt-2 col-span-2'>
                    {/* Qaytim */}
                    {(Number(order_history.zdacha_dollar || 0) > 0 || Number(order_history.zdacha_som || 0) > 0) && (
                        <div className='bg-gradient-to-br from-yellow-50 to-amber-50 p-2 rounded border border-yellow-200'>
                            <p className='text-[10px] font-semibold text-yellow-600 mb-2 uppercase tracking-wide'>
                                Qaytim
                            </p>
                            <div className='grid grid-cols-2 gap-2'>
                                {Number(order_history.zdacha_dollar || 0) > 0 && (
                                    <div className='bg-white p-2 rounded border border-yellow-100'>
                                        <p className='text-[10px] text-gray-500 mb-0.5'>Qaytim dollarda</p>
                                        <p className='font-bold text-gray-800 text-xs'>
                                            {formatMoney(Number(order_history.zdacha_dollar))} USD
                                        </p>
                                    </div>
                                )}
                                {Number(order_history.zdacha_som || 0) > 0 && (
                                    <div className='bg-white p-2 rounded border border-yellow-100'>
                                        <p className='text-[10px] text-gray-500 mb-0.5'>Qaytim so'mda</p>
                                        <p className='font-bold text-gray-800 text-xs'>
                                            {formatMoney(Number(order_history.zdacha_som))} UZS
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className='mt-2 grid grid-cols-2 gap-2'>
                    {/* Izoh */}
                    {order_history.note && (
                        <div className='bg-gradient-to-br from-slate-50 to-gray-50 p-2 rounded border border-slate-200'>
                            <p className='text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide'>
                                Izoh
                            </p>
                            <p className='text-xs text-gray-800 whitespace-pre-wrap'>{order_history.note}</p>
                        </div>
                    )}

                    {/* Yetkazib beruvchi */}
                    {order_history.driver_info && (
                        <div className='bg-gradient-to-br from-teal-50 to-cyan-50 p-2 rounded border border-teal-200'>
                            <p className='text-[10px] font-semibold text-teal-600 mb-1 uppercase tracking-wide'>
                                Yetkazib beruvchi
                            </p>
                            <p className='text-xs text-gray-800 whitespace-pre-wrap'>{order_history.driver_info}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Productlar - Model bo'yicha guruhlangan */}
            <div className='bg-white rounded-lg shadow-md overflow-hidden mt-2'>
                <div className='overflow-x-auto'>
                    <table className='w-full border-collapse text-xs'>
                        <thead>
                            <tr className='bg-gray-50 border-b border-gray-200'>
                                <th className='px-2 py-1 text-left text-xs font-semibold text-gray-700 whitespace-nowrap min-w-[110px]'>
                                    Model
                                </th>
                                <th className='px-2 py-1 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-[60px]'>
                                    #
                                </th>
                                <th className='px-2 py-1 text-left text-xs font-semibold text-gray-700 whitespace-nowrap'>
                                    Joyi
                                </th>
                                <th className='px-2 py-1 text-left text-xs font-semibold text-gray-700 whitespace-nowrap'>
                                    Nomi
                                </th>
                                <th className='px-2 py-1 text-left text-xs font-semibold text-gray-700 whitespace-nowrap'>
                                    O'lchami
                                </th>
                                <th className='px-2 py-1 text-left text-xs font-semibold text-gray-700 whitespace-nowrap'>
                                    Tip
                                </th>
                                <th className='px-2 py-1 text-right text-xs font-semibold text-gray-700 whitespace-nowrap'>
                                    Soni
                                </th>
                                <th className='px-2 py-1 text-right text-xs font-semibold text-gray-700 whitespace-nowrap'>
                                    Berilgan soni
                                </th>
                                <th className='px-2 py-1 text-right text-xs font-semibold text-gray-700 whitespace-nowrap'>
                                    Narxi ($)
                                </th>
                                {(roles.isAdmin || roles.isSuperAdmin) && (
                                    <>
                                        <th className='px-2 py-1 text-right text-xs font-semibold text-gray-700 whitespace-nowrap'>
                                            Asl Narxi ($)
                                        </th>
                                        <th className='px-2 py-1 text-right text-xs font-semibold text-gray-700 whitespace-nowrap'>
                                            Foyda ($)
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((group) => {
                                let productIndex = 0;

                                return (
                                    <Fragment key={`group-${group.model_id}`}>
                                        {group.product.map((product, productIdx) => {
                                            productIndex++;
                                            const realPrice = Number(product.real_price || 0);
                                            const priceDollar = Number(product.price_dollar || 0);
                                            const count = Number(product.count || 0);
                                            const profit = (priceDollar - realPrice) * count;
                                            const isFirstInGroup = productIdx === 0;

                                            return (
                                                <tr
                                                    key={product.id}
                                                    className='border-b border-gray-100 hover:bg-gray-50 transition-colors even:bg-gray-100'
                                                >
                                                    {isFirstInGroup ? (
                                                        <td
                                                            rowSpan={group.product.length}
                                                            className='px-2 py-1 text-xs font-semibold text-gray-700 align-top border-r border-gray-200'
                                                        >
                                                            {group.model}
                                                        </td>
                                                    ) : null}
                                                    <td className='px-2 py-1 text-xs text-gray-600'>{productIndex}</td>
                                                    <td className='px-2 py-1 text-xs text-gray-800'>
                                                        {product.sklad_detail?.name || 'Ombor'}
                                                    </td>
                                                    <td className='px-2 py-1 text-xs text-gray-800'>
                                                        <span className='inline-flex items-center gap-1'>
                                                            {product.branch_category_detail?.name ||
                                                                product.type_detail?.name ||
                                                                '-'}
                                                        </span>
                                                    </td>
                                                    <td className='px-2 py-1 text-xs text-gray-800'>
                                                        {product.size_detail?.size || '-'}
                                                    </td>
                                                    <td className='px-2 py-1 text-xs text-gray-800'>
                                                        {product.type_detail?.name || '-'}
                                                    </td>
                                                    <td className='px-2 py-1 text-xs text-gray-800 text-right'>
                                                        {count}
                                                    </td>
                                                    <td className='px-2 py-1 text-xs text-gray-800 text-right'>
                                                        <GivenCountCell
                                                            productId={product.id}
                                                            count={count}
                                                            givenCount={Number(product.given_count || 0)}
                                                            onUpdated={handleGivenCountUpdated}
                                                            canEdit={
                                                                roles.isAdmin ||
                                                                roles.isSuperAdmin ||
                                                                roles.isSkladManager
                                                            }
                                                        />
                                                    </td>
                                                    <td className='px-2 py-1 text-xs text-gray-800 text-right'>
                                                        <span className='inline-flex items-center gap-1'>
                                                            {formatMoney(priceDollar)}
                                                            {(roles.isAdmin || roles.isSuperAdmin) &&
                                                                product.price_difference && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span className='inline-flex items-center text-orange-500'>
                                                                                <AlertTriangle size={16} />
                                                                            </span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className='!bg-orange-100 !text-orange-800 !border-orange-300'>
                                                                            Mahsulot narxida tafovut aniqlandi
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                        </span>
                                                    </td>
                                                    {(roles.isAdmin || roles.isSuperAdmin) && (
                                                        <>
                                                            <td className='px-2 py-1 text-xs text-gray-800 text-right'>
                                                                {formatMoney(realPrice)}
                                                            </td>
                                                            <td className='px-2 py-1 text-xs font-semibold text-green-600 text-right'>
                                                                {formatMoney(profit)}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                );
                            })}

                            {/* Grand Total */}
                            <tr className='bg-gray-300 border-t-2 border-gray-400'>
                                <td className='px-2 py-1 text-xs font-bold text-gray-800'>Jami:</td>
                                <td colSpan={5} className='px-2 py-1 text-xs font-bold text-gray-800'></td>
                                <td className='px-2 py-1 text-xs font-bold text-gray-800 text-right'>
                                    {products.reduce(
                                        (sum, g) => sum + g.product.reduce((s, p) => s + Number(p.count || 0), 0),
                                        0,
                                    )}
                                </td>
                                <td className='px-2 py-1 text-xs font-bold text-gray-800 text-right'>
                                    {products.reduce(
                                        (sum, g) => sum + g.product.reduce((s, p) => s + Number(p.given_count || 0), 0),
                                        0,
                                    )}
                                </td>
                                <td className='px-2 py-1 text-xs font-bold text-gray-800 text-right'>
                                    {formatMoney(
                                        products.reduce(
                                            (sum, g) =>
                                                sum +
                                                g.product.reduce(
                                                    (s, p) => s + Number(p.price_dollar || 0) * Number(p.count || 0),
                                                    0,
                                                ),
                                            0,
                                        ),
                                    )}
                                </td>
                                {(roles.isAdmin || roles.isSuperAdmin) && (
                                    <>
                                        <td className='px-2 py-1 text-xs font-bold text-gray-800 text-right'>
                                            {formatMoney(
                                                products.reduce(
                                                    (sum, g) =>
                                                        sum +
                                                        g.product.reduce(
                                                            (s, p) =>
                                                                s + Number(p.real_price || 0) * Number(p.count || 0),
                                                            0,
                                                        ),
                                                    0,
                                                ),
                                            )}
                                        </td>
                                        <td className='px-2 py-1 text-xs font-bold text-green-700 text-right'>
                                            {formatMoney(
                                                products.reduce(
                                                    (sum, g) =>
                                                        sum +
                                                        g.product.reduce((s, p) => {
                                                            const profit =
                                                                (Number(p.price_dollar || 0) -
                                                                    Number(p.real_price || 0)) *
                                                                Number(p.count || 0);
                                                            return s + profit;
                                                        }, 0),
                                                    0,
                                                ),
                                            )}
                                        </td>
                                    </>
                                )}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
