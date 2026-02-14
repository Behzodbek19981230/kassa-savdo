import { useState, useEffect } from 'react';
import { X, User, Phone } from 'lucide-react';
import { Input, Label } from '../ui/Input';

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
}

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
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setPhone(initialData.phone ? parsePhoneToDisplay(initialData.phone) : PHONE_PREFIX + ' ');
        } else {
            setName('');
            setPhone(PHONE_PREFIX + ' ');
        }
        setPhoneError('');
    }, [initialData, isOpen]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw.length > 0 && !/^[\d\s+]+$/.test(raw)) return;
        const local = toLocalDigits(raw);
        const formatted = formatPhoneWithMask(local);
        setPhone(formatted);
        setPhoneError(local.length > 0 && local.length !== 9 ? 'Telefon 9 ta raqamdan iborat bo‘lishi kerak' : '');
    };

    const getPhoneForSave = (): string | undefined => {
        const local = toLocalDigits(phone);
        if (local.length === 0) return undefined;
        return PHONE_PREFIX + local;
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const phoneToSave = getPhoneForSave();
        const localLen = toLocalDigits(phone).length;
        if (localLen > 0 && localLen !== 9) {
            setPhoneError('Telefon 9 ta raqamdan iborat bo‘lishi kerak');
            return;
        }
        setPhoneError('');
        if (name.trim()) {
            onSave({
                name: name.trim(),
                phone: phoneToSave || undefined,
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-indigo-200">
                <div className="flex justify-between items-center p-5 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <h3 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Kontaktni tahrirlash' : 'Yangi kontakt'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-indigo-600 hover:bg-white p-2 rounded-xl transition-all duration-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
                    <div>
                        <Label htmlFor="name" className="block text-xs text-indigo-600 mb-2 ml-1 font-semibold">
                            Ism *
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                            <Input
                                id="name"
                                type="text"
                                placeholder="Kontakt ismi"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-11"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="phone" className="block text-xs text-indigo-600 mb-2 ml-1 font-semibold">
                            Telefon
                        </Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                            <Input
                                id="phone"
                                type="tel"
                                placeholder={PHONE_MASK}
                                value={phone}
                                onChange={handlePhoneChange}
                                className="pl-11"
                                maxLength={17}
                            />
                        </div>
                        {phoneError && (
                            <p className="text-red-500 text-xs mt-1 ml-1">{phoneError}</p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border-2 border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 font-semibold transition-all duration-200"
                        >
                            Bekor qilish
                        </button>
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold flex items-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            <span className="mr-2">✓</span> Saqlash
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
