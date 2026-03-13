import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ProductList } from './ProductList';
import { ProductModal } from './ProductModal';
import { PaymentModal } from './PaymentModal';
import { OrderLayout } from './OrderLayout';
import { ProductItem, CartItem, Customer } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, vozvratOrderService } from '../../services/orderService';
import { OrderResponse } from '../../types';
import { productService } from '../../services/productService';
import { skladService, Sklad } from '../../services/skladService';
import { showError } from '../../lib/toast';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';
import type { ProductModalConfirmOptions } from './ProductModal';
import { MainCartUpdate } from './MainCartUpdate';

interface KassaUpdateProps {
    orderId?: number;
    readOnly?: boolean;
    updateMode?: boolean; // PaymentModal maydonlarini ko'rsatish uchun
    isVozvratOrder?: boolean;
}
export function KassaUpdate({
    orderId,
    readOnly = false,
    updateMode = false,
    isVozvratOrder = false,
}: KassaUpdateProps) {
    const { user } = useAuth();
    const { displayRate } = useExchangeRate();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isSaleStarted, setIsSaleStarted] = useState(false);
    const [orderData, setOrderData] = useState<OrderResponse | null>(null);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
    const [selectedModel, setSelectedModel] = useState<number | null>(null);
    const [selectedType, setSelectedType] = useState<number | null>(null);
    const [refreshCartTrigger, setRefreshCartTrigger] = useState(0);
    const [totalAmountFromCart, setTotalAmountFromCart] = useState(0);
    const [skladlar, setSkladlar] = useState<Sklad[]>([]);

    // order_filial tekshiruvi - agar yo'q bo'lsa, xabar ko'rsatish
    useEffect(() => {
        if (user && !user.order_filial) {
            showError("Sizda kassaga kirish huquqi yo'q");
        }
    }, [user]);

    // Skladlar ro'yxatini filial bo'yicha yuklash (ProductModal uchun)
    const filialId = orderData?.order_filial ?? user?.order_filial ?? undefined;
    useEffect(() => {
        if (!filialId) {
            setSkladlar([]);
            return;
        }
        skladService
            .getSkladlar({ filial: filialId })
            .then(setSkladlar)
            .catch(() => setSkladlar([]));
    }, [filialId]);

    // Order ID mavjud bo'lsa, order ma'lumotlarini yuklash
    useEffect(() => {
        if (orderId) {
            setIsSaleStarted(true);

            if (isVozvratOrder) {
                vozvratOrderService
                    .getVozvratOrder(orderId)
                    .then((order) => {
                        const orderResponse: OrderResponse = {
                            ...order,
                            order_filial: order.filial,
                            order_filial_detail: order.filial_detail,
                            created_time: order.date,
                            all_product_summa: String((order.summa_total_dollar || 0) * displayRate),
                            exchange_rate: String(order.exchange_rate),
                        };
                        setOrderData(orderResponse);
                        if (order.client_detail) {
                            setSelectedCustomer({
                                id: order.client_detail.id.toString(),
                                name: order.client_detail.full_name,
                                phone: order.client_detail.phone_number,
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Failed to load vozvrat order:', error);
                        showError("Tovar qaytarish ma'lumotlarini yuklashda xatolik");
                    });
            } else {
                orderService
                    .getOrder(orderId)
                    .then((order) => {
                        setOrderData(order);
                        if (order.client_detail) {
                            setSelectedCustomer({
                                id: order.client_detail.id.toString(),
                                name: order.client_detail.full_name,
                                phone: order.client_detail.phone_number,
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Failed to load order:', error);
                        showError("Order ma'lumotlarini yuklashda xatolik");
                    });
            }
        }
    }, [orderId, isVozvratOrder, displayRate]);

    // Mahsulotlarni /api/v1/product dan yuklash (har doim)
    const loadProducts = useCallback(
        async (
            search?: string,
            branch?: number | null,
            model?: number | null,
            type?: number | null,
            page: number = 1,
            append: boolean = false,
        ) => {
            if (!user?.order_filial) return;

            if (append) {
                setIsLoadingMore(true);
            } else {
                setIsLoadingProducts(true);
            }

            try {
                const response = await productService.getProducts({
                    search: search || undefined,
                    filial: user.order_filial,
                    branch: branch ?? undefined,
                    model: model ?? undefined,
                    type: type ?? undefined,
                    page: page,
                    limit: 50, // Limit 50 ga o'zgartirildi
                });

                const filteredProducts = response.results.filter((p) => !p.is_delete);

                if (append) {
                    setProducts((prev) => [...prev, ...filteredProducts]);
                } else {
                    setProducts(filteredProducts);
                }

                // Pagination ma'lumotlarini yangilash
                setHasMore(page < response.pagination.lastPage);
                setCurrentPage(page);
            } catch (error) {
                console.error('Failed to load products:', error);
                showError('Mahsulotlarni yuklashda xatolik');
            } finally {
                setIsLoadingProducts(false);
                setIsLoadingMore(false);
            }
        },
        [user?.order_filial],
    );

    // Keyingi sahifani yuklash
    const loadMoreProducts = useCallback(() => {
        if (isLoadingMore || !hasMore || !user?.order_filial) return;

        loadProducts(searchQuery, selectedBranch, selectedModel, selectedType, currentPage + 1, true);
    }, [
        isLoadingMore,
        hasMore,
        currentPage,
        searchQuery,
        selectedBranch,
        selectedModel,
        selectedType,
        loadProducts,
        user?.order_filial,
    ]);

    // Mahsulotlarni yuklash - component mount va filter o'zgarganda
    useEffect(() => {
        setCurrentPage(1);
        setHasMore(false);
        loadProducts(searchQuery, selectedBranch, selectedModel, selectedType, 1, false);
    }, [searchQuery, selectedBranch, selectedModel, selectedType]);

    const handleBranchChange = (branchId: number | null) => setSelectedBranch(branchId);
    const handleModelChange = (modelId: number | null) => setSelectedModel(modelId);
    const handleTypeChange = (typeId: number | null) => setSelectedType(typeId);

    const handleProductClick = (product: ProductItem) => {
        if (!isSaleStarted) return;
        setSelectedProduct(product);
        console.log(product);
    };

    const handleAddToCart = async (quantity: number, priceInSum: number, _options: ProductModalConfirmOptions) => {
        if (!selectedProduct || !isSaleStarted) return;

        const currentOrderId = orderId || orderData?.id;
        if (!currentOrderId) {
            showError('Savdo boshlanmagan');
            return;
        }

        if (selectedProduct.branch && selectedProduct.model) {
            try {
                const orderProductData: any = {
                    product: selectedProduct.id || 0,
                    count: quantity,
                    sklad: Number(_options.skladId),
                };
                if (isVozvratOrder) {
                    orderProductData.vozvrat_order = currentOrderId;
                } else {
                    orderProductData.order_history = currentOrderId;
                }
                // price_dollar va price_sum ni qo'shish
                if (_options.priceDollar != null) {
                    orderProductData.price_dollar = _options.priceDollar;
                }
                if (_options.priceSum != null) {
                    orderProductData.price_sum = _options.priceSum;
                }

                await orderService.createOrderProduct(orderProductData);
            } catch (error: any) {
                console.error('Failed to add product to order:', error);
                const errorMessage =
                    error?.response?.data?.detail || error?.message || "Mahsulot qo'shishda xatolik yuz berdi";
                showError(errorMessage);
                return;
            }
            setRefreshCartTrigger((t) => t + 1);
        } else {
            setCart((prev) => {
                const existing = prev.find((item) => item.id === String(selectedProduct.id));
                if (existing) {
                    return prev.map((item) =>
                        item.id === String(selectedProduct.id)
                            ? {
                                ...item,
                                quantity: item.quantity + quantity,
                                totalPrice: (item.quantity + quantity) * priceInSum,
                            }
                            : item,
                    );
                }
                return [
                    ...prev,
                    {
                        ...selectedProduct,
                        id: String(selectedProduct.id),
                        quantity,
                        totalPrice: quantity * priceInSum,
                    },
                ];
            });
        }
        setSelectedProduct(null);
    };

    const handleRemoveItem = (id: string) => {
        if (!isSaleStarted) return;
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const totalAmount =
        (orderId ?? orderData?.id)
            ? totalAmountFromCart
            : cart.reduce((sum, item) => sum + (item.price_dollar || item.price_sum || 0), 0);
    const exchangeRate = orderData?.exchange_rate != null ? Number(orderData.exchange_rate) : displayRate;

    // order_filial yo'q bo'lsa, xabar ko'rsatish
    if (user && !user.order_filial) {
        return (
            <>
                <div className='flex flex-col items-center justify-center h-full'>
                    <div className='bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center'>
                        <h2 className='text-xl font-semibold text-red-800 mb-2'>Kirish huquqi yo'q</h2>
                        <p className='text-red-600'>Sizda kassaga kirish huquqi yo'q</p>
                    </div>
                </div>
            </>
        );
    }

    // Left sidebar content
    const leftSidebarContent = (
        <div className={`h-full ${!isSaleStarted ? 'opacity-50 pointer-events-none' : ''}`}>
            {isLoadingProducts ? (
                <div className='flex flex-col items-center justify-center h-full min-h-[200px]'>
                    <Loader2 className='w-8 h-7 animate-spin text-blue-600 mb-4' />
                    <p className='text-sm text-gray-500'>Mahsulotlar yuklanmoqda...</p>
                </div>
            ) : (
                <ProductList
                    onProductClick={handleProductClick}

                />
            )}
        </div>
    );

    // Main content (Cart yoki OrderPaymentFields)
    const mainContent = (
        <MainCartUpdate
            onRemoveItem={handleRemoveItem}
            orderData={orderData}
            selectedCustomer={selectedCustomer}
            orderId={orderId}
            refreshCartTrigger={refreshCartTrigger}
            onCartChange={(_items, total) => {
                setTotalAmountFromCart(total);
            }}
            readOnly={readOnly}
            isVozvratOrder={isVozvratOrder}
        />
    );

    return (
        <>
            <OrderLayout
                leftSidebar={leftSidebarContent}
                mainContent={mainContent}
                readOnly={readOnly || !updateMode}
            />

            {/* Modals - only show if not readOnly */}
            {(!readOnly || updateMode) && (
                <>
                    <ProductModal
                        isOpen={!!selectedProduct}
                        onClose={() => {
                            setSelectedProduct(null);
                            setRefreshCartTrigger((t) => t + 1);
                        }}
                        product={selectedProduct}
                        exchangeRate={exchangeRate}
                        skladlar={skladlar}
                        orderData={orderData}
                        onConfirm={handleAddToCart}
                    />
                </>
            )}
        </>
    );
}
