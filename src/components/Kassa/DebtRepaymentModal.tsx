import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Label } from '../ui/Input';
import NumberInput from '../ui/NumberInput';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '../ui/DatePicker';
import { Autocomplete, AutocompleteOption } from '../ui/Autocomplete';
import { debtRepaymentService, DebtRepaymentRequest } from '../../services/orderService';
import { clientService, Client } from '../../services/clientService';
import { showError, showSuccess } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';

interface DebtRepaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function DebtRepaymentModal({ isOpen, onClose, onSuccess }: DebtRepaymentModalProps) {
    const { user } = useAuth();
    const { displayRate } = useExchangeRate();
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [, setIsSearchingClients] = useState(false);
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
    const [summaKilik, setSummaKilik] = useState<string>('0');
    const [zdachaDollar, setZdachaDollar] = useState<string>('0');
    const [zdachaSom, setZdachaSom] = useState<string>('0');

    const exchangeRate = displayRate;
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

    // react-hook-form setup (inline validation)
    interface FormValues {
        note?: string;
        summaTotalDollar: string;
        discountAmount: string;
        summaDollar: string;
        summaSom: string;
        summaKarta: string;
        summaTerminal: string;
        summaKilik: string;
        zdachaDollar: string;
        zdachaSom: string;
    }

    const {
        control,
        handleSubmit: rhfHandleSubmit,
        formState: { errors },
        setValue,
        reset,
    } = useForm<FormValues>({
        mode: 'onChange',
        defaultValues: {
            note,
            summaTotalDollar,
            discountAmount,
            summaDollar,
            summaSom,
            summaKarta,
            summaTerminal,
            summaKilik,
            zdachaDollar,
            zdachaSom,
        },
    });

    // Qaytim dollar kiritilganda qaytim so'm avtomatik to'ldiriladi (kurs bo'yicha)
    useEffect(() => {
        const zdD = Number(zdachaDollar || 0);
        const rate = exchangeRate || 1;
        const zdachaSomVal = (zdD * rate).toFixed(0);
        setZdachaSom(zdachaSomVal);
        try {
            setValue('zdachaSom', zdachaSomVal);
        } catch (err) {
            // ignore
        }
    }, [zdachaDollar, exchangeRate, setValue]);

    // Auto-calculate total in dollars: to'lovlar - chegirma - qaytim (dollar va so'm)
    useEffect(() => {
        const d = Number(summaDollar || 0);
        const s = Number(summaSom || 0);
        const k = Number(summaKarta || 0);
        const t = Number(summaTerminal || 0);
        const kilik = Number(summaKilik || 0);
        const disc = Number(discountAmount || 0);
        const zdD = Number(zdachaDollar || 0);
        const rate = exchangeRate || 1;
        const total = d + (s + k + t + kilik) / rate - disc - zdD;
        const final = Math.max(0, total);
        const formatted = final.toFixed(2);
        setSummaTotalDollar(formatted);
        try {
            setValue('summaTotalDollar', formatted);
        } catch (err) {
            // ignore if setValue not available for any reason
        }
    }, [
        summaDollar,
        summaSom,
        summaKarta,
        summaTerminal,
        summaKilik,
        discountAmount,
        zdachaDollar,
        exchangeRate,
        setValue,
    ]);

    const autocompleteOptions: AutocompleteOption[] = clients.map((client) => ({
        id: client.id.toString(),
        label: `${client.full_name}${client.phone_number ? ` (${client.phone_number})` : ''}`,
        value: client.id.toString(),
    }));

