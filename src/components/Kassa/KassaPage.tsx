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
}
export function KassaPage({ onBack, orderId }: KassaPageProps) {
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

    // Order ID mavjud bo'lsa, order ma'lumotlarini yuklash
    useEffect(() => {
        if (orderId) {
            setIsSaleStarted(true);

            orderService.getOrder(orderId)
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
                    showError('Order ma\'lumotlarini yuklashda xatolik');
                });
        }
    }, [orderId]);

    // API response dan Product ga transform qilish
    const transformProduct = (productResponse: ProductResponse): Product => {
        const productName = [
            productResponse.branch_detail?.name,
            productResponse.model_detail?.name,
            productResponse.type_detail?.name,
            productResponse.size_detail?.size
        ].filter(Boolean).join(' ');

        return {
            id: productResponse.id.toString(),
            productId: productResponse.id,
            name: productName || `Mahsulot #${productResponse.id}`,
            price: parseFloat(productResponse.real_price || productResponse.unit_price || '0'),
            stock: productResponse.count,
            unit: productResponse.size_detail?.unit_detail?.name || 'dona',
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
            isFavorite: false,
        };
    };

    // Order-history-product dan Product ga transform qilish
    const transformOrderProduct = useCallback((orderProduct: any): Product => {
        // Order-history-product da product ma'lumotlari null bo'lishi mumkin
        // Shuning uchun faqat mavjud ma'lumotlarni ishlatamiz
        const productName = [
            orderProduct.branch_detail?.name,
            orderProduct.model_detail?.name,
            orderProduct.type_detail?.name,
            orderProduct.size_detail?.size
        ].filter(Boolean).join(' ');

        return {
            id: orderProduct.id?.toString() || `order-product-${orderProduct.id || 'unknown'}`,
            productId: orderProduct.id,
            name: productName || `Mahsulot #${orderProduct.id || 'unknown'}`,
            price: parseFloat(orderProduct.real_price || orderProduct.unit_price || '0'),
            stock: orderProduct.count || orderProduct.given_count || 0,
            unit: orderProduct.size_detail?.unit_detail?.name || 'dona',
            image: orderProduct.product?.images?.[0]?.file || orderProduct.images?.[0]?.file || null,
            branchName: orderProduct.branch_detail?.name || null,
            modelName: orderProduct.model_detail?.name || null,
            typeName: orderProduct.type_detail?.name || null,
            size: orderProduct.size_detail?.size || null,
            unitCode: orderProduct.size_detail?.unit_detail?.code || null,
            branchId: orderProduct.branch || null,
            modelId: orderProduct.model || null,
            typeId: orderProduct.type || null,
            sizeId: orderProduct.size || null,
            isFavorite: false,
        };
    }, []);

    // OrderData o'zgarganda mahsulotlarni yangilash
    useEffect(() => {
        if (orderData?.id && isSaleStarted) {
            // OrderData o'zgarganda mahsulotlarni yuklash
            const currentOrderId = orderData.id;
            setIsLoadingProducts(true);
            orderService.getOrderProducts(currentOrderId)
                .then((orderProducts) => {
                    const transformedProducts = orderProducts
                        .filter((p: any) => !p.is_delete)
                        .map(transformOrderProduct);
                    setProducts(transformedProducts);
                })
                .catch((error) => {
                    console.error('Failed to load order products:', error);
                    showError('Mahsulotlarni yuklashda xatolik');
                })
                .finally(() => {
                    setIsLoadingProducts(false);
                });
        }
    }, [orderData?.id, isSaleStarted, transformOrderProduct]);

    // Mahsulotlarni yuklash
    const loadProducts = useCallback(async (search?: string, branch?: number | null) => {
        if (!user?.filials?.[0]) return;

        setIsLoadingProducts(true);
        try {
            // Agar orderId mavjud bo'lsa, order-history-product dan olish
            const currentOrderId = orderId || orderData?.id;
            if (currentOrderId) {
                const orderProducts = await orderService.getOrderProducts(currentOrderId);
                const transformedProducts = orderProducts
                    .filter((p: any) => !p.is_delete)
                    .map(transformOrderProduct);
                setProducts(transformedProducts);
            } else {
                // Oddiy product dan olish
                const response = await productService.getProducts({
                    search: search || undefined,
                    filial: user.filials[0],
                    branch: branch || undefined,
                    per_page: 100,
                });

                const transformedProducts = response.results
                    .filter(p => !p.is_delete)
                    .map(transformProduct);

                setProducts(transformedProducts);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            showError('Mahsulotlarni yuklashda xatolik');
        } finally {
            setIsLoadingProducts(false);
        }
    }, [user?.filials, orderId, orderData]);

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
        showLoading('Savdo yaratilmoqda...');
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
            const errorMessage = error?.response?.data?.detail || error?.message || 'Savdo yaratishda xatolik yuz berdi';
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
    const handleAddToCart = async (quantity: number, price: number) => {
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
                await orderService.createOrderProduct({
                    order_history: currentOrderId,
                    // branch: selectedProduct.branchId,
                    // model: selectedProduct.modelId,
                    // type: selectedProduct.typeId,
                    // size: selectedProduct.sizeId,
                    count: quantity,
                    // real_price: price,
                    // unit_price: price,
                    // wholesale_price: price,
                    // is_karzinka: true,
                });
            } catch (error: any) {
                console.error('Failed to add product to order:', error);
                const errorMessage = error?.response?.data?.detail || error?.message || 'Mahsulot qo\'shishda xatolik yuz berdi';
                showError(errorMessage);
                return;
            }
        }

        // Cart ga qo'shish
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
                        : item,
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
            }),
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
    const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const USD_RATE = 12180;

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
            {/* Main Content Grid */}
            <div className='flex-1 flex overflow-hidden'>
                {/* Left: Product List */}
                <div className={`w-[60%] min-w-[360px] max-w-2xl h-full border-r border-blue-200/50 ${!isSaleStarted ? 'opacity-50 pointer-events-none' : ''}`}>
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
                            filialId={user?.filials?.[0]}
                            selectedBranch={selectedBranch}
                            onBranchChange={handleBranchChange}
                        />
                    )}
                </div>

                {/* Center: Cart (100%) */}
                <div className={`flex-1 h-full min-w-[320px] `}>
                    <Cart
                        items={cart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                        totalItems={totalAmount}
                        orderData={orderData}
                        selectedCustomer={selectedCustomer}
                        onCustomerChange={handleCustomerChange}
                        onPayment={() => setIsPaymentModalOpen(true)}
                        isSaleStarted={isSaleStarted}
                        orderId={orderId}
                        onOrderUpdate={(updatedOrder) => setOrderData(updatedOrder)}
                        onStartSaleClick={handleStartSaleClick}
                        isCreatingOrder={isCreatingOrder}
                    />
                </div>
            </div>

            {/* Modals */}
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
                items={cart}
                customer={selectedCustomer || undefined}
                kassirName={user?.full_name || undefined}
                orderData={orderData}
                onOrderUpdate={(updatedOrder) => setOrderData(updatedOrder)}
            />
        </Layout>
    );
}
