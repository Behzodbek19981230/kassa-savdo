import { Trash2, User, Loader2, Edit2, X } from 'lucide-react';
import { Customer, OrderItem, OrderResponse } from '../../types';
import { useState, useEffect, useCallback } from 'react';
import { showError, showSuccess } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';
import { ProductModal } from './ProductModal';
import { orderService, vozvratOrderService } from '../../services/orderService';
import { useQuery } from '@tanstack/react-query';
import { skladService } from '../../services/skladService';
import { OrderPaymentFields } from './OrderPaymentFields';
import { formatMoney } from '../../lib/utils';

interface MainCartUpdateProps {
    onRemoveItem: (id: string) => void;
    orderData?: OrderResponse | null;
    selectedCustomer?: Customer | null;
    orderId?: number;
    /** Mahsulot qo'shilgandan keyin yangilash uchun (KassaPage dan beriladi) */
    refreshCartTrigger?: number;
    /** Savdo ro'yxati yoki summa o'zgarganda (PaymentModal uchun) */
    onCartChange?: (items: OrderItem[], totalAmount: number) => void;
    /** Read-only mode - faqat ko'rish uchun */
    readOnly?: boolean;
    /** Tovar qaytarish orderi */
    isVozvratOrder?: boolean;
}
export function MainCartUpdate({
    onRemoveItem,
    orderData,
    selectedCustomer,
    orderId,
    refreshCartTrigger = 0,
    onCartChange,
    readOnly = false,
    isVozvratOrder = false,
}: MainCartUpdateProps) {
    const { user } = useAuth();
    const { displayRate } = useExchangeRate();
    const [skladlar, setSkladlar] = useState<{ id: number; name: string }[]>([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productForModal, setProductForModal] = useState<any | null>(null);
    // OrderPaymentFields ichidagi summalar/refetch modal yopilganda ham yangilanishi uchun
    const [paymentRefreshTrigger, setPaymentRefreshTrigger] = useState(0);

    const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isDeletingItem, setIsDeletingItem] = useState(false);

    // Fetch order products via react-query (returns filtered non-deleted items)
    const orderHistoryId = orderId ?? orderData?.id;
    const queryKey = ['orderProducts', orderHistoryId, isVozvratOrder, refreshCartTrigger];

    const {
        data: fetchedOrderProducts,
        refetch: refetchOrderProducts,
        isFetching: isFetchingOrderProducts,
    } = useQuery<OrderItem[]>({
        queryKey,
        queryFn: async () => {
            if (!orderHistoryId) return [] as OrderItem[];
            const list = isVozvratOrder
                ? await vozvratOrderService.getVozvratOrderProducts(orderHistoryId)
                : await orderService.getOrderProducts(orderHistoryId);
            return (list || []).filter((p: OrderItem) => !p.is_delete) as OrderItem[];
        },
        enabled: !!orderHistoryId || refreshCartTrigger > 0, // Enable when we have an orderHistoryId or refresh trigger changes
    });
    const orderProducts = fetchedOrderProducts || ([] as OrderItem[]);

    // Mijozning qarzi (orderResponse yoki client_detail ichidan olinadi)
    const clientDebtValue = orderData?.client_detail?.total_debt ?? orderData?.total_debt_client ?? '0';
    const clientDebtNumber = parseFloat(String(clientDebtValue)) || 0;

    // Exchange rate to use for USD calculations
    const exchangeRate = orderData?.exchange_rate != null ? Number(orderData.exchange_rate) : displayRate;

    // Jami summani hisoblash
    // price_sum/price_dollar birlik narx bo'lsa: jami = birlik * count
    const totalAmount = orderProducts.reduce(
        (sum, item) => sum + (parseFloat(item.price_sum) || 0) * (Number(item.count) || 0),
        0,
    );
    const totalAmountDollar = orderProducts.reduce(
        (sum, item) => sum + (parseFloat(item.price_dollar) || 0) * (Number(item.count) || 0),
        0,
    );

    // Parent (PaymentModal va boshqalar) uchun ro'yxat va jami summani yangilash
    // Debounce updates so header/cards elsewhere aren't updated on every quick change
    useEffect(() => {
        const t = setTimeout(() => {
            onCartChange?.(orderProducts, totalAmount);
        }, 600);
        return () => clearTimeout(t);
    }, [orderProducts, totalAmount]);

    // orderProducts o'zgarganda OrderPaymentFields ham qayta hisoblasin
    useEffect(() => {
        setPaymentRefreshTrigger((t) => t + 1);
    }, [orderProducts, totalAmount, totalAmountDollar]);

    // Mahsulotni o'chirish uchun tasdiqlash modalini ochish
    const handleRemoveItem = (id: number) => {
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
                await orderService.deleteOrderProduct(itemToDelete);
                const res = await refetchOrderProducts();
                const updatedList: OrderItem[] = (res?.data as OrderItem[] | undefined) || [];
                const newTotal = updatedList.reduce(
                    (s: number, it: OrderItem) => s + (parseFloat(it.price_sum) || 0) * (Number(it.count) || 0),
                    0,
                );
                onCartChange?.(updatedList, newTotal);
                setPaymentRefreshTrigger((t) => t + 1);
                showSuccess("Mahsulot muvaffaqiyatli o'chirildi");
            } else {
                onRemoveItem(String(itemToDelete));
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
    const handleEditOrderProduct = (item: OrderItem) => {
        const nameParts = [
            item.branch_detail?.name,
            item.model_detail?.name,
            item.type_detail?.name,
            item.size_detail?.size,
        ]
            .filter(Boolean)
            .join(' ');
        const productFor = {
            id: String(item.id),
            productId: item.product_detail?.id ?? item.product,
            name: nameParts || `Mahsulot #${item.product_detail?.id ?? item.product}`,
            price: parseFloat(item.price_sum) || 0,
            price_sum: parseFloat(item.price_sum) || 0,
            price_dollar: parseFloat(item.price_dollar) || 0,
            stock: item.product_detail?.count ?? item.count ?? 0,
            unit: item.size_detail?.unit_code ?? item.size_detail?.unit_detail?.code ?? 'dona',
            unitCode: item.size_detail?.unit_code ?? item.size_detail?.unit_detail?.code ?? 'dona',
            branchName: item.branch_detail?.name,
            modelName: item.model_detail?.name,
            typeName: item.type_detail?.name,
            branchCategoryName: item.branch_category_detail?.name,
            size: item.size_detail?.size,
            branchId: item.product_detail?.branch ?? item.branch,
            modelId: item.product_detail?.model ?? item.model,
            typeId: item.product_detail?.type ?? item.type,
            sizeId: item.product_detail?.size ?? item.size,
            unitPrice: parseFloat(item.product_detail?.unit_price ?? item.unit_price ?? '0') || 0,
            wholesalePrice: parseFloat(item.product_detail?.wholesale_price ?? item.wholesale_price ?? '0') || 0,
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
                // currency: options.currencyId,
            });
            showSuccess('Mahsulot muvaffaqiyatli yangilandi');
            setIsProductModalOpen(false);
            setProductForModal(null);
            const res = await refetchOrderProducts();
            const updatedList: OrderItem[] = (res?.data as OrderItem[] | undefined) || [];
            const newTotal = updatedList.reduce(
                (s: number, it: OrderItem) => s + (parseFloat(it.price_sum) || 0) * (Number(it.count) || 0),
                0,
            );
            onCartChange?.(updatedList, newTotal);
            setPaymentRefreshTrigger((t) => t + 1);
        } catch (error: any) {
            console.error('Failed to update order product:', error);
            const errorMessage = error?.response?.data?.detail || error?.message || 'Mahsulotni yangilashda xatolik';
            showError(errorMessage);
        }
    };

    const handleCloseEditModal = useCallback(() => {
        setIsProductModalOpen(false);
        setProductForModal(null);
        // close = faqat yopish (saqlash bo'lsa handleConfirmEditOrderProduct ichida refetch bo'ladi)
        setPaymentRefreshTrigger((t) => t + 1);
    }, []);

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

    return (
        <div className='flex flex-col h-full bg-white border-r border-blue-200/50'>
            {/* Header */}
            <div className='p-4 bg-blue-600 border-b border-blue-400 shadow-md'>
                {/* Barcha elementlar bir qatorda */}
                <div className='flex items-center gap-3 flex-wrap'>
                    {/* Mijoz ma'lumotlari */}
                    {selectedCustomer && (
                        <div className='hidden sm:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm shrink-0'>
                            <User className='w-4 h-4 text-white/90 shrink-0' />
                            <div className='text-xs'>
                                <div className='font-semibold whitespace-nowrap text-white'>
                                    {selectedCustomer.name}
                                </div>
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
                            <div className='text-sm'>{formatMoney(clientDebtNumber)} UZS</div>
                        </div>
                    )}

                    {/* Jami summa */}
                    <div className='text-right shrink-0 ml-auto'>
                        <div className='text-xs text-white/80 mb-1'>Jami</div>
                        <div className='text-sm  sm:text-sm font-bold text-yellow-200 whitespace-nowrap'>
                            {formatMoney(totalAmountDollar)} USD ({formatMoney(totalAmount)} UZS)
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Edit Modal (order-history-product tahrirlash) */}
            <ProductModal
                isOpen={isProductModalOpen}
                onClose={handleCloseEditModal}
                product={productForModal}
                exchangeRate={exchangeRate}
                skladlar={skladlar}
                orderData={orderData}
                orderProductId={productForModal?.id ? Number(productForModal.id) : null}
                onConfirm={handleConfirmEditOrderProduct}
            />

            {/* Cart Items — /api/v1/order-history-product dan order-history bo'yicha */}
            <div className='flex-1 overflow-y-auto p-2 space-y-2'>
                {isFetchingOrderProducts ? (
                    <div className='flex flex-col items-center justify-center py-8'>
                        <Loader2 className='w-6 h-6 animate-spin text-blue-600 mb-2' />
                        <p className='text-xs text-gray-500'>Savdo mahsulotlari yuklanmoqda...</p>
                    </div>
                ) : (
                    orderProducts.map((item, index) => {
                        return (
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
                                    {item.count} {item.size_detail?.unit_code || 'dona'}
                                </div>

                                {/* Product Details */}
                                <div className='flex-1 px-1.5 min-w-0'>
                                    <div className='flex flex-wrap gap-1'>
                                        <span className='text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded'>
                                            Birlik narxi: {item.price_dollar} $
                                        </span>
                                        {item.branch_category_detail?.name && (
                                            <span className='text-[10px] text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded'>
                                                Kategoriya: {item.branch_category_detail?.name}
                                            </span>
                                        )}
                                        {item.model_detail?.name && (
                                            <span className='text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded'>
                                                Modeli: {item.model_detail?.name}
                                            </span>
                                        )}
                                        {item.type_detail?.name && (
                                            <span className='text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded'>
                                                Turi: {item.type_detail?.name}
                                            </span>
                                        )}
                                        {item.size_detail?.size && (
                                            <span className='text-[10px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded'>
                                                O'lchami: {item.size_detail?.size} {item.size_detail?.unit_code || ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Total & Actions */}
                                <div className='flex items-center gap-1.5 shrink-0'>
                                    <div className='text-right'>
                                        <div className='font-bold text-blue-700 text-xs whitespace-nowrap'>
                                            {formatMoney((Number(item.price_dollar ?? 0) * (Number(item.count ?? 0))))} $
                                        </div>
                                        <div className='text-[10px] text-gray-500'>
                                            {formatMoney((Number(item.price_sum ?? 0) * (Number(item.count ?? 0))))} UZS
                                        </div>
                                    </div>
                                    {!readOnly && (
                                        <>
                                            {(orderId ?? orderData?.id) && (
                                                <button
                                                    onClick={() => handleEditOrderProduct(item)}
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
                        );
                    })
                )}
                <OrderPaymentFields
                    orderData={orderData ?? null}
                    onOrderUpdate={() => { }}
                    refreshTrigger={refreshCartTrigger + paymentRefreshTrigger}
                    isVozvratOrder={isVozvratOrder}
                    orderProducts={orderProducts}
                    orderProductsLoading={isFetchingOrderProducts}
                />
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
