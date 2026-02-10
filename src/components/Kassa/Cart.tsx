import { Trash2, Plus, Minus, User, Loader2, DollarSign, X } from 'lucide-react';
import { CartItem, Customer } from './types';
import { OrderResponse } from '../../services/orderService';
import { Autocomplete, AutocompleteOption } from '../ui/Autocomplete';
import { useState, useEffect, useCallback } from 'react';
import { clientService, Client } from '../../services/clientService';
import { showError, showSuccess, showLoading } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerModal } from './CustomerModal';
import { orderService } from '../../services/orderService';
import { useNavigate } from 'react-router-dom';

interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemoveItem: (id: string) => void;
    totalItems: number;
    orderData?: OrderResponse | null;
    selectedCustomer?: Customer | null;
    onCustomerChange?: (customer: Customer | null) => void;
    onPayment?: () => void;
    isSaleStarted?: boolean;
    orderId?: number;
    onOrderUpdate?: (order: OrderResponse) => void;
    onStartSaleClick?: () => void;
    isCreatingOrder?: boolean;
    /** Mahsulot qo'shilgandan keyin yangilash uchun (KassaPage dan beriladi) */
    refreshCartTrigger?: number;
    /** Savdo ro'yxati yoki summa o'zgarganda (PaymentModal uchun) */
    onCartChange?: (items: CartItem[], totalAmount: number) => void;
    /** Read-only mode - faqat ko'rish uchun */
    readOnly?: boolean;
}
export function Cart({
    items,
    onUpdateQuantity,
    onRemoveItem,
    totalItems: _totalItems,
    orderData,
    selectedCustomer,
    onCustomerChange,
    onPayment,
    isSaleStarted = false,
    orderId,
    onOrderUpdate,
    onStartSaleClick,
    isCreatingOrder = false,
    refreshCartTrigger = 0,
    onCartChange,
    readOnly = false,
}: CartProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [cartItemsFromApi, setCartItemsFromApi] = useState<CartItem[]>([]);
    const [isLoadingCart, setIsLoadingCart] = useState(false);

    // Order-history-product dan CartItem ga transform (Yangi API: product_detail qo'shildi)
    const transformOrderProductToCartItem = useCallback((op: any): CartItem => {
        const productDetail = op.product_detail;

        // Avval eski strukturadan detail ma'lumotlarini olish (backward compatibility)
        // Agar ular null bo'lsa, product_detail ichidagi ID lardan foydalanish
        const branchDetail = op.branch_detail ?? null;
        const modelDetail = op.model_detail ?? null;
        const typeDetail = op.type_detail ?? null;
        const sizeDetail = op.size_detail ?? null;

        const productName = [
            branchDetail?.name,
            modelDetail?.name,
            typeDetail?.name,
            sizeDetail?.size
        ]
            .filter(Boolean)
            .join(' ')
            .trim();

        const quantity = op.given_count != null ? op.given_count : op.count ?? 0;

        // Narxni olish: avval product_detail dan, keyin order-history-product dan
        const price = parseFloat(
            productDetail?.real_price ||
            productDetail?.unit_price ||
            productDetail?.wholesale_price ||
            op.real_price ||
            op.unit_price ||
            op.wholesale_price ||
            '0'
        );

        return {
            id: String(op.id),
            productId: op.product ?? productDetail?.id ?? op.id,
            name: productName || `Savdo mahsulot #${op.id}`,
            price,
            stock: productDetail?.count ?? op.count ?? 0,
            unit: sizeDetail?.unit_detail?.code || 'dona',
            quantity,
            totalPrice: quantity * price,
            image: productDetail?.images?.[0]?.file ?? op.product?.images?.[0]?.file ?? op.images?.[0]?.file,
            branchName: branchDetail?.name ?? undefined,
            modelName: modelDetail?.name ?? undefined,
            typeName: typeDetail?.name ?? undefined,
            size: sizeDetail?.size ?? undefined,
            unitCode: sizeDetail?.unit_detail?.code ?? undefined,
            // ID larni olish: avval product_detail dan, keyin order-history-product dan
            branchId: productDetail?.branch ?? op.branch ?? undefined,
            modelId: productDetail?.model ?? op.model ?? undefined,
            typeId: productDetail?.type ?? op.type ?? undefined,
            sizeId: productDetail?.size ?? op.size ?? undefined,
            isFavorite: false,
        };
    }, []);

    // /api/v1/order-history-product dan order-history bo'yicha mahsulotlarni yuklash
    const loadOrderProducts = useCallback(async () => {
        const orderHistoryId = orderId ?? orderData?.id;
        if (!orderHistoryId) return;
        setIsLoadingCart(true);
        try {
            const list = await orderService.getOrderProducts(orderHistoryId);
            const filtered = (list || []).filter((p: any) => !p.is_delete);
            setCartItemsFromApi(filtered.map(transformOrderProductToCartItem));
        } catch (error) {
            console.error('Failed to load order products:', error);
            showError('Savdo mahsulotlarini yuklashda xatolik');
            setCartItemsFromApi([]);
        } finally {
            setIsLoadingCart(false);
        }
    }, [orderId, orderData?.id, transformOrderProductToCartItem]);

    useEffect(() => {
        if (orderId ?? orderData?.id) {
            loadOrderProducts();
        } else {
            setCartItemsFromApi([]);
        }
    }, [orderId, orderData?.id, loadOrderProducts, refreshCartTrigger]);

    // Order mavjud bo'lsa API dan kelgan ro'yxat, yo'q bo'lsa parent dan kelgan items
    const displayItems = orderId ?? orderData?.id ? cartItemsFromApi : items;
    const totalAmount = displayItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Parent (PaymentModal va boshqalar) uchun ro'yxat va jami summani yangilash
    useEffect(() => {
        onCartChange?.(displayItems, totalAmount);
    }, [displayItems, totalAmount]);

    // Miqdorni o'zgartirish (API orqali)
    const handleUpdateQuantity = async (id: string, delta: number) => {
        const orderHistoryId = orderId ?? orderData?.id;
        if (orderHistoryId) {
            const item = cartItemsFromApi.find((i) => i.id === id);
            if (!item) return;
            const newQty = Math.max(1, item.quantity + delta);
            try {
                await orderService.updateOrderProduct(Number(id), { count: newQty });
                await loadOrderProducts();
            } catch (error: any) {
                const msg = error?.response?.data?.detail || error?.message || 'Miqdorni yangilashda xatolik';
                showError(msg);
            }
            return;
        }
        onUpdateQuantity(id, delta);
    };

    // Mahsulotni o'chirish (API orqali)
    const handleRemoveItem = async (id: string) => {
        const orderHistoryId = orderId ?? orderData?.id;
        if (orderHistoryId) {
            try {
                await orderService.deleteOrderProduct(Number(id));
                await loadOrderProducts();
            } catch (error: any) {
                const msg = error?.response?.data?.detail || error?.message || "O'chirishda xatolik";
                showError(msg);
            }
            return;
        }
        onRemoveItem(id);
    };

    // Parent ga refetch kerak bo'lsa (masalan mahsulot qo'shgandan keyin) — expose refetch
    // Parent Cart ni refetch qilishi uchun key yoki loadOrderProducts ni prop qilib berish mumkin.
    // Hozircha orderData/orderId o'zgarganda avtomatik load qilinadi.

    // Mijozlarni qidirish
    const searchClients = useCallback(async (query: string) => {
        setIsSearchingCustomers(true);
        try {
            const response = await clientService.getClients(query || '');
            setClients(response.results.filter((client) => client.is_active && !client.is_delete));
        } catch (error) {
            console.error('Failed to search clients:', error);
            setClients([]);
            if (query.trim()) {
                showError('Mijozlarni yuklashda xatolik yuz berdi');
            }
        } finally {
            setIsSearchingCustomers(false);
        }
    }, []);

    // Komponent mount bo'lganda barcha mijozlarni yuklash
    useEffect(() => {
        searchClients('');
    }, [searchClients]);

    // Qidiruv o'zgarganda API ga so'rov yuborish
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchClients(customerSearchQuery || '');
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [customerSearchQuery, searchClients]);

    // OrderData yuklanganda selectedClientId ni set qilish
    useEffect(() => {
        if (orderData?.client_detail) {
            setSelectedClientId(orderData.client);
        } else if (selectedCustomer) {
            setSelectedClientId(parseInt(selectedCustomer.id));
        }
    }, [orderData, selectedCustomer]);

    const autocompleteOptions: AutocompleteOption[] = clients.map((client) => ({
        id: client.id.toString(),
        label: `${client.full_name}${client.phone_number ? ` (${client.phone_number})` : ''}`,
        value: client.id.toString(),
    }));

    // Mijoz tanlash
    const handleCustomerSelect = async (clientId: string) => {
        const id = parseInt(clientId);
        const client = clients.find((c) => c.id === id);
        if (client) {
            const customer: Customer = {
                id: client.id.toString(),
                name: client.full_name,
                phone: client.phone_number,
            };

            // Agar orderData mavjud bo'lsa, order ni yangilash
            if (orderData && orderId) {
                showLoading('Mijoz yangilanmoqda...');
                try {
                    const updatedOrder = await orderService.updateOrder(orderId, {
                        client: id,
                    });
                    setSelectedClientId(id);
                    onOrderUpdate?.(updatedOrder);
                    onCustomerChange?.(customer);
                    showSuccess('Mijoz muvaffaqiyatli yangilandi');
                } catch (error: any) {
                    console.error('Failed to update order client:', error);
                    const errorMessage =
                        error?.response?.data?.detail || error?.message || 'Mijozni yangilashda xatolik yuz berdi';
                    showError(errorMessage);
                }
            } else {
                setSelectedClientId(id);
                onCustomerChange?.(customer);
            }
        }
    };

    // Yangi mijoz yaratish
    const handleAddNewCustomer = async (name: string) => {
        const parts = name.trim().split(/\s+/);
        let fullName = name;
        let phoneNumber = '';
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
                filial: user?.filials[0] || 0,
            });

            const customer: Customer = {
                id: newClient.id.toString(),
                name: newClient.full_name,
                phone: newClient.phone_number,
            };

            // Agar orderData mavjud bo'lsa, order ni yangilash
            if (orderData && orderId) {
                try {
                    const updatedOrder = await orderService.updateOrder(orderId, {
                        client: newClient.id,
                    });
                    setSelectedClientId(newClient.id);
                    setClients([newClient, ...clients]);
                    onOrderUpdate?.(updatedOrder);
                    onCustomerChange?.(customer);
                    showSuccess("Mijoz muvaffaqiyatli yaratildi va order ga qo'shildi");
                } catch (error: any) {
                    console.error('Failed to update order client:', error);
                    const errorMessage =
                        error?.response?.data?.detail ||
                        error?.message ||
                        "Order ga mijoz qo'shishda xatolik yuz berdi";
                    showError(errorMessage);
                    // Mijoz yaratildi lekin order ga qo'shilmadi
                    setSelectedClientId(newClient.id);
                    setClients([newClient, ...clients]);
                    onCustomerChange?.(customer);
                }
            } else {
                setSelectedClientId(newClient.id);
                setClients([newClient, ...clients]);
                onCustomerChange?.(customer);
                showSuccess('Mijoz muvaffaqiyatli yaratildi');
            }
        } catch (error: any) {
            console.error('Failed to create client:', error);
            const errorMessage =
                error?.response?.data?.detail || error?.message || 'Mijoz yaratishda xatolik yuz berdi';
            showError(errorMessage);
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
            const newClient = await clientService.createClient({
                full_name: customerData.name,
                phone_number: customerData.phone || '',
                is_active: true,
                filial: user?.filials[0] || 0,
            });

            const customer: Customer = {
                id: newClient.id.toString(),
                name: newClient.full_name,
                phone: newClient.phone_number,
            };

            // Agar orderData mavjud bo'lsa, order ni yangilash
            if (orderData && orderId) {
                try {
                    const updatedOrder = await orderService.updateOrder(orderId, {
                        client: newClient.id,
                    });
                    setSelectedClientId(newClient.id);
                    setClients([newClient, ...clients]);
                    onOrderUpdate?.(updatedOrder);
                    onCustomerChange?.(customer);
                    setIsCustomerModalOpen(false);
                    setEditingCustomer(undefined);
                    showSuccess("Mijoz muvaffaqiyatli saqlandi va order ga qo'shildi");
                } catch (error: any) {
                    console.error('Failed to update order client:', error);
                    const errorMessage =
                        error?.response?.data?.detail ||
                        error?.message ||
                        "Order ga mijoz qo'shishda xatolik yuz berdi";
                    showError(errorMessage);
                    // Mijoz yaratildi lekin order ga qo'shilmadi
                    setSelectedClientId(newClient.id);
                    setClients([newClient, ...clients]);
                    onCustomerChange?.(customer);
                    setIsCustomerModalOpen(false);
                    setEditingCustomer(undefined);
                }
            } else {
                setSelectedClientId(newClient.id);
                setClients([newClient, ...clients]);
                onCustomerChange?.(customer);
                setIsCustomerModalOpen(false);
                setEditingCustomer(undefined);
                showSuccess('Mijoz muvaffaqiyatli saqlandi');
            }
        } catch (error: any) {
            console.error('Failed to save client:', error);
            const errorMessage = error?.response?.data?.detail || error?.message || 'Mijoz saqlashda xatolik yuz berdi';
            showError(errorMessage);
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
            const errorMessage =
                error?.response?.data?.detail || error?.message || 'Savdoni bekor qilishda xatolik yuz berdi';
            showError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className='flex flex-col h-full bg-gradient-to-b from-white to-blue-50/30 border-r border-blue-200/50'>
            {/* Header */}
            <div className='p-4 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-500 border-b border-blue-400 shadow-md'>
                {/* Barcha elementlar bir qatorda */}
                <div className='flex items-center gap-3 flex-wrap'>
                    {/* Savdo va Order ID */}
                    <h2 className='text-xl sm:text-2xl font-bold text-white flex items-center shrink-0'>
                        Savdo{' '}
                        {orderData && (
                            <span className='ml-2 sm:ml-3 text-white/80 font-semibold bg-white/20 px-2 sm:px-3 py-1 rounded-xl text-base sm:text-lg'>
                                #{orderData.id}
                            </span>
                        )}
                    </h2>

                    {/* Mijoz tanlash va Savdoni boshlash - faqat readOnly emas bo'lsa ko'rsatish */}
                    {!readOnly && (
                        <div className='flex items-center gap-2 flex-1 min-w-[200px]'>
                            <div className='flex-1 min-w-[200px] max-w-md'>
                                <div className='flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm'>
                                    <div className='relative flex-1'>
                                        <Autocomplete
                                            options={autocompleteOptions}
                                            value={selectedClientId?.toString() || ''}
                                            onChange={handleCustomerSelect}
                                            onAddNew={handleAddNewCustomer}
                                            onSearchChange={setCustomerSearchQuery}
                                            placeholder='Mijoz tanlang...'
                                            emptyMessage={isSearchingCustomers ? 'Qidirilmoqda...' : 'Mijoz topilmadi'}
                                        />
                                        {isSearchingCustomers && (
                                            <div className='absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none'>
                                                <Loader2 className='h-4 w-4 animate-spin text-blue-600' />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsCustomerModalOpen(true)}
                                        className='bg-white/30 hover:bg-white/40 p-1.5 rounded-lg transition-colors shrink-0'
                                        title="Yangi mijoz qo'shish"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Savdoni boshlash knopkasi - faqat readOnly emas bo'lsa ko'rsatish */}
                    {!readOnly && !orderData && selectedCustomer && !isSaleStarted && onStartSaleClick && (
                        <button
                            onClick={onStartSaleClick}
                            disabled={isCreatingOrder}
                            className='flex items-center justify-center gap-2 bg-green-500/80 hover:bg-green-500 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap'
                            title='Savdoni boshlash'
                        >
                            {isCreatingOrder ? (
                                <>
                                    <Loader2 size={18} className='animate-spin' />
                                    <span className='hidden sm:inline'>Yaratilmoqda...</span>
                                    <span className='sm:hidden'>Yuklanmoqda...</span>
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    <span className='hidden sm:inline'>Savdoni boshlash</span>
                                    <span className='sm:hidden'>Boshlash</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Mijoz ma'lumotlari */}
                    {selectedCustomer && (
                        <div className='hidden sm:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm shrink-0'>
                            <User className='w-4 h-4 text-white/90 shrink-0' />
                            <div className='text-xs'>
                                <div className='font-semibold whitespace-nowrap'>{selectedCustomer.name}</div>
                                {selectedCustomer.phone && (
                                    <div className='text-[10px] opacity-80 whitespace-nowrap'>
                                        {selectedCustomer.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Jami summa */}
                    <div className='text-right shrink-0 ml-auto'>
                        <div className='text-xs text-white/80 mb-1'>Jami</div>
                        <div className='text-xl sm:text-2xl font-bold text-yellow-200 whitespace-nowrap'>
                            {totalAmount.toLocaleString()} UZS
                        </div>
                    </div>

                    {/* To'lov va Bekor qilish knopkalari - faqat readOnly emas bo'lsa ko'rsatish */}
                    {!readOnly && orderData && (
                        <>
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                disabled={isDeleting}
                                className='flex items-center justify-center gap-2 bg-red-500/80 hover:bg-red-500 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap'
                                title='Savdoni bekor qilish'
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className='w-4 h-4 animate-spin' />
                                        <span className='hidden sm:inline'>Bekor qilinmoqda...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        <span className='hidden sm:inline'>Bekor qilish</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onPayment}
                                disabled={!isSaleStarted || totalAmount === 0}
                                className='flex items-center justify-center gap-2 bg-green-500/80 hover:bg-green-500 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap'
                                title="To'lov"
                            >
                                <DollarSign size={16} />
                                <span className='hidden sm:inline'>To'lov</span>
                            </button>
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

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-200'>
                        <div className='flex justify-between items-center p-5 border-b-2 border-red-100 bg-gradient-to-r from-red-50 to-pink-50'>
                            <h3 className='text-xl font-bold text-gray-900'>Savdoni bekor qilish</h3>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className='text-gray-500 hover:text-red-600 hover:bg-white p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className='p-6 bg-white'>
                            <p className='text-gray-700 mb-6'>
                                Savdoni bekor qilmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
                            </p>

                            <div className='flex gap-3 justify-end'>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={isDeleting}
                                    className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleDeleteOrder}
                                    disabled={isDeleting}
                                    className='px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className='w-4 h-4 animate-spin' />
                                            <span>Bekor qilinmoqda...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className='w-4 h-4' />
                                            <span>Ha, bekor qilish</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Items — /api/v1/order-history-product dan order-history bo'yicha */}
            <div className='flex-1 overflow-y-auto p-3 space-y-3'>
                {isLoadingCart ? (
                    <div className='flex flex-col items-center justify-center py-12'>
                        <Loader2 className='w-8 h-8 animate-spin text-blue-600 mb-3' />
                        <p className='text-sm text-gray-500'>Savdo mahsulotlari yuklanmoqda...</p>
                    </div>
                ) : (
                    displayItems.map((item, index) => (
                        <div
                            key={item.id}
                            className='bg-white p-3 sm:p-4 rounded-xl shadow-lg hover:shadow-xl border-2 border-blue-100 flex flex-col sm:flex-row sm:items-center gap-3 transition-all duration-200'
                        >
                            {/* Top row for mobile, inline for desktop */}
                            <div className='flex items-center gap-2 sm:gap-3 flex-1 min-w-0'>
                                <div className='w-8 h-8 sm:w-10 sm:h-10 text-center font-bold text-blue-600 text-xs sm:text-sm bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center shrink-0'>
                                    {index + 1}
                                </div>

                                {/* Quantity Controls - faqat readOnly emas bo'lsa ko'rsatish */}
                                {!readOnly && (
                                    <div className='flex flex-col border-2 border-blue-200 rounded-xl overflow-hidden shadow-sm shrink-0'>
                                        <button
                                            onClick={() => handleUpdateQuantity(item.id, 1)}
                                            className='p-1 sm:p-1.5 hover:bg-gradient-to-br hover:from-emerald-400 hover:to-green-500 text-emerald-600 border-b border-blue-200 flex justify-center transition-all duration-200'
                                        >
                                            <Plus size={12} className='sm:w-3.5 sm:h-3.5' />
                                        </button>
                                        <button
                                            onClick={() => handleUpdateQuantity(item.id, -1)}
                                            className='p-1 sm:p-1.5 hover:bg-gradient-to-br hover:from-rose-400 hover:to-red-500 text-rose-600 flex justify-center transition-all duration-200'
                                        >
                                            <Minus size={12} className='sm:w-3.5 sm:h-3.5' />
                                        </button>
                                    </div>
                                )}

                                {/* Quantity Display */}
                                <div className='w-16 sm:w-20 text-center border-2 border-blue-200 rounded-xl px-2 py-1.5 sm:py-2.5 bg-gradient-to-br from-blue-50 to-cyan-50 text-xs sm:text-sm font-semibold text-blue-700 shrink-0'>
                                    {item.quantity} {item.unit === 'dona' ? 'dona' : 'kg'}
                                </div>

                                {/* Product Details */}
                                <div className='flex-1 px-2 sm:px-3 min-w-0'>
                                    <div className='font-semibold text-gray-900 text-xs sm:text-sm truncate'>{item.name}</div>
                                    <div className='text-xs text-blue-600 font-medium mt-1'>
                                        {item.price.toLocaleString()} UZS
                                    </div>
                                </div>
                            </div>

                            {/* Total & Delete */}
                            <div className='flex items-center justify-between sm:justify-end gap-2 sm:space-x-3 shrink-0'>
                                <div className='font-bold text-blue-700 text-right text-base sm:text-lg whitespace-nowrap'>
                                    {item.totalPrice.toLocaleString()} UZS
                                </div>
                                {!readOnly && (
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className='text-white bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 p-1.5 sm:p-2 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 shrink-0'
                                    >
                                        <Trash2 size={16} className='sm:w-4 sm:h-4' />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
