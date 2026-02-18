import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { Input, Label } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { vozvratOrderService } from '../../services/orderService';
import { showError, showSuccess } from '../../lib/toast';
import { useNavigate } from 'react-router-dom';
import { USD_RATE } from '../../constants';

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

    // OrderData o'zgarganda default qiymatlarni yuklash
    useEffect(() => {
        if (orderData && isOpen) {
            setDate(orderData.date ? new Date(orderData.date) : new Date());
            setNote(orderData.note || '');
            setSummaTotalDollar(orderData.summa_total_dollar ? String(orderData.summa_total_dollar) : '0');
            setSummaDollar(orderData.summa_dollar ? String(orderData.summa_dollar) : '0');
            setSummaSom(orderData.summa_naqt ? String(orderData.summa_naqt) : '0');
            setSummaKarta(orderData.summa_transfer ? String(orderData.summa_transfer) : '0');
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
                note: note,
                summa_total_dollar: Number(summaTotalDollar || 0),
                summa_dollar: Number(summaDollar || 0),
                summa_naqt: Number(summaSom || 0),
                summa_transfer: Number(summaKarta || 0),
                is_karzinka: !isConfirmed,
            };

            await vozvratOrderService.updateVozvratOrder(orderData.id, updateData);
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
                        <div className='space-y-4'>
                            {/* Umumiy ma'lumotlar */}
                            <div className='grid grid-cols-2 gap-4 mb-4'>
                                <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                                    <Label className='block text-xs text-red-600 mb-1 ml-1 font-semibold'>
                                        Umumiy soni:
                                    </Label>
                                    <p className='text-lg font-bold text-red-700'>{totalCount}</p>
                                </div>
                                <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                                    <Label className='block text-xs text-red-600 mb-1 ml-1 font-semibold'>
                                        Umumiy narxi ($):
                                    </Label>
                                    <p className='text-lg font-bold text-red-700'>{totalAmount.toFixed(2)}</p>
                                </div>
                            </div>

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

                            {/* Jami qaytarilgan summa ($) */}
                            <div>
                                <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                    Jami qaytarilgan summa ($)
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

                            {/* Qaytarilgan summa ($) */}
                            <div>
                                <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                    Qaytarilgan summa ($)
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

                            {/* Qaytarilgan summa so'mda */}
                            <div>
                                <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                    Qaytarilgan summa so'mda
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

                            {/* Qaytarilgan summa kartada */}
                            <div>
                                <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                    Qaytarilgan summa kartada
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

                            {/* Izoh */}
                            <div>
                                <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                    Izoh
                                </Label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder='Izoh kiriting...'
                                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none'
                                    rows={3}
                                />
                            </div>

                            {/* Tasdiqlash */}
                            <div className='flex items-center gap-3'>
                                <input
                                    type='checkbox'
                                    id='confirm'
                                    checked={isConfirmed}
                                    onChange={(e) => setIsConfirmed(e.target.checked)}
                                    className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
                                />
                                <Label htmlFor='confirm' className='text-sm font-semibold text-gray-700 cursor-pointer'>
                                    Tasdiqlash:
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className='border-t border-gray-200 p-4 sm:p-5 flex justify-end'>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !orderData}
                            className='bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
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
