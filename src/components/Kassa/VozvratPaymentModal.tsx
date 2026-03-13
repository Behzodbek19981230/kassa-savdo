import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { Label } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { NumberInput } from '../ui/NumberInput';
import { vozvratOrderService } from '../../services/orderService';
import { showError, showSuccess } from '../../lib/toast';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

interface VozvratPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    totalAmount: number;
    totalCount: number;
    usdRate: number;
    orderData?: any | null;
    onOrderUpdate?: (order: any) => void;
}

// Zod validatsiya schema - form string qiymatlar bilan ishlaydi
const vozvratPaymentSchema = z.object({
    summaDollar: z.string().min(1, 'Maydon bo\'sh bo\'lmasligi kerak').refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0;
    }, 'Summa 0 dan kichik bo\'lmasligi kerak'),
    summaSom: z.string().min(1, 'Maydon bo\'sh bo\'lmasligi kerak').refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0;
    }, 'Summa 0 dan kichik bo\'lmasligi kerak'),
    summaKarta: z.string().min(1, 'Maydon bo\'sh bo\'lmasligi kerak').refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0;
    }, 'Summa 0 dan kichik bo\'lmasligi kerak'),
    date: z.date().optional(),
    note: z.string().optional(),
}).refine(
    (data) => {
        // Kamida bitta to'lov usuli 0 dan katta bo'lishi kerak
        const summaDollarNum = Number(data.summaDollar || 0);
        const summaSomNum = Number(data.summaSom || 0);
        const summaKartaNum = Number(data.summaKarta || 0);
        return summaDollarNum > 0 || summaSomNum > 0 || summaKartaNum > 0;
    },
    {
        message: 'Kamida bitta to\'lov usulini kiriting (0 dan katta)',
        path: ['payment'], // Xato payment maydoniga qo'shiladi
    }
);

type VozvratPaymentFormData = z.infer<typeof vozvratPaymentSchema>;

