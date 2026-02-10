import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ProductList } from './ProductList';
import { Cart } from './Cart';
import { ProductModal } from './ProductModal';
import { PaymentModal } from './PaymentModal';
import { Layout } from '../Layout';
import { Product, CartItem, Customer } from './types';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, OrderResponse } from '../../services/orderService';
import { productService, ProductResponse } from '../../services/productService';
import { showError, showSuccess, showLoading } from '../../lib/toast';

interface KassaPageProps {
    onBack: () => void;
    orderId?: number;
    readOnly?: boolean;
}
export function KassaPage({ onBack, orderId, readOnly = false }: KassaPageProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isSaleStarted, setIsSaleStarted] = useState(false);
    const [orderData, setOrderData] = useState<OrderResponse | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [refreshCartTrigger, setRefreshCartTrigger] = useState(0);
    const [cartItemsForPayment, setCartItemsForPayment] = useState<CartItem[]>([]);
    const [totalAmountFromCart, setTotalAmountFromCart] = useState(0);

    // order_filial tekshiruvi - agar yo'q bo'lsa, xabar ko'rsatish
    useEffect(() => {
        if (user && !user.order_filial) {
            showError('Sizda kassaga kirish huquqi yo\'q');
        }
    }, [user]);

    // Order ID mavjud bo'lsa, order ma'lumotlarini yuklash
    useEffect(() => {
        if (orderId) {
            setIsSaleStarted(true);

            orderService
                .getOrder(orderId)
                .then((order) => {
                    setOrderData(order);
                    // Mijoz ma'lumotlarini set qilish
                    if (order.client_detail) {
                        setSelectedClientId(order.client);
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
    }, [orderId]);

    // API response dan Product ga transform qilish
    const transformProduct = (productResponse: ProductResponse): Product => {
        const productName = [
            productResponse.branch_detail?.name,
            productResponse.model_detail?.name,
            productResponse.type_detail?.name,
            productResponse.size_detail?.size,
        ]
            .filter(Boolean)
            .join(' ');

        return {
            id: productResponse.id.toString(),
            productId: productResponse.id,
            name: productName || `Mahsulot #${productResponse.id}`,
            price: parseFloat(productResponse.real_price || productResponse.unit_price || '0'),
            stock: productResponse.count,
            unit: productResponse.size_detail?.unit_detail?.code || 'dona',
            image: productResponse.images?.[0]?.file,
            branchName: productResponse.branch_detail?.name,
            modelName: productResponse.model_detail?.name,
            typeName: productResponse.type_detail?.name,
            size: productResponse.size_detail?.size,
            unitCode: productResponse.size_detail?.unit_detail?.code,
            branchId: productResponse.branch,
            modelId: productResponse.model,
            typeId: productResponse.type,
            sizeId: productResponse.size,
            unitPrice: parseFloat(productResponse.unit_price || '0'),
            wholesalePrice: parseFloat(productResponse.wholesale_price || '0'),
            isFavorite: false,
        };
    };

    // Mahsulotlarni /api/v1/product dan yuklash (har doim)
    const loadProducts = useCallback(
        async (search?: string, branch?: number | null) => {
            if (!user?.order_filial) return;

            setIsLoadingProducts(true);
            try {
                const response = await productService.getProducts({
                    search: search || undefined,
                    filial: user.order_filial,
                    branch: branch || undefined,
                    per_page: 100,
                });

                const transformedProducts = response.results.filter((p) => !p.is_delete).map(transformProduct);
                setProducts(transformedProducts);
            } catch (error) {
                console.error('Failed to load products:', error);
                showError('Mahsulotlarni yuklashda xatolik');
            } finally {
                setIsLoadingProducts(false);
            }
        },
        [user?.order_filial]
    );

    // Mahsulotlarni yuklash - component mount va filter o'zgarganda
    useEffect(() => {
        loadProducts(searchQuery, selectedBranch);
    }, [loadProducts, searchQuery, selectedBranch]);

    // Branch filter o'zgarganda
    const handleBranchChange = (branchId: number | null) => {
        setSelectedBranch(branchId);
    };

    const handleProductClick = (product: Product) => {
        if (!isSaleStarted) return;
        setSelectedProduct(product);
    };

    const handleStartSale = (newOrderId: number) => {
        if (selectedCustomer) {
            setIsSaleStarted(true);
            // Order ID bilan sahifaga yo'naltirish
            navigate(`/order/${newOrderId}`);
        }
    };

    // Savdoni boshlash
    const handleStartSaleClick = async () => {
        if (!selectedClientId) {
            showError('Mijozni tanlang');
            return;
        }

        setIsCreatingOrder(true);
        try {
            const order = await orderService.createOrder({
                client: selectedClientId,
                employee: user?.id || 0,
                exchange_rate: USD_RATE,
                is_karzinka: true,
            });

            handleStartSale(order.id);
            showSuccess('Savdo muvaffaqiyatli yaratildi');
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.detail || error?.message || 'Savdo yaratishda xatolik yuz berdi';
            showError(errorMessage);
        } finally {
            setIsCreatingOrder(false);
        }
    };

    const handleCustomerChange = (customer: Customer | null) => {
        setSelectedCustomer(customer);
        if (customer) {
            setSelectedClientId(parseInt(customer.id));
            // Mijoz tanlanganda savdo hali boshlanmagan
            setIsSaleStarted(false);
        } else {
            setIsSaleStarted(false);
            setCart([]);
            setSelectedClientId(null);
        }
    };
    const handleAddToCart = async (quantity: number, price: number, priceType: 'unit' | 'wholesale') => {
        if (!selectedProduct || !isSaleStarted) return;

        // Order ID mavjudligini tekshirish
        const currentOrderId = orderId || orderData?.id;
        if (!currentOrderId) {
            showError('Savdo boshlanmagan');
            return;
        }

        // API ga POST qilish
        if (selectedProduct.branchId && selectedProduct.modelId && selectedProduct.typeId && selectedProduct.sizeId) {
            try {
                // priceType ga qarab unit_price yoki wholesale_price ni yuborish
                const orderProductData: any = {
                    product: selectedProduct.productId || 0,
                    order_history: currentOrderId,
                    count: quantity,
                };
                
                if (priceType === 'wholesale') {
                    orderProductData.wholesale_price = price;
                } else {
                    orderProductData.unit_price = price;
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
                const existing = prev.find((item) => item.id === selectedProduct.id);
                if (existing) {
                    return prev.map((item) =>
                        item.id === selectedProduct.id
                            ? {
                                ...item,
                                quantity: item.quantity + quantity,
                                totalPrice: (item.quantity + quantity) * price,
                            }
                            : item
                    );
                }
                return [
                    ...prev,
                    {
                        ...selectedProduct,
                        quantity,
                        totalPrice: quantity * price,
                    },
                ];
            });
        }
        setSelectedProduct(null);
    };
    const handleUpdateQuantity = (id: string, delta: number) => {
        if (!isSaleStarted) return;
        setCart((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const newQty = Math.max(1, item.quantity + delta);
                    return {
                        ...item,
                        quantity: newQty,
                        totalPrice: newQty * item.price,
                    };
                }
                return item;
            })
        );
    };
    const handleRemoveItem = (id: string) => {
        if (!isSaleStarted) return;
        setCart((prev) => prev.filter((item) => item.id !== id));
    };
    const handlePaymentComplete = () => {
        // Cart ni tozalash
        setCart([]);
        setSelectedCustomer(null);
        setIsSaleStarted(false);
    };
    const totalAmount =
        orderId ?? orderData?.id ? totalAmountFromCart : cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const USD_RATE = 12180;

    // order_filial yo'q bo'lsa, xabar ko'rsatish
    if (user && !user.order_filial) {
        return (
            <Layout
                onBack={onBack}
                showBackButton={true}
                selectedCustomer={selectedCustomer}
                orderData={orderData}
                isSaleStarted={isSaleStarted}
                isCreatingOrder={isCreatingOrder}
                onStartSaleClick={handleStartSaleClick}
            >
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                        <h2 className="text-xl font-semibold text-red-800 mb-2">Kirish huquqi yo'q</h2>
                        <p className="text-red-600">Sizda kassaga kirish huquqi yo'q</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout
            onBack={onBack}
            showBackButton={true}
            selectedCustomer={selectedCustomer}
            orderData={orderData}
            isSaleStarted={isSaleStarted}
            isCreatingOrder={isCreatingOrder}
            onStartSaleClick={readOnly ? undefined : handleStartSaleClick}
        >
            {/* Main Content Grid */}
            <div className='flex-1 flex flex-col lg:flex-row overflow-hidden'>
                {/* Left: Product List - faqat readOnly emas bo'lsa ko'rsatish */}
                {!readOnly && (
                    <div
                        className={`w-full lg:w-[50%] lg:min-w-[360px] lg:max-w-xl h-full lg:h-auto lg:border-r border-blue-200/50 ${!isSaleStarted ? 'opacity-50 pointer-events-none' : ''
                            }`}
                    >
                        {isLoadingProducts ? (
                            <div className='flex flex-col items-center justify-center h-full'>
                                <Loader2 className='w-8 h-8 animate-spin text-blue-600 mb-4' />
                                <p className='text-sm text-gray-500'>Mahsulotlar yuklanmoqda...</p>
                            </div>
                        ) : (
                            <ProductList
                                products={products}
                                searchQuery={searchQuery}
                                onSearchQueryChange={setSearchQuery}
                                onProductClick={handleProductClick}
                                filialId={user?.order_filial || 0}
                                selectedBranch={selectedBranch}
                                onBranchChange={handleBranchChange}
                            />
                        )}
                    </div>
                )}

                {/* Center: Cart (100% readOnly mode da, aks holda flex-1) */}
                <div className={readOnly ? 'w-full h-full' : 'flex-1 h-full min-w-0 lg:min-w-[320px]'}>
                    <Cart
                        items={cart}
                        onUpdateQuantity={readOnly ? () => { } : handleUpdateQuantity}
                        onRemoveItem={readOnly ? () => { } : handleRemoveItem}
                        totalItems={totalAmount}
                        orderData={orderData}
                        selectedCustomer={selectedCustomer}
                        onCustomerChange={readOnly ? undefined : handleCustomerChange}
                        onPayment={readOnly ? undefined : () => setIsPaymentModalOpen(true)}
                        isSaleStarted={isSaleStarted}
                        orderId={orderId}
                        onOrderUpdate={readOnly ? undefined : (updatedOrder) => setOrderData(updatedOrder)}
                        onStartSaleClick={readOnly ? undefined : handleStartSaleClick}
                        isCreatingOrder={isCreatingOrder}
                        refreshCartTrigger={refreshCartTrigger}
                        onCartChange={(items, total) => {
                            setCartItemsForPayment(items);
                            setTotalAmountFromCart(total);
                        }}
                        readOnly={readOnly}
                    />
                </div>
            </div>

            {/* Modals - faqat readOnly emas bo'lsa ko'rsatish */}
            {!readOnly && (
                <>
                    <ProductModal
                        isOpen={!!selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                        product={selectedProduct}
                        onConfirm={handleAddToCart}
                    />

                    <PaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setIsPaymentModalOpen(false)}
                        onComplete={handlePaymentComplete}
                        totalAmount={totalAmount}
                        usdRate={USD_RATE}
                        items={orderId ?? orderData?.id ? cartItemsForPayment : cart}
                        customer={selectedCustomer || undefined}
                        kassirName={user?.full_name || undefined}
                        orderData={orderData}
                        onOrderUpdate={(updatedOrder) => setOrderData(updatedOrder)}
                    />
                </>
            )}
        </Layout>
    );
}
