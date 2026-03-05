import { useEffect } from 'react';
import { X, User, Phone, DollarSign } from 'lucide-react';
import { Input, Label } from '../ui/Input';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import NumberInput from '../ui/NumberInput';

const PHONE_PREFIX = '+998';
const PHONE_MASK = '+998 ** *** ** **';

function formatPhoneWithMask(localDigits: string): string {
    const digits = localDigits.replace(/\D/g, '').slice(0, 9);
    if (digits.length === 0) return PHONE_PREFIX + ' ';
    if (digits.length <= 2) return `${PHONE_PREFIX} ${digits}`;
    if (digits.length <= 5) return `${PHONE_PREFIX} ${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 7) return `${PHONE_PREFIX} ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    return `${PHONE_PREFIX} ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
}

function digitsOnly(str: string): string {
    return str.replace(/\D/g, '');
}

function toLocalDigits(full: string): string {
    const d = digitsOnly(full);
    if (d.startsWith('998')) return d.slice(3).slice(0, 9);
    return d.slice(0, 9);
}

function parsePhoneToDisplay(phone: string): string {
    const local = toLocalDigits(phone);
    if (local.length === 0) return PHONE_PREFIX + ' ';
    return formatPhoneWithMask(local);
}

interface Customer {
    id: string;
    name: string;
    phone?: string;
    total_debt?: number;
}

const customerSchema = z.object({
    name: z.string().min(1, 'Ism kiritilishi shart'),
    phone: z.string().refine(
        (val) => {
            const local = toLocalDigits(val);
            return local.length === 0 || local.length === 9;
        },
        { message: 'Telefon 9 ta raqamdan iborat bo\'lishi kerak' }
    ).refine(
        (val) => {
            const local = toLocalDigits(val);
            return local.length > 0;
        },
        { message: 'Telefon raqami kiritilishi shart' }
    ),
    total_debt: z.string().optional(),
});

type FormValues = z.input<typeof customerSchema>;

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: Omit<Customer, 'id'>) => void;
    initialData?: Customer;
}

export function CustomerModal({
    isOpen,
    onClose,
    onSave,
    initialData
}: CustomerModalProps) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(customerSchema),
        mode: 'onSubmit',
        defaultValues: {
            name: initialData?.name || '',
            phone: initialData?.phone ? parsePhoneToDisplay(initialData.phone) : PHONE_PREFIX + ' ',
            total_debt: initialData?.total_debt ? initialData.total_debt.toString() : '',
        },
    });

    useEffect(() => {
        if (isOpen) {
            reset({
                name: initialData?.name || '',
                phone: initialData?.phone ? parsePhoneToDisplay(initialData.phone) : PHONE_PREFIX + ' ',
                total_debt: initialData?.total_debt ? initialData.total_debt.toString() : '',
            });
        }
    }, [initialData, isOpen, reset]);

    const onSubmit = (data: FormValues) => {
        const phoneToSave = (() => {
            const local = toLocalDigits(data.phone);
            if (local.length === 0) return undefined;
            return PHONE_PREFIX + local;
        })();

        const totalDebtValue = data.total_debt && data.total_debt.trim() !== '' 
            ? parseFloat(data.total_debt) 
            : undefined;

        onSave({
            name: data.name.trim(),
            phone: phoneToSave || undefined,
            total_debt: !isNaN(totalDebtValue as number) ? totalDebtValue : undefined,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-indigo-200">
                <div className="flex justify-between items-center p-2 sm:p-3 border-b border-indigo-100 bg-indigo-50">
                    <h3 className="text-base font-bold text-gray-900">
                        {initialData ? 'Kontaktni tahrirlash' : 'Yangi kontakt'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-indigo-600 hover:bg-white p-1.5 rounded-lg transition-all duration-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-3 space-y-3 bg-white">
                    <div>
                        <Label htmlFor="name" className="block text-xs text-indigo-600 mb-1 ml-1 font-semibold">
                            Ism *
                        </Label>
                        <div className="relative">
                            <User className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id="name"
                                        type="text"
                                        placeholder="Kontakt ismi"
                                        className={`pl-9 ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                                        autoFocus
                                    />
                                )}
                            />
                        </div>
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1 ml-1">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="phone" className="block text-xs text-indigo-600 mb-1 ml-1 font-semibold">
                            Telefon *
                        </Label>
                        <div className="relative">
                            <Phone className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => {
                                    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                        const raw = e.target.value;
                                        if (raw.length > 0 && !/^[\d\s+]+$/.test(raw)) return;
                                        const local = toLocalDigits(raw);
                                        const formatted = formatPhoneWithMask(local);
                                        field.onChange(formatted);
                                    };

                                    return (
                                        <Input
                                            {...field}
                                            id="phone"
                                            type="tel"
                                            placeholder={PHONE_MASK}
                                            onChange={handlePhoneChange}
                                            className={`pl-9 ${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                                            maxLength={17}
                                        />
                                    );
                                }}
                            />
                        </div>
                        {errors.phone && (
                            <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="total_debt" className="block text-xs text-indigo-600 mb-1 ml-1 font-semibold">
                            Qarzi ($)
                        </Label>
                        <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                            <Controller
                                name="total_debt"
                                control={control}
                                render={({ field }) => (
                                    <NumberInput
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        placeholder="0.00"
                                        className={`pl-9 ${errors.total_debt ? 'border-red-500 focus:border-red-500' : ''}`}
                                        allowDecimal={true}
                                    />
                                )}
                            />
                        </div>
                        {errors.total_debt && (
                            <p className="text-red-500 text-xs mt-1 ml-1">{errors.total_debt.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-8 px-3 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 font-semibold text-xs transition-all duration-200"
                        >
                            Bekor qilish
                        </button>
                        <button
                            type="submit"
                            className="h-8 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-xs flex items-center shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            <span className="mr-1.5">✓</span> Saqlash
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