    // Formani tozalash
    const resetForm = () => {
        setSelectedClient(null);
        setDate(new Date());
        // reset form-controlled values
        reset({
            note: '',
            summaTotalDollar: '0',
            discountAmount: '0',
            summaDollar: '0',
            summaSom: '0',
            summaKarta: '0',
            summaTerminal: '0',
            summaKilik: '0',
            zdachaDollar: '0',
            zdachaSom: '0',
        });
        setNote('');
        setSummaTotalDollar('0');
        setDiscountAmount('0');
        setSummaDollar('0');
        setSummaSom('0');
        setSummaKarta('0');
        setSummaTerminal('0');
        setSummaKilik('0');
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
    const handleSubmit = async (formData?: any) => {
        // formData will be provided by react-hook-form via rhfHandleSubmit
        const data = formData as {
            note: string;
            summaTotalDollar: string;
            discountAmount: string;
            summaDollar: string;
            summaSom: string;
            summaKarta: string;
            summaTerminal: string;
            summaKilik: string;
            zdachaDollar: string;
            zdachaSom: string;
        };

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
                Number(data?.summaSom || 0) +
                Number(data?.summaDollar || 0) * exchangeRate +
                Number(data?.summaKarta || 0) +
                Number(data?.summaTerminal || 0) +
                Number(data?.summaKilik || 0);

            const newTotalDebt = Math.max(0, oldTotalDebt - totalPaid + Number(data?.discountAmount || 0));

            const payload: DebtRepaymentRequest = {
                filial: user.order_filial,
                client: selectedClient.id,
                employee: user.id || 0,
                exchange_rate: exchangeRate,
                date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                note: data?.note,
                old_total_debt_client: oldTotalDebt,
                total_debt_client: newTotalDebt,
                summa_total_dollar: Number(data?.summaTotalDollar || 0),
                summa_dollar: Number(data?.summaDollar || 0),
                summa_naqt: Number(data?.summaSom || 0),
                summa_kilik: Number(data?.summaKilik || 0),
                summa_terminal: Number(data?.summaTerminal || 0),
                summa_transfer: Number(data?.summaKarta || 0),
                discount_amount: Number(data?.discountAmount || 0),
                zdacha_dollar: Number(data?.zdachaDollar || 0),
                zdacha_som: Number(data?.zdachaSom || 0),
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
                <Dialog.Content className='fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-indigo-200 z-50 overflow-hidden'>
                    {/* Header */}
                    <div className='flex justify-between items-center p-2 sm:p-3 border-b border-indigo-100 bg-indigo-50'>
                        <div className='flex items-center gap-2'>
                            <h2 className='text-base sm:text-lg font-bold text-gray-900'>Qarz to'lash</h2>
                            <div className='hidden sm:flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm ml-2'>
                                <span className='text-xs font-semibold text-gray-700'>Kurs:</span>
                                <span className='text-xs font-bold text-indigo-700'>
                                    1 USD = {exchangeRate.toLocaleString()} UZS
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className='text-gray-500 hover:text-indigo-600 hover:bg-white p-1.5 rounded-lg transition-all duration-200'
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className='flex-1 overflow-y-auto p-3'>
                        <div className='space-y-3'>
                            {/* Mijoz tanlash va Qarz */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
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
                                    />
                                </div>
                                <div className='flex items-end'>
                                    <div className='w-full'>
                                        <Label className='block text-xs text-red-600 mb-1 ml-1 font-semibold'>
                                            Qarzi ($)
                                        </Label>
                                        <div className='px-2 py-1.5 bg-red-50 border border-red-200 rounded-lg'>
                                            <span className='text-sm font-bold text-red-700'>
                                                {clientDebt.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Toggle Switch + Sana (moved right of status) */}
                            <div className='flex items-center justify-between gap-4'>
                                <div className='w-48'>
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
                                <div className='flex items-center gap-2'>
                                    <span className='text-xs font-semibold text-gray-700'>Holati:</span>
                                    <button
                                        type='button'
                                        onClick={() => setDebtStatus(!debtStatus)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${debtStatus ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${debtStatus ? 'translate-x-5' : 'translate-x-0.5'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                                {/* Jami Summa ($) */}
                                <div>
                                    <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                        Jami Summa ($) <span className='text-red-600'>*</span>
                                    </Label>
                                    <Controller
                                        control={control}
                                        name='summaTotalDollar'
                                        rules={{
                                            required: 'Jami Summa ($) majburiy',
                                            min: { value: 0.01, message: 'Kamida 0.01 bo`lishi kerak' },
                                        }}
                                        render={({ field }) => (
                                            <NumberInput
                                                value={field.value}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    setSummaTotalDollar(val);
                                                }}
                                                allowDecimal={true}
                                                placeholder='0.00'
                                                className='w-full'
                                                aria-required='true'
                                                disabled
                                            />
                                        )}
                                    />
                                    {errors.summaTotalDollar && (
                                        <p className='text-rose-600 text-xs mt-1'>{errors.summaTotalDollar.message}</p>
                                    )}
                                </div>

                                {/* Summa ($) */}
                                <div>
                                    <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                        Summa ($) <span className='text-red-600'>*</span>
                                    </Label>
                                    <Controller
                                        control={control}
                                        name='summaDollar'
                                        rules={{
                                            required: 'Summa ($) majburiy',
                                            min: { value: 0.01, message: 'Kamida 0.01 bo`lishi kerak' },
                                        }}
                                        render={({ field }) => (
                                            <NumberInput
                                                value={field.value}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    setSummaDollar(val);
                                                }}
                                                allowDecimal={true}
                                                placeholder='0.00'
                                                className='w-full'
                                                aria-required='true'
                                            />
                                        )}
                                    />
                                    {errors.summaDollar && (
                                        <p className='text-rose-600 text-xs mt-1'>{errors.summaDollar.message}</p>
                                    )}
                                </div>

                                {/* Summa so'm */}
                                <div>
                                    <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                        Summa so'm <span className='text-red-600'>*</span>
                                    </Label>
                                    <Controller
                                        control={control}
                                        name='summaSom'
                                        render={({ field }) => (
                                            <NumberInput
                                                value={field.value}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    setSummaSom(val);
                                                }}
                                                allowDecimal={true}
                                                placeholder='0'
                                                className='w-full'
                                                aria-required='true'
                                            />
                                        )}
                                    />
                                </div>

                                {/* Summa karta */}
                                <div>
                                    <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                        Summa karta <span className='text-red-600'>*</span>
                                    </Label>
                                    <Controller
                                        control={control}
                                        name='summaKarta'
                                        rules={{ required: 'Summa karta majburiy' }}
                                        render={({ field }) => (
                                            <NumberInput
                                                value={field.value}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    setSummaKarta(val);
                                                }}
                                                allowDecimal={true}
                                                placeholder='0'
                                                className='w-full'
                                                aria-required='true'
                                            />
                                        )}
                                    />
                                    {errors.summaKarta && (
                                        <p className='text-rose-600 text-xs mt-1'>{errors.summaKarta.message}</p>
                                    )}
                                </div>

                                {/* Summa terminal */}
                                <div>
                                    <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                        Summa terminal <span className='text-red-600'>*</span>
                                    </Label>
                                    <Controller
                                        control={control}
                                        name='summaTerminal'
                                        rules={{ required: 'Summa terminal majburiy' }}
                                        render={({ field }) => (
                                            <NumberInput
                                                value={field.value}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    setSummaTerminal(val);
                                                }}
                                                allowDecimal={true}
                                                placeholder='0'
                                                className='w-full'
                                                aria-required='true'
                                            />
                                        )}
                                    />
                                    {errors.summaTerminal && (
                                        <p className='text-rose-600 text-xs mt-1'>{errors.summaTerminal.message}</p>
                                    )}
                                </div>

                                {/* Summa kilik */}
                                <div>
                                    <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                        Summa kilik
                                    </Label>
                                    <Controller
                                        control={control}
                                        name='summaKilik'
                                        render={({ field }) => (
                                            <NumberInput
                                                value={field.value}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    setSummaKilik(val);
                                                }}
                                                allowDecimal={true}
                                                placeholder='0'
                                                className='w-full'
                                            />
                                        )}
                                    />
                                </div>

                                {/* Chegirma ($) */}
                                <div>
                                    <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                        Chegirma ($)
                                    </Label>
                                    <Controller
                                        control={control}
                                        name='discountAmount'
                                        render={({ field }) => (
                                            <NumberInput
                                                value={field.value}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    setDiscountAmount(val);
                                                }}
                                                allowDecimal={true}
                                                placeholder='0.00'
                                                className='w-full'
                                            />
                                        )}
                                    />
                                </div>

                                {/* Qaytim ($) */}
                                <div>
                                    <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                        Qaytim ($)
                                    </Label>
                                    <Controller
                                        control={control}
                                        name='zdachaDollar'
                                        render={({ field }) => (
                                            <NumberInput
                                                value={field.value}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    setZdachaDollar(val);
                                                }}
                                                allowDecimal={true}
                                                placeholder='0.00'
                                                className='w-full'
                                            />
                                        )}
                                    />
                                </div>

                                {/* Qaytim so'm */}
                                <div>
                                    <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                        Qaytim so'm
                                    </Label>
                                    <Controller
                                        control={control}
                                        name='zdachaSom'
                                        render={({ field }) => (
                                            <NumberInput
                                                disabled
                                                value={field.value}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    setZdachaSom(val);
                                                }}
                                                allowDecimal={true}
                                                placeholder='0'
                                                className='w-full'
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Izoh */}
                            <div>
                                <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                    Izoh (ixtiyoriy)
                                </Label>
                                <Controller
                                    control={control}
                                    name='note'
                                    render={({ field }) => (
                                        <textarea
                                            {...field}
                                            placeholder='Izoh kiriting...'
                                            className='w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
                                            rows={3}
                                            onChange={(e) => {
                                                field.onChange(e.target.value);
                                                setNote(e.target.value);
                                            }}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className='border-t border-gray-200 p-2 sm:p-3 flex justify-end gap-2'>
                        <button
                            onClick={onClose}
                            className='h-7 px-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 text-xs transition-colors'
                        >
                            Bekor qilish
                        </button>
                        <button
                            onClick={rhfHandleSubmit(handleSubmit)}
                            disabled={isSubmitting || !selectedClient}
                            className='h-7 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                        >
                            {isSubmitting ? (
                                <>
                                    <div className='w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
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
