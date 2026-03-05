import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { Label } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { NumberInput } from '../ui/NumberInput';
import { vozvratOrderService } from '../../services/orderService';
import { showError, showSuccess } from '../../lib/toast';
import { useNavigate } from 'react-router-dom';

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [summaTotalDollar, setSummaTotalDollar] = useState<string>('0');
    const [summaDollar, setSummaDollar] = useState<string>('0');
    const [summaSom, setSummaSom] = useState<string>('0');
    const [summaKarta, setSummaKarta] = useState<string>('0');
    const [note, setNote] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(true);

    // Jami qaytarilgan summa ($) avtomatik: summaDollar + (summaSom + summaKarta) / kurs
    useEffect(() => {
        const d = Number(summaDollar || 0);
        const s = Number(summaSom || 0);
        const k = Number(summaKarta || 0);
        const rate = usdRate || 1;
        const total = d + (s + k) / rate;
        const formatted = Math.max(0, total).toFixed(2);
        setSummaTotalDollar(formatted);
    }, [summaDollar, summaSom, summaKarta, usdRate]);

    // OrderData o'zgarganda default qiymatlarni yuklash (0 bo'lsa ham 0 qoladi)
    useEffect(() => {
        if (orderData && isOpen) {
            setDate(orderData.date ? new Date(orderData.date) : new Date());
            setNote(orderData.note || '');
            setSummaDollar(orderData.summa_dollar != null ? String(orderData.summa_dollar) : '0');
            setSummaSom(orderData.summa_naqt != null ? String(orderData.summa_naqt) : '0');
            setSummaKarta(orderData.summa_transfer != null ? String(orderData.summa_transfer) : '0');
            // summaTotalDollar avto hisoblanadi, orderData dan yuklamaymiz
        }
    }, [orderData, isOpen]);

    const handleSubmit = async () => {
        if (!orderData) {
            showError('Order ma\'lumotlari topilmadi');
            return;
        }

        setIsSubmitting(true);
        try {
            const updateData: any = {
                date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                note: note || '',
                summa_total_dollar: Number(summaTotalDollar || 0),
                summa_dollar: Number(summaDollar || 0),
                summa_naqt: Number(summaSom || 0),
                summa_transfer: Number(summaKarta || 0),
                is_karzinka: !isConfirmed,
            };

            await vozvratOrderService.returnVozvratOrder(orderData.id, updateData);
            showSuccess('Vozvrat muvaffaqiyatli tasdiqlandi');
            onOrderUpdate?.(updateData);
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
                                    onDateChange={setDate}
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
                                            onChange={() => {}}
                                            allowDecimal={true}
                                            placeholder='0'
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
                                        Qaytarilgan summa ($)
                                    </Label>
                                    <div className='relative'>
                                        <NumberInput
                                            value={summaDollar}
                                            onChange={(val) => setSummaDollar(val)}
                                            allowDecimal={true}
                                            placeholder='0'
                                            className='w-full border-2 border-emerald-200 focus:border-2 focus:border-emerald-500 py-2 pr-12 text-right font-semibold text-base rounded-lg focus:bg-emerald-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                                        />
                                        <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none'>
                                            USD
                                        </span>
                                    </div>
                                </div>

                                {/* Qaytarilgan summa so'mda */}
                                <div className='bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200'>
                                    <Label className='block text-blue-600 text-sm font-semibold mb-2'>
                                        Qaytarilgan summa so'mda
                                    </Label>
                                    <div className='relative'>
                                        <NumberInput
                                            value={summaSom}
                                            onChange={(val) => setSummaSom(val)}
                                            allowDecimal={false}
                                            placeholder='0'
                                            className='w-full border-2 border-blue-200 focus:border-2 focus:border-blue-500 py-2 pr-12 text-right font-semibold text-base rounded-lg focus:bg-blue-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                                        />
                                        <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none'>
                                            UZS
                                        </span>
                                    </div>
                                </div>

                                {/* Qaytarilgan summa kartada */}
                                <div className='bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200'>
                                    <Label className='block text-purple-600 text-sm font-semibold mb-2'>
                                        Qaytarilgan summa kartada
                                    </Label>
                                    <div className='relative'>
                                        <NumberInput
                                            value={summaKarta}
                                            onChange={(val) => setSummaKarta(val)}
                                            allowDecimal={false}
                                            placeholder='0'
                                            className='w-full border-2 border-purple-200 focus:border-2 focus:border-purple-500 py-2 pr-12 text-right font-semibold text-base rounded-lg focus:bg-purple-50/50 focus-visible:ring-0 focus-visible:ring-offset-0'
                                        />
                                        <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 pointer-events-none'>
                                            UZS
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Izoh */}
                            <div>
                                <Label className='block text-xs text-indigo-600 mb-2 ml-1 font-semibold'>
                                    Izoh
                                </Label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
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
                        <button
                            onClick={handleSubmit}
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
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