export function VozvratPaymentModal({
    isOpen,
    onClose,
    onComplete,
    totalAmount,
    totalCount,
    usdRate,
    orderData,
    onOrderUpdate,
}: VozvratPaymentModalProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(true);
    const [summaTotalDollar, setSummaTotalDollar] = useState<string>('');

    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        reset,
    } = useForm<VozvratPaymentFormData>({
        resolver: zodResolver(vozvratPaymentSchema),
        defaultValues: {
            summaDollar: '',
            summaSom: '',
            summaKarta: '',
            date: new Date(),
            note: '',
        },
    });

    // Watch form values
    const summaDollar = watch('summaDollar');
    const summaSom = watch('summaSom');
    const summaKarta = watch('summaKarta');
    const date = watch('date');

    // Jami qaytarilgan summa ($) avtomatik: summaDollar + (summaSom + summaKarta) / kurs
    useEffect(() => {
        const d = Number(summaDollar || 0);
        const s = Number(summaSom || 0);
        const k = Number(summaKarta || 0);
        const rate = usdRate || 1;
        const total = d + (s + k) / rate;
        if (total > 0) {
            const formatted = Math.max(0, total).toFixed(2);
            setSummaTotalDollar(formatted);
        } else {
            setSummaTotalDollar('');
        }
    }, [summaDollar, summaSom, summaKarta, usdRate]);

    // OrderData o'zgarganda default qiymatlarni yuklash (yangilash uchun)
    useEffect(() => {
        if (orderData && isOpen) {
            reset({
                date: orderData.date ? new Date(orderData.date) : new Date(),
                note: orderData.note || '',
                summaDollar: orderData.summa_dollar != null && orderData.summa_dollar > 0 ? String(orderData.summa_dollar) : '',
                summaSom: orderData.summa_naqt != null && orderData.summa_naqt > 0 ? String(orderData.summa_naqt) : '',
                summaKarta: orderData.summa_transfer != null && orderData.summa_transfer > 0 ? String(orderData.summa_transfer) : '',
            });
        } else if (!orderData && isOpen) {
            // Yangi vozvrat uchun barcha maydonlarni bo'sh qilish
            reset({
                summaDollar: '',
                summaSom: '',
                summaKarta: '',
                date: new Date(),
                note: '',
            });
            setSummaTotalDollar('');
        }
    }, [orderData, isOpen, reset]);

    const onSubmit = async (data: VozvratPaymentFormData) => {
        if (!orderData) {
            showError('Order ma\'lumotlari topilmadi');
            return;
        }

        // Summalarni hisoblash (string dan number ga o'tkazish)
        const summaDollarNum = Number(data.summaDollar || 0);
        const summaSomNum = Number(data.summaSom || 0);
        const summaKartaNum = Number(data.summaKarta || 0);
        const summaTotalDollarNum = Number(summaTotalDollar || 0);

        // Agar barcha summalar 0 bo'lsa, is_karzinka true bo'lishi kerak
        const allSumsZero = summaDollarNum === 0 && summaSomNum === 0 && summaKartaNum === 0;
        const shouldBeKarzinka = allSumsZero || !isConfirmed;

        setIsSubmitting(true);
        try {
            const updateData: any = {
                date: data.date ? data.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                note: data.note || '',
                summa_total_dollar: summaTotalDollarNum,
                summa_dollar: summaDollarNum,
                summa_naqt: summaSomNum,
                summa_transfer: summaKartaNum,
                is_karzinka: shouldBeKarzinka,
            };
            console.log(updateData);


            await vozvratOrderService.returnVozvratOrder(orderData.id, updateData);
            showSuccess('Vozvrat muvaffaqiyatli tasdiqlandi');
            onOrderUpdate?.(updateData);

            // Ro'yxatni yangilash
            queryClient.invalidateQueries({ queryKey: ['vozvrat-orders-grouped'] });

            onComplete?.();
            onClose();
            navigate('/tovar-qaytarish');
        } catch (error: any) {
            console.error('Failed to update vozvrat order:', error);
            const errorMessage = error?.response?.data?.detail || error?.message || 'Vozvratni tasdiqlashda xatolik';
            showError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50' />
                <Dialog.Content className='fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border-2 border-indigo-200 z-50 overflow-hidden'>
                    {/* Header */}
                    <div className='flex justify-between items-center p-4 sm:p-5 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50'>
                        <h2 className='text-lg sm:text-xl font-bold text-gray-900'>Vozvrat qilish</h2>
                        <button
                            onClick={onClose}
                            className='text-gray-500 hover:text-indigo-600 hover:bg-white p-2 rounded-xl transition-all duration-200'
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
                        <div className='space-y-6'>
                            {/* Umumiy ma'lumotlar */}
                            <div className='grid grid-cols-2 gap-4 mb-6'>
                                <div className='bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border-2 border-red-200'>
                                    <Label className='block text-xs text-red-600 mb-2 font-semibold'>
                                        Umumiy soni:
                                    </Label>
                                    <p className='text-2xl font-bold text-red-700'>{totalCount}</p>
                                </div>
                                <div className='bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border-2 border-red-200'>
                                    <Label className='block text-xs text-red-600 mb-2 font-semibold'>
                                        Umumiy narxi ($):
                                    </Label>
                                    <p className='text-2xl font-bold text-red-700'>{totalAmount.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Sana */}
                            <div>
                                <Label className='block text-xs text-indigo-600 mb-2 ml-1 font-semibold'>
                                    Sana
                                </Label>
                                <DatePicker
                                    date={date}
                                    onDateChange={(newDate) => setValue('date', newDate || new Date())}
                                    placeholder='Sana tanlang'
                                    className='w-full'
                                />
                            </div>

                            {/* Payment Fields Grid */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {/* Jami qaytarilgan summa ($) */}
                                <div className='bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border-2 border-indigo-200'>
                                    <Label className='block text-indigo-600 text-sm font-semibold mb-2'>
                                        Jami qaytarilgan summa ($)
                                    </Label>
                                    <div className='relative'>
                                        <NumberInput
                                            value={summaTotalDollar}
                                            onChange={() => { }}
                                            allowDecimal={true}
                                            placeholder=''
                                            className='w-full border-2 border-indigo-200 focus:border-2 focus:border-indigo-500 py-2 pr-12 text-right font-semibold text-base rounded-lg focus:bg-indigo-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                                            disabled
                                        />
                                        <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none'>
                                            USD
                                        </span>
                                    </div>
                                </div>

                                {/* Qaytarilgan summa ($) */}
                                <div className='bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border-2 border-emerald-200'>
                                    <Label className='block text-emerald-600 text-sm font-semibold mb-2'>
                                        Qaytarilgan summa ($) <span className='text-red-500'>*</span>
                                    </Label>
                                    <div className='relative'>
                                        <NumberInput
                                            value={summaDollar}
                                            onChange={(val) => setValue('summaDollar', val)}
                                            allowDecimal={true}
                                            placeholder=''
                                            className={`w-full border-2 ${errors.summaDollar || (errors as any).payment ? 'border-red-400' : 'border-emerald-200'} focus:border-2 focus:border-emerald-500 py-2 pr-12 text-right font-semibold text-base rounded-lg focus:bg-emerald-50/50 focus-visible:ring-0 focus-visible:ring-offset-0`}
                                        />
                                        <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none'>
                                            USD
                                        </span>
                                    </div>
                                    {errors.summaDollar && (
                                        <p className='text-red-500 text-xs mt-1'>{errors.summaDollar.message}</p>
                                    )}
                                    {(errors as any).payment && (
                                        <p className='text-red-500 text-xs mt-1'>{(errors as any).payment.message}</p>
                                    )}
                                </div>

                                {/* Qaytarilgan summa so'mda */}
                                <div className='bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200'>
                                    <Label className='block text-blue-600 text-sm font-semibold mb-2'>
                                        Qaytarilgan summa so'mda <span className='text-red-500'>*</span>
                                    </Label>
                                    <div className='relative'>
                                        <NumberInput
                                            value={summaSom}
                                            onChange={(val) => setValue('summaSom', val)}
                                            allowDecimal={false}
                                            placeholder=''
                                            className={`w-full border-2 ${errors.summaSom || (errors as any).payment ? 'border-red-400' : 'border-blue-200'} focus:border-2 focus:border-blue-500 py-2 pr-12 text-right font-semibold text-base rounded-lg focus:bg-blue-50/50 focus-visible:ring-0 focus-visible:ring-offset-0`}
                                        />
                                        <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none'>
                                            UZS
                                        </span>
                                    </div>
                                    {errors.summaSom && (
                                        <p className='text-red-500 text-xs mt-1'>{errors.summaSom.message}</p>
                                    )}
                                    {(errors as any).payment && (
                                        <p className='text-red-500 text-xs mt-1'>{(errors as any).payment.message}</p>
                                    )}
                                </div>

                                {/* Qaytarilgan summa kartada */}
                                <div className='bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200'>
                                    <Label className='block text-purple-600 text-sm font-semibold mb-2'>
                                        Qaytarilgan summa kartada <span className='text-red-500'>*</span>
                                    </Label>
                                    <div className='relative'>
                                        <NumberInput
                                            value={summaKarta}
                                            onChange={(val) => setValue('summaKarta', val)}
                                            allowDecimal={false}
                                            placeholder=''
                                            className={`w-full border-2 ${errors.summaKarta || (errors as any).payment ? 'border-red-400' : 'border-purple-200'} focus:border-2 focus:border-purple-500 py-2 pr-12 text-right font-semibold text-base rounded-lg focus:bg-purple-50/50 focus-visible:ring-0 focus-visible:ring-offset-0`}
                                        />
                                        <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none'>
                                            UZS
                                        </span>
                                    </div>
                                    {errors.summaKarta && (
                                        <p className='text-red-500 text-xs mt-1'>{errors.summaKarta.message}</p>
                                    )}
                                    {(errors as any).payment && (
                                        <p className='text-red-500 text-xs mt-1'>{(errors as any).payment.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Izoh */}
                            <div>
                                <Label className='block text-xs text-indigo-600 mb-2 ml-1 font-semibold'>
                                    Izoh
                                </Label>
                                <textarea
                                    {...register('note')}
                                    placeholder='Izoh kiriting...'
                                    className='w-full px-3 py-2 text-sm border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all duration-200'
                                    rows={3}
                                />
                            </div>

                            {/* Tasdiqlash */}
                            <div className='flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200'>
                                <input
                                    type='checkbox'
                                    id='confirm'
                                    checked={isConfirmed}
                                    onChange={(e) => setIsConfirmed(e.target.checked)}
                                    className='w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
                                />
                                <Label htmlFor='confirm' className='text-sm font-semibold text-gray-700 cursor-pointer'>
                                    Tasdiqlash:
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className='border-t border-gray-200 p-3 flex justify-end'>
                        <form onSubmit={handleSubmit(onSubmit)} className='w-full'>
                            <button
                                type='submit'
                                disabled={isSubmitting || !orderData}
                                className='bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className='animate-spin' />
                                        <span>Tasdiqlanmoqda...</span>
                                    </>
                                ) : (
                                    <span>Vozvratni tasdiqlash</span>
                                )}
                            </button>
                        </form>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
