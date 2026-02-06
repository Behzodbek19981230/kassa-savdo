import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, X, Loader2, Save, FileText, Truck, Trash2 } from 'lucide-react';
import { Autocomplete, AutocompleteOption } from '../ui/Autocomplete';
import { CustomerModal } from './CustomerModal';
import { Customer } from './types';
import { clientService, Client } from '../../services/clientService';
import { showSuccess, showError, showLoading } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, OrderResponse } from '../../services/orderService';

interface OrderSummaryProps {
    totalAmount: number;
    usdRate: number;
    onPayment: () => void;
    onCustomerChange?: (customer: Customer | null) => void;
    isSaleStarted?: boolean;
    onStartSale?: (orderId: number) => void;
    orderData?: OrderResponse | null;
    isLoadingOrder?: boolean;
    onOrderUpdate?: (order: OrderResponse) => void;
}


export function OrderSummary({
    totalAmount,
    usdRate,
    onPayment,
    onCustomerChange,
    isSaleStarted = false,
    onStartSale,
    orderData,
    isLoadingOrder = false,
    onOrderUpdate
}: OrderSummaryProps) {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [note, setNote] = useState('');
    const [driverInfo, setDriverInfo] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [isSavingDriverInfo, setIsSavingDriverInfo] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    // Mijozlarni qidirish
    const searchClients = useCallback(async (query: string) => {
        setIsSearching(true);
        try {
            const response = await clientService.getClients(query || '');
            setClients(response.results.filter(client => client.is_active && !client.is_delete));
        } catch (error) {
            console.error('Failed to search clients:', error);
            setClients([]);
            // Faqat qidiruv bo'lsa error ko'rsatish
            if (query.trim()) {
                showError('Mijozlarni yuklashda xatolik yuz berdi');
            }
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Komponent mount bo'lganda barcha mijozlarni yuklash
    useEffect(() => {
        searchClients('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Qidiruv o'zgarganda API ga so'rov yuborish
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Qidiruv bo'lsa yoki bo'sh bo'lsa ham mijozlarni yuklash
            searchClients(searchQuery || '');
        }, 300); // Debounce 300ms

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const autocompleteOptions: AutocompleteOption[] = clients.map(client => ({
        id: client.id.toString(),
        label: `${client.full_name}${client.phone_number ? ` (${client.phone_number})` : ''}`,
        value: client.id.toString()
    }));

    // Mijoz tanlash
    const handleCustomerChange = (clientId: string) => {
        const id = parseInt(clientId);
        setSelectedClientId(id);
        const client = clients.find(c => c.id === id);
        if (client) {
            const customer: Customer = {
                id: client.id.toString(),
                name: client.full_name,
                phone: client.phone_number,
            };
            onCustomerChange?.(customer);
        }
    };

    // Yangi mijoz yaratish (full_name va phone_number bilan)
    const handleAddNewCustomer = async (name: string) => {
        // Name va phone ni ajratib olish
        // Format: "Ism Familiya +998901234567" yoki "Ism Familiya"
        const parts = name.trim().split(/\s+/);
        let fullName = name;
        let phoneNumber = '';

        // Telefon raqamini topish (oxirgi qismda bo'lishi mumkin)
        const phoneRegex = /\+?\d{9,13}/;
        const lastPart = parts[parts.length - 1];

        if (phoneRegex.test(lastPart)) {
            phoneNumber = lastPart;
            fullName = parts.slice(0, -1).join(' ');
        }

        if (!fullName.trim()) {
            fullName = name;
        }

        showLoading('Mijoz yaratilmoqda...');
        try {
            const newClient = await clientService.createClient({
                full_name: fullName,
                phone_number: phoneNumber || '',
                is_active: true,
                filial: user?.filials[0] || 0
            });

            const customer: Customer = {
                id: newClient.id.toString(),
                name: newClient.full_name,
                phone: newClient.phone_number,
            };

            setSelectedClientId(newClient.id);
            setClients([newClient, ...clients]);
            onCustomerChange?.(customer);
            showSuccess('Mijoz muvaffaqiyatli yaratildi');
        } catch (error: any) {
            console.error('Failed to create client:', error);
            const errorMessage = error?.response?.data?.detail || error?.message || 'Mijoz yaratishda xatolik yuz berdi';
            showError(errorMessage);
            // Xatolik bo'lsa, modal orqali yaratish
            setIsCustomerModalOpen(true);
            setEditingCustomer({
                id: '',
                name: fullName,
                phone: phoneNumber,
            });
        }
    };

    // Modal orqali mijoz yaratish/yangilash
    const handleSaveCustomer = async (customerData: Omit<Customer, 'id'>) => {
        if (!customerData.name.trim() || !customerData.phone?.trim()) {
            showError('Ism va telefon raqamni kiriting');
            return;
        }

        showLoading('Mijoz saqlanmoqda...');
        try {
            if (editingCustomer && editingCustomer.id) {
                // Tahrirlash - API da PUT endpoint bo'lsa qo'shish mumkin
                // Hozircha faqat yaratish
            }

            const newClient = await clientService.createClient({
                full_name: customerData.name,
                phone_number: customerData.phone || '',
                is_active: true,
                filial: user?.filials[0] || 0
            });

            const customer: Customer = {
                id: newClient.id.toString(),
                name: newClient.full_name,
                phone: newClient.phone_number,
            };

            setSelectedClientId(newClient.id);
            setClients([newClient, ...clients]);
            onCustomerChange?.(customer);
            setIsCustomerModalOpen(false);
            setEditingCustomer(undefined);
            showSuccess('Mijoz muvaffaqiyatli saqlandi');
        } catch (error: any) {
            console.error('Failed to save client:', error);
            const errorMessage = error?.response?.data?.detail || error?.message || 'Mijoz saqlashda xatolik yuz berdi';
            showError(errorMessage);
        }
    };

    const handleOpenAddModal = () => {
        setEditingCustomer(undefined);
        setIsCustomerModalOpen(true);
    };

    // OrderData o'zgarganda note va driverInfo ni yangilash
    useEffect(() => {
        if (orderData) {
            setNote(orderData.note || '');
            setDriverInfo(orderData.driver_info || '');
        }
    }, [orderData]);

    // Note saqlash
    const handleSaveNote = async () => {
        if (!orderData) return;

        setIsSavingNote(true);
        try {
            const updatedOrder = await orderService.updateOrder(orderData.id, { note });
            // client_detail bo'lmasa, eski orderData dan saqlab qolish
            const mergedOrder: OrderResponse = {
                ...updatedOrder,
                client_detail: updatedOrder.client_detail || orderData.client_detail,
            };
            onOrderUpdate?.(mergedOrder);
            showSuccess('Izoh saqlandi');
        } catch (error: any) {
            console.error('Failed to save note:', error);
            const errorMessage = error?.response?.data?.detail || error?.message || 'Izoh saqlashda xatolik yuz berdi';
            showError(errorMessage);
        } finally {
            setIsSavingNote(false);
        }
    };

    // Driver info saqlash
    const handleSaveDriverInfo = async () => {
        if (!orderData) return;

        setIsSavingDriverInfo(true);
        try {
            const updatedOrder = await orderService.updateOrder(orderData.id, { driver_info: driverInfo });
            // client_detail bo'lmasa, eski orderData dan saqlab qolish
            const mergedOrder: OrderResponse = {
                ...updatedOrder,
                client_detail: updatedOrder.client_detail || orderData.client_detail,
            };
            onOrderUpdate?.(mergedOrder);
            showSuccess('Yetkazib beruvchi ma\'lumotlari saqlandi');
        } catch (error: any) {
            console.error('Failed to save driver info:', error);
            const errorMessage = error?.response?.data?.detail || error?.message || 'Yetkazib beruvchi ma\'lumotlarini saqlashda xatolik yuz berdi';
            showError(errorMessage);
        } finally {
            setIsSavingDriverInfo(false);
        }
    };

    // Savdoni bekor qilish
    const handleDeleteOrder = async () => {
        if (!orderData) return;

        setIsDeleting(true);
        try {
            await orderService.deleteOrder(orderData.id);
            showSuccess('Savdo bekor qilindi');
            setIsDeleteModalOpen(false);
            navigate('/');
        } catch (error: any) {
            console.error('Failed to delete order:', error);
            const errorMessage = error?.response?.data?.detail || error?.message || 'Savdoni bekor qilishda xatolik yuz berdi';
            showError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    const selectedClient = clients.find(c => c.id === selectedClientId);
    const selectedCustomer: Customer | undefined = selectedClient ? {
        id: selectedClient.id.toString(),
        name: selectedClient.full_name,
        phone: selectedClient.phone_number,
    } : undefined;

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-blue-50/30 p-4">
            {/* Customer Selection / Display */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg mb-4 overflow-hidden">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-blue-600 text-sm font-semibold">
                            <User size={18} className="mr-2" />
                            <span>{orderData ? 'Mijoz ma\'lumotlari' : 'Mijozlar'}</span>
                        </div>
                        {!orderData && (
                            <button
                                onClick={handleOpenAddModal}
                                className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white p-2 rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg"
                                title="Yangi kontakt qo'shish"
                            >
                                <Plus size={18} />
                            </button>
                        )}
                    </div>

                    {isLoadingOrder ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                    ) : orderData?.client_detail ? (
                        // Order ma'lumotlari bo'lsa, mijoz ma'lumotlarini ko'rsatish
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-sm mb-2">
                                    {orderData.client_detail.full_name}
                                </div>
                                {orderData.client_detail.phone_number && (
                                    <div className="text-xs text-gray-600 mb-1.5">
                                        📞 {orderData.client_detail.phone_number}
                                    </div>
                                )}
                                {orderData.client_detail.region_detail && (
                                    <div className="text-xs text-gray-600 mb-1">
                                        🌍 {orderData.client_detail.region_detail.name}
                                    </div>
                                )}
                                {orderData.client_detail.district_detail && (
                                    <div className="text-xs text-gray-600 mb-1">
                                        📍 {orderData.client_detail.district_detail.name}
                                    </div>
                                )}
                                {orderData.client_detail.filial_detail && (
                                    <div className="text-xs text-gray-600 mb-1">
                                        🏢 {orderData.client_detail.filial_detail.name}
                                    </div>
                                )}
                                {orderData.client_detail.filial_detail?.address && (
                                    <div className="text-xs text-gray-500 mb-1">
                                        📍 {orderData.client_detail.filial_detail.address}
                                    </div>
                                )}
                                {orderData.client_detail.total_debt && parseFloat(orderData.client_detail.total_debt) > 0 && (
                                    <div className="text-xs text-red-600 font-semibold mt-2 pt-2 border-t border-red-200">
                                        💳 Qarz: {parseFloat(orderData.client_detail.total_debt).toLocaleString()} UZS
                                    </div>
                                )}
                                {orderData.client_detail.keshbek && parseFloat(orderData.client_detail.keshbek) > 0 && (
                                    <div className="text-xs text-green-600 font-semibold">
                                        ⭐ Keshbek: {parseFloat(orderData.client_detail.keshbek).toLocaleString()} UZS
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {!orderData && (
                        // Mijoz tanlash (yangi order uchun)
                        <>
                            <div className="relative">
                                <Autocomplete
                                    options={autocompleteOptions}
                                    value={selectedClientId?.toString() || ''}
                                    onChange={handleCustomerChange}
                                    onAddNew={handleAddNewCustomer}
                                    onSearchChange={setSearchQuery}
                                    placeholder="Mijoz tanlang yoki qidiring..."
                                    emptyMessage={isSearching ? 'Qidirilmoqda...' : 'Mijoz topilmadi'}
                                />
                                {isSearching && (
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    </div>
                                )}
                            </div>

                            {selectedCustomer && (
                                <div className="mt-3 space-y-2">
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 text-sm mb-1">
                                                    {selectedCustomer.name}
                                                </div>
                                                {selectedCustomer.phone && (
                                                    <div className="text-xs text-gray-600 mb-1">
                                                        📞 {selectedCustomer.phone}
                                                    </div>
                                                )}
                                                {selectedCustomer.email && (
                                                    <div className="text-xs text-gray-600">
                                                        ✉️ {selectedCustomer.email}
                                                    </div>
                                                )}
                                            </div>
                                            {!isSaleStarted && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setEditingCustomer(selectedCustomer);
                                                            setIsCustomerModalOpen(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-100 transition-colors"
                                                        title="Tahrirlash"
                                                    >
                                                        <User size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedClientId(null);
                                                            onCustomerChange?.(null);
                                                        }}
                                                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors ml-1"
                                                        title="Olib tashlash"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {!isSaleStarted && onStartSale && selectedClientId && (
                                        <button
                                            onClick={async () => {
                                                if (!selectedClientId) {
                                                    showError('Mijozni tanlang');
                                                    return;
                                                }

                                                setIsCreatingOrder(true);
                                                showLoading('Savdo yaratilmoqda...');
                                                try {
                                                    const order = await orderService.createOrder({
                                                        client: selectedClientId,
                                                        employee: user?.id || 0,
                                                        exchange_rate: usdRate,
                                                        is_karzinka: true,
                                                    });

                                                    onStartSale(order.id);
                                                    showSuccess('Savdo muvaffaqiyatli yaratildi');
                                                } catch (error: any) {
                                                    const errorMessage = error?.response?.data?.detail || error?.message || 'Savdo yaratishda xatolik yuz berdi';
                                                    showError(errorMessage);
                                                } finally {
                                                    setIsCreatingOrder(false);
                                                }
                                            }}
                                            disabled={isCreatingOrder}
                                            className="w-full bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 hover:from-green-700 hover:via-green-600 hover:to-emerald-600 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCreatingOrder ? 'Yaratilmoqda...' : 'Savdoni boshlash'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Customer Modal */}
            <CustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => {
                    setIsCustomerModalOpen(false);
                    setEditingCustomer(undefined);
                }}
                onSave={handleSaveCustomer}
                initialData={editingCustomer}
            />

            {/* Izoh blocki - faqat orderData mavjud bo'lganda */}
            {orderData && (
                <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg mb-4 overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-blue-600 text-sm font-semibold">
                                <FileText size={18} className="mr-2" />
                                <span>Izoh</span>
                            </div>
                        </div>
                        <div className="flex gap-2 items-start">
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Izoh kiriting..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={2}
                            />
                            <button
                                onClick={handleSaveNote}
                                disabled={isSavingNote}
                                className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
                                title="Saqlash"
                            >
                                {isSavingNote ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Yetkazib beruvchi blocki - faqat orderData mavjud bo'lganda */}
            {orderData && (
                <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg mb-4 overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-blue-600 text-sm font-semibold">
                                <Truck size={18} className="mr-2" />
                                <span>Yetkazib beruvchi</span>
                            </div>
                        </div>
                        <div className="flex gap-2 items-start">
                            <textarea
                                value={driverInfo}
                                onChange={(e) => setDriverInfo(e.target.value)}
                                placeholder="Yetkazib beruvchi ma'lumotlari..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={2}
                            />
                            <button
                                onClick={handleSaveDriverInfo}
                                disabled={isSavingDriverInfo}
                                className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
                                title="Saqlash"
                            >
                                {isSavingDriverInfo ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Totals Section */}
            <div className="mt-4 space-y-4">


                {/* Total Display */}
                <div className="flex justify-between items-end px-2 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
                    <span className="text-gray-700 font-semibold">Yig'indi</span>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-700">
                            {totalAmount.toLocaleString()}{' '}
                            <span className="text-sm font-normal text-blue-500">UZS</span>
                        </div>
                    </div>
                </div>



                {/* Cancel Order Button - faqat orderData mavjud bo'lganda */}
                {orderData && (
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={isDeleting}
                        className="w-full bg-gradient-to-r from-red-600 via-red-500 to-pink-500 hover:from-red-700 hover:via-red-600 hover:to-pink-600 text-white py-3 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.01] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Bekor qilinmoqda...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                <span>Savdoni bekor qilish</span>
                            </>
                        )}
                    </button>
                )}

                {/* Payment Button */}
                <button
                    onClick={onPayment}
                    disabled={!isSaleStarted}
                    className={`w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white py-5 rounded-2xl shadow-xl hover:shadow-2xl flex justify-between items-center px-6 mt-2 transition-all duration-200 transform hover:scale-[1.01] font-bold ${!isSaleStarted ? 'opacity-50 cursor-not-allowed' : ''
                        }`}>

                    <div className="text-left">
                        <div className="text-xs opacity-90">To'lovga</div>
                        <div className="text-sm opacity-70">F2</div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">
                            {totalAmount.toLocaleString()} UZS
                        </div>
                    </div>
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-200">
                        <div className="flex justify-between items-center p-5 border-b-2 border-red-100 bg-gradient-to-r from-red-50 to-pink-50">
                            <h3 className="text-xl font-bold text-gray-900">
                                Savdoni bekor qilish
                            </h3>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="text-gray-500 hover:text-red-600 hover:bg-white p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 bg-white">
                            <p className="text-gray-700 mb-6">
                                Savdoni bekor qilmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleDeleteOrder}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Bekor qilinmoqda...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            <span>Ha, bekor qilish</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>);

}