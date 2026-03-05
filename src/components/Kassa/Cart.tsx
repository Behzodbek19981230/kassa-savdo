import { Trash2, Plus, User, Loader2, DollarSign, X, Edit2 } from 'lucide-react';
import { CartItem, Customer, OrderItem, OrderResponse } from '../../types';
import { Autocomplete, AutocompleteOption } from '../ui/Autocomplete';
import { useState, useEffect, useCallback } from 'react';
import { clientService, Client } from '../../services/clientService';
import { showError, showSuccess } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerModal } from './CustomerModal';
import { ProductModal } from './ProductModal';
import { orderService, vozvratOrderService } from '../../services/orderService';
import { skladService } from '../../services/skladService';
import { useNavigate } from 'react-router-dom';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';

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
    /** Vozvrat order mode */
    isVozvratOrder?: boolean;
}
export function Cart({
    items,
    onUpdateQuantity: _onUpdateQuantity,
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
    isVozvratOrder = false,
}: CartProps) {
    const { user } = useAuth();
    const { displayRate } = useExchangeRate();
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeletingItem, setIsDeletingItem] = useState(false);
    const [cartItemsFromApi, setCartItemsFromApi] = useState<CartItem[]>([]);
    const [orderProductsRaw, setOrderProductsRaw] = useState<any[]>([]);
    const [skladlar, setSkladlar] = useState<{ id: number; name: string }[]>([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productForModal, setProductForModal] = useState<any | null>(null);
    const [isLoadingCart, setIsLoadingCart] = useState(false);

    // Order-history-product dan CartItem ga transform (Yangi API: product_detail qo'shildi)
    const transformOrderProductToCartItem = useCallback((op: OrderItem): CartItem => {
        const productDetail = op.product_detail;

        // Avval eski strukturadan detail ma'lumotlarini olish (backward compatibility)
        // Agar ular null bo'lsa, product_detail ichidagi ID lardan foydalanish
        const branchDetail = op.branch_detail ?? null;
        const branchCategoryDetail = op.branch_category_detail?.name;
        const modelDetail = op.model_detail ?? null;
        const typeDetail = op.type_detail ?? null;
        const sizeDetail = op.size_detail ?? null;

        const quantity = op.count ?? 0;

        const exchangeRate = orderData?.exchange_rate != null ? Number(orderData.exchange_rate) : displayRate;

        let unitPriceSum = Number(op.price_sum) / op.count;

        let unitPriceDollar = unitPriceSum / exchangeRate;
        let totalPriceDollar = unitPriceDollar * quantity;
        if (op.price_dollar != null) {
            totalPriceDollar = parseFloat(String(op.price_dollar)) || totalPriceDollar;
            unitPriceDollar = quantity ? totalPriceDollar / quantity : unitPriceDollar;
        }

        // Birlik: unit_detail.name (masalan "Komplekt"), keyin unit_detail.code, keyin dona
        const unitName =
            sizeDetail?.unit_detail?.name ?? sizeDetail?.unit_detail?.code ?? sizeDetail?.unit_detail ?? 'dona';
        return {
            id: String(op.id),
            productId: op.product ?? productDetail?.id ?? op.id,
            stock: productDetail?.count ?? op.count ?? 0,
            unit: unitName,
            quantity,
            priceDollar: unitPriceDollar,
            totalPriceDollar: totalPriceDollar,
            priceSum: op.price_sum ? Number(op.price_sum) : 0,

            branchName: branchDetail?.name ?? undefined,
            branchCategoryName: branchCategoryDetail ?? undefined,
            modelName: modelDetail?.name ?? undefined,
            typeName: typeDetail?.name ?? undefined,
            size: sizeDetail?.size ?? undefined,
            unitCode: unitName,
            // ID larni olish: avval product_detail dan, keyin order-history-product dan
            branchId: productDetail?.branch ?? op.branch ?? undefined,
            modelId: productDetail?.model ?? op.model ?? undefined,
            typeId: productDetail?.type ?? op.type ?? undefined,
            sizeId: productDetail?.size ?? op.size ?? undefined,
            isFavorite: false,

            name: '',
            price: 0,
        };
    }, []);

    // /api/v1/order-history-product dan order-history bo'yicha mahsulotlarni yuklash
    const loadOrderProducts = useCallback(async () => {
        const orderHistoryId = orderId ?? orderData?.id;
        if (!orderHistoryId) return;
        setIsLoadingCart(true);
        try {
            let list;
            if (isVozvratOrder) {
                // Vozvrat order productlarini yuklash
                list = await vozvratOrderService.getVozvratOrderProducts(orderHistoryId);
            } else {
                // Oddiy order productlarini yuklash
                list = await orderService.getOrderProducts(orderHistoryId);
            }
            const filtered = (list || []).filter((p: any) => !p.is_delete);
            setOrderProductsRaw(filtered);
            setCartItemsFromApi(filtered.map(transformOrderProductToCartItem));
        } catch (error) {
            console.error('Failed to load order products:', error);
            showError('Mahsulotlarni yuklashda xatolik');
            setCartItemsFromApi([]);
        } finally {
            setIsLoadingCart(false);
        }
    }, [orderId, orderData?.id, transformOrderProductToCartItem, isVozvratOrder]);

    useEffect(() => {
        if (orderId ?? orderData?.id) {
            loadOrderProducts();
        } else {
            setCartItemsFromApi([]);
        }
    }, [orderId, orderData?.id, loadOrderProducts, refreshCartTrigger]);

    // Mijozning qarzi (orderResponse yoki client_detail ichidan olinadi)
    const clientDebtValue = orderData?.client_detail?.total_debt ?? orderData?.total_debt_client ?? '0';
    const clientDebtNumber = parseFloat(String(clientDebtValue)) || 0;

    // Exchange rate to use for USD calculations
    const exchangeRate = orderData?.exchange_rate != null ? Number(orderData.exchange_rate) : displayRate;

    // Order mavjud bo'lsa API dan kelgan ro'yxat, yo'q bo'lsa parent dan kelgan items
    const displayItems = (orderId ?? orderData?.id) ? cartItemsFromApi : items;
    const totalAmount = displayItems.reduce((sum, item) => sum + (item.priceSum || 0), 0);
    const totalAmountDollar = displayItems.reduce(
        (sum, item) => sum + (item.totalPriceDollar ?? (item.priceSum || 0) / exchangeRate),
        0,
    );

    // Parent (PaymentModal va boshqalar) uchun ro'yxat va jami summani yangilash
    useEffect(() => {
        onCartChange?.(displayItems, totalAmount);
    }, [displayItems, totalAmount]);

    // Mahsulotni o'chirish uchun tasdiqlash modalini ochish
    const handleRemoveItem = (id: string) => {
        setItemToDelete(id);
        setIsDeleteItemModalOpen(true);
    };

    // Mahsulotni o'chirish (API orqali)
    const confirmRemoveItem = async () => {
        if (!itemToDelete) return;
        const orderHistoryId = orderId ?? orderData?.id;
        setIsDeletingItem(true);
        try {
            if (orderHistoryId) {
                await orderService.deleteOrderProduct(Number(itemToDelete));
                await loadOrderProducts();
                showSuccess('Mahsulot muvaffaqiyatli o\'chirildi');
            } else {
                onRemoveItem(itemToDelete);
            }
            setIsDeleteItemModalOpen(false);
            setItemToDelete(null);
        } catch (error: any) {
            const msg = error?.response?.data?.detail || error?.message || "O'chirishda xatolik";
            showError(msg);
        } finally {
            setIsDeletingItem(false);
        }
    };

    // Edit order-history-product - open modal with product info
    const handleEditOrderProduct = (cartItemId: string) => {
        const raw = orderProductsRaw.find((p) => String(p.id) === String(cartItemId));
        if (!raw) return;
        // build Product object for ProductModal
        const productDetail = raw.product_detail ?? {};
        const sizeDetail = raw.size_detail ?? {};
        const nameParts = [raw.branch_detail?.name, raw.model_detail?.name, raw.type_detail?.name, sizeDetail.size]
            .filter(Boolean)
            .join(' ');
        const productFor = {
            id: String(raw.id),
            productId: productDetail.id ?? raw.product,
            name: nameParts || `Mahsulot #${productDetail.id ?? raw.product}`,
            price: parseFloat(raw.unit_price ?? raw.real_price ?? raw.price_sum ?? '0') || 0,
            stock: productDetail.count ?? raw.count ?? 0,
            unit: sizeDetail.unit_code ?? sizeDetail.unit_detail?.code ?? 'dona',
            unitCode: sizeDetail.unit_code ?? sizeDetail.unit_detail?.code ?? 'dona',
            branchName: raw.branch_detail?.name,
            modelName: raw.model_detail?.name,
            typeName: raw.type_detail?.name,
            branchCategoryName: raw.branch_category_detail?.name,
            size: sizeDetail.size,
            branchId: productDetail.branch ?? raw.branch,
            modelId: productDetail.model ?? raw.model,
            typeId: productDetail.type ?? raw.type,
            sizeId: productDetail.size ?? raw.size,
            unitPrice: parseFloat(productDetail.unit_price ?? raw.unit_price ?? '0') || 0,
            wholesalePrice: parseFloat(productDetail.wholesale_price ?? raw.wholesale_price ?? '0') || 0,
        };
        setProductForModal(productFor);
        setIsProductModalOpen(true);
    };

    const handleConfirmEditOrderProduct = async (
        quantity: number,
        _priceInSum: number,
        options: { skladId: number; currencyId?: number; priceDollar?: number; priceSum?: number },
    ) => {
        // find corresponding raw record by matching productForModal id
        if (!productForModal) return;
        const rawId = Number(productForModal.id);
        try {
            await orderService.updateOrderProduct(rawId, {
                count: quantity,
                sklad: options.skladId,
                price_sum: options.priceSum,
                price_dollar: options.priceDollar,
                currency: options.currencyId,
            });
            showSuccess('Mahsulot muvaffaqiyatli yangilandi');
            setIsProductModalOpen(false);
            setProductForModal(null);
            await loadOrderProducts();
        } catch (error: any) {
            console.error('Failed to update order product:', error);
            const errorMessage = error?.response?.data?.detail || error?.message || 'Mahsulotni yangilashda xatolik';
            showError(errorMessage);
        }
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

    // Skladlarni yuklash (ProductModal uchun)
    useEffect(() => {
        const filialId = orderData?.order_filial ?? user?.order_filial ?? undefined;
        if (!filialId) {
            setSkladlar([]);
            return;
        }
        skladService
            .getSkladlar({ filial: filialId })
            .then(setSkladlar)
            .catch(() => setSkladlar([]));
    }, [orderData?.order_filial, user?.order_filial]);

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
        label: () => {
            return (
                <div className='flex flex-col '>
                    <span className='text-xs font-semibold text-blue-600'>{client.full_name}</span>
                    <span className='text-xs text-gray-500'>{client.phone_number}</span>
                </div>
            );
        },
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

        try {
            const newClient = await clientService.createClient({
                full_name: fullName,
                phone_number: phoneNumber || '',
                is_active: true,
                filial: user?.order_filial || 0,
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

        try {
            const newClient = await clientService.createClient({
                full_name: customerData.name,
                phone_number: customerData.phone || '',
                is_active: true,
                filial: user?.order_filial || 0,
                total_debt: customerData.total_debt || 0,
            });

            const customer: Customer = {
                id: newClient.id.toString(),
                name: newClient.full_name,
                phone: newClient.phone_number,
                total_debt: newClient.total_debt,
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
        <div className='flex flex-col h-full bg-white border-r border-blue-200/50'>
            {/* Header */}
            <div className='p-4 bg-blue-600 border-b border-blue-400 shadow-md'>
                {/* Barcha elementlar bir qatorda */}
                <div className='flex items-center gap-3 flex-wrap'>


                    {/* Mijoz tanlash va Savdoni boshlash - faqat readOnly emas bo'lsa ko'rsatish */}
                    {!readOnly && !orderData && (
                        <div className='flex items-center gap-2 flex-1 '>
                            <div className='flex-1 max-w-60'>
                                <div className='flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm'>
                                    <div className='relative flex-1 '>
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

                    {/* Savdoni boshlash / Qaytarishni boshlash knopkasi - faqat readOnly emas bo'lsa ko'rsatish */}
                    {!readOnly && !orderData && selectedCustomer && !isSaleStarted && onStartSaleClick && (
                        <button
                            onClick={onStartSaleClick}
                            disabled={isCreatingOrder}
                            className='flex items-center justify-center gap-1.5 bg-green-500/80 hover:bg-green-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap'
                            title={isVozvratOrder ? 'Qaytarishni boshlash' : 'Savdoni boshlash'}
                        >
                            {isCreatingOrder ? (
                                <>
                                    <Loader2 size={14} className='animate-spin' />
                                    <span className='hidden sm:inline'>Yaratilmoqda...</span>
                                    <span className='sm:hidden'>Yuklanmoqda...</span>
                                </>
                            ) : (
                                <>
                                    <Plus size={14} />
                                    <span className='hidden sm:inline'>
                                        {isVozvratOrder ? 'Qaytarishni boshlash' : 'Savdoni boshlash'}
                                    </span>
                                    <span className='sm:hidden'>{isVozvratOrder ? 'Qaytarish' : 'Boshlash'}</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Mijoz ma'lumotlari */}
                    {selectedCustomer && (
                        <div className='hidden sm:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm shrink-0'>
                            <User className='w-4 h-4 text-white/90 shrink-0' />
                            <div className='text-xs'>
                                <div className='font-semibold whitespace-nowrap text-white'>{selectedCustomer.name}</div>
                                {selectedCustomer.phone && (
                                    <div className='text-[10px] opacity-80 whitespace-nowrap text-white'>
                                        {selectedCustomer.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Qarzdorlik (client debt) - ko'rsatilsin orderData mavjud bo'lsa */}
                    {orderData && (
                        <div className='ml-3 text-xs text-white/90 shrink-0'>
                            <div className='font-semibold text-[12px]'>Qarzdorlik</div>
                            <div className='text-sm'>{clientDebtNumber.toLocaleString()} UZS</div>
                        </div>
                    )}

                    {/* Jami summa */}
                    <div className='text-right shrink-0 ml-auto'>
                        <div className='text-xs text-white/80 mb-1'>Jami</div>
                        <div className='text-sm  sm:text-sm font-bold text-yellow-200 whitespace-nowrap'>
                            {totalAmountDollar.toFixed(2)} USD ({totalAmount.toLocaleString()} UZS)
                        </div>
                    </div>

                    {/* To'lov va Bekor qilish knopkalari - faqat readOnly emas bo'lsa ko'rsatish */}
                    {!readOnly && orderData && (
                        <>
                            {!isVozvratOrder && (
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    disabled={isDeleting}
                                    className='flex items-center justify-center gap-1.5 bg-red-500/80 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap'
                                    title='Savdoni bekor qilish'
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                            <span className='hidden sm:inline'>Bekor qilinmoqda...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={14} />
                                            <span className='hidden sm:inline'>Bekor qilish</span>
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={onPayment}
                                disabled={!isSaleStarted || totalAmount === 0}
                                className={`flex items-center justify-center gap-1.5 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap ${isVozvratOrder
                                    ? 'bg-red-500/80 hover:bg-red-500'
                                    : 'bg-green-500/80 hover:bg-green-500'
                                    }`}
                                title={isVozvratOrder ? 'Qaytarish' : "To'lov"}
                            >
                                <DollarSign size={14} />
                                <span className='hidden sm:inline'>{isVozvratOrder ? 'Qaytarish' : "To'lov"}</span>
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

            {/* Product Edit Modal (order-history-product tahrirlash) */}
            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => {
                    setIsProductModalOpen(false);
                    setProductForModal(null);
                }}
                product={productForModal}
                exchangeRate={exchangeRate}
                skladlar={skladlar}
                orderData={orderData}
                orderProductId={productForModal?.id ? Number(productForModal.id) : null}
                isVozvratOrder={isVozvratOrder}
                onConfirm={handleConfirmEditOrderProduct}
            />

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-200'>
                        <div className='flex justify-between items-center p-5 border-b-2 border-red-100 bg-red-50'>
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
                                    className='px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleDeleteOrder}
                                    disabled={isDeleting}
                                    className='px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-200 font-semibold text-xs shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
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
            <div className='flex-1 overflow-y-auto p-2 space-y-2'>
                {isLoadingCart ? (
                    <div className='flex flex-col items-center justify-center py-8'>
                        <Loader2 className='w-6 h-6 animate-spin text-blue-600 mb-2' />
                        <p className='text-xs text-gray-500'>Savdo mahsulotlari yuklanmoqda...</p>
                    </div>
                ) : (
                    displayItems.map((item, index) => (
                        <div
                            key={item.id}
                            className='bg-white p-2 rounded-lg shadow-sm hover:shadow-md border border-blue-100 flex items-center gap-2 transition-all duration-200'
                        >
                            {/* Index */}
                            <div className='w-6 h-6 text-center font-bold text-blue-600 text-[10px] bg-blue-100 rounded flex items-center justify-center shrink-0'>
                                {index + 1}
                            </div>

                            {/* Quantity Display */}
                            <div className='text-center flex items-center justify-center border border-blue-200 rounded-md px-1.5 py-0.5 bg-blue-50 text-[10px] font-semibold text-blue-700 shrink-0 whitespace-nowrap'>
                                {item.quantity} {item.unit || item.unitCode || 'dona'}
                            </div>

                            {/* Product Details */}
                            <div className='flex-1 px-1.5 min-w-0'>
                                <div className='flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-gray-600'>
                                    {item.branchCategoryName && (
                                        <span className='text-indigo-600 font-medium'>{item.branchCategoryName}</span>
                                    )}
                                    {item.modelName && (
                                        <span className='text-gray-700'>{item.modelName}</span>
                                    )}
                                    {item.typeName && (
                                        <span className='text-gray-500'>{item.typeName}</span>
                                    )}
                                </div>
                            </div>

                            {/* Total & Actions */}
                            <div className='flex items-center gap-1.5 shrink-0'>
                                <div className='text-right'>
                                    <div className='font-bold text-blue-700 text-xs whitespace-nowrap'>
                                        {(item.totalPriceDollar ?? (item.priceSum || 0) / exchangeRate).toFixed(2)} $
                                    </div>
                                    <div className='text-[10px] text-gray-500'>{item.priceSum?.toLocaleString()} UZS</div>
                                </div>
                                {!readOnly && (
                                    <>
                                        {(orderId ?? orderData?.id) && (
                                            <button
                                                onClick={() => handleEditOrderProduct(item.id)}
                                                className='text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors shrink-0'
                                                title='Tahrirlash'
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className='text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors shrink-0'
                                            title="O'chirish"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Item Confirmation Modal */}
            {isDeleteItemModalOpen && (
                <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-200'>
                        <div className='flex justify-between items-center p-4 border-b-2 border-red-100 bg-red-50'>
                            <h3 className='text-lg font-bold text-gray-900'>Mahsulotni o'chirish</h3>
                            <button
                                onClick={() => {
                                    setIsDeleteItemModalOpen(false);
                                    setItemToDelete(null);
                                }}
                                disabled={isDeletingItem}
                                className='text-gray-500 hover:text-red-600 hover:bg-white p-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className='p-5 bg-white'>
                            <p className='text-gray-700 mb-5'>
                                Bu mahsulotni savdodan o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
                            </p>

                            <div className='flex gap-2 justify-end'>
                                <button
                                    onClick={() => {
                                        setIsDeleteItemModalOpen(false);
                                        setItemToDelete(null);
                                    }}
                                    disabled={isDeletingItem}
                                    className='px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={confirmRemoveItem}
                                    disabled={isDeletingItem}
                                    className='px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 font-semibold text-xs shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
                                >
                                    {isDeletingItem ? (
                                        <>
                                            <Loader2 className='w-4 h-4 animate-spin' />
                                            <span>O'chirilmoqda...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className='w-4 h-4' />
                                            <span>Ha, o'chirish</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
