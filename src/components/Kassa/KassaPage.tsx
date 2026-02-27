import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ProductList } from './ProductList';
import { Cart } from './Cart';
import { ProductModal } from './ProductModal';
import { PaymentModal } from './PaymentModal';
import { VozvratPaymentModal } from './VozvratPaymentModal';
import { OrderLayout } from './OrderLayout';
import { OrderPaymentFields } from './OrderPaymentFields';
import { Product, CartItem, Customer } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, vozvratOrderService } from '../../services/orderService';
import { OrderResponse } from '../../types';
import { productService, ProductResponse, ProductImage } from '../../services/productService';
import { skladService, Sklad } from '../../services/skladService';
import { clientService } from '../../services/clientService';
import { showError, showSuccess } from '../../lib/toast';
import { USD_RATE, ROUTES } from '../../constants';
import type { ProductModalConfirmOptions } from './ProductModal';

interface KassaPageProps {
	orderId?: number;
	readOnly?: boolean;
	updateMode?: boolean; // PaymentModal maydonlarini ko'rsatish uchun
	isVozvratOrder?: boolean; // Vozvrat order uchun
}
export function KassaPage({ orderId, readOnly = false, updateMode = false, isVozvratOrder = false }: KassaPageProps) {
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
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
	const [selectedModel, setSelectedModel] = useState<number | null>(null);
	const [selectedType, setSelectedType] = useState<number | null>(null);
	const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
	const [isCreatingOrder, setIsCreatingOrder] = useState(false);
	const [refreshCartTrigger, setRefreshCartTrigger] = useState(0);
	const [cartItemsForPayment, setCartItemsForPayment] = useState<CartItem[]>([]);
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
				// Vozvrat order uchun faqat vozvrat API
				vozvratOrderService
					.getVozvratOrder(orderId)
					.then((order) => {
						// Vozvrat order response ni OrderResponse formatiga o'zgartirish
						const orderResponse: OrderResponse = {
							...order,
							order_filial: order.filial,
							order_filial_detail: order.filial_detail,
							created_time: order.date,
							all_product_summa: String(order.summa_total_dollar * USD_RATE),
							exchange_rate: String(order.exchange_rate),
						};
						setOrderData(orderResponse);
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
						console.error('Failed to load vozvrat order:', error);
						showError("Tovar qaytarish ma'lumotlarini yuklashda xatolik");
					});
			} else {
				// Oddiy order uchun
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
		}
	}, [orderId, isVozvratOrder]);

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

		// Images ni qayta ishlash - object yoki array bo'lishi mumkin
		let imageUrl: string | undefined;
		if (productResponse.images) {
			if (Array.isArray(productResponse.images)) {
				imageUrl = productResponse.images[0]?.file;
			} else if (typeof productResponse.images === 'object' && 'file' in productResponse.images) {
				imageUrl = (productResponse.images as ProductImage).file;
			}
		}

		return {
			id: productResponse.id.toString(),
			productId: productResponse.id,
			name: productName || `Mahsulot #${productResponse.id}`,
			price: parseFloat(productResponse.real_price || productResponse.unit_price || '0'),
			stock: productResponse.count,
			unit: productResponse.size_detail?.unit_code || 'dona',
			image: imageUrl,
			branchName: productResponse.branch_detail?.name,
			modelName: productResponse.model_detail?.name,
			typeName: productResponse.type_detail?.name,
			branchCategoryName: productResponse.branch_category_detail?.name,
			size: productResponse.size_detail?.size,
			unitCode: productResponse.size_detail?.unit_code,
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

				const transformedProducts = response.results.filter((p) => !p.is_delete).map(transformProduct);

				if (append) {
					setProducts((prev) => [...prev, ...transformedProducts]);
				} else {
					setProducts(transformedProducts);
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

	const handleProductClick = (product: any) => {
		if (!isSaleStarted) return;
		setSelectedProduct(transformProduct(product));
	};

	const handleStartSale = (newOrderId: number) => {
		if (selectedCustomer) {
			setIsSaleStarted(true);
			// Order ID bilan sahifaga yo'naltirish
			if (isVozvratOrder) {
				navigate(`/tovar-qaytarish/${newOrderId}`);
			} else {
				navigate(ROUTES.ORDER_EDIT(newOrderId));
			}
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
			let order;
			let message;
			if (isVozvratOrder) {
				// Vozvrat order yaratish
				const client = await clientService.getClient(selectedClientId);
				order = await vozvratOrderService.createVozvratOrder({
					filial: user?.order_filial || 0,
					client: selectedClientId,
					employee: user?.id || 0,
					exchange_rate: USD_RATE,
					date: new Date().toISOString().split('T')[0],
					note: '',
					old_total_debt_client: client.total_debt ? Number(client.total_debt) : 0,
					total_debt_client: client.total_debt ? Number(client.total_debt) : 0,
					summa_total_dollar: 0,
					summa_dollar: 0,
					summa_naqt: 0,
					summa_kilik: 0,
					summa_terminal: 0,
					summa_transfer: 0,
					discount_amount: 0,
					is_vazvrat_status: true,
					is_karzinka: true,
				});
			} else {
				// Oddiy order yaratish
				const response = await orderService.createOrder({
					client: selectedClientId,
					employee: user?.id || 0,
					exchange_rate: USD_RATE,
					is_karzinka: true,
				});

				order = response?.data?.data;
				message = response?.data?.message;
			}

			handleStartSale(order.id);
			showSuccess(
				isVozvratOrder
					? 'Tovar qaytarish muvaffaqiyatli yaratildi'
					: message || 'Savdo muvaffaqiyatli yaratildi',
			);
		} catch (error: any) {
			const errorMessage = error?.response?.data?.detail || error?.message || 'Yaratishda xatolik yuz berdi';
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
	const handleAddToCart = async (
		quantity: number,
		priceInSum: number,
		priceType: 'unit' | 'wholesale',
		_options: ProductModalConfirmOptions,
	) => {
		if (!selectedProduct || !isSaleStarted) return;

		const currentOrderId = orderId || orderData?.id;
		if (!currentOrderId) {
			showError('Savdo boshlanmagan');
			return;
		}

		if (selectedProduct.branchId && selectedProduct.modelId && selectedProduct.typeId && selectedProduct.sizeId) {
			try {
				const orderProductData: any = {
					product: selectedProduct.productId || 0,
					count: quantity,
					sklad: Number(_options.skladId),
				};

				// Vozvrat order yoki oddiy order bo'yicha field qo'shish
				if (isVozvratOrder || _options.vozvratOrderId) {
					// Vozvrat order uchun - faqat vozvrat_order field, order_history ishlatilmaydi
					orderProductData.vozvrat_order = _options.vozvratOrderId || currentOrderId;
				} else {
					// Oddiy order uchun - faqat order_history field
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
				const existing = prev.find((item) => item.id === selectedProduct.id);
				if (existing) {
					return prev.map((item) =>
						item.id === selectedProduct.id
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
						quantity,
						totalPrice: quantity * priceInSum,
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
	const totalAmount =
		(orderId ?? orderData?.id) ? totalAmountFromCart : cart.reduce((sum, item) => sum + (item.priceSum || 0), 0);
	const exchangeRate = orderData?.exchange_rate != null ? Number(orderData.exchange_rate) : USD_RATE;

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
					<Loader2 className='w-8 h-8 animate-spin text-blue-600 mb-4' />
					<p className='text-sm text-gray-500'>Mahsulotlar yuklanmoqda...</p>
				</div>
			) : (
				<ProductList
					products={products}
					appliedSearch={searchQuery}
					onSearchSubmit={(value) => setSearchQuery(value)}
					onProductClick={handleProductClick}
					selectedBranch={selectedBranch}
					selectedModel={selectedModel}
					selectedType={selectedType}
					onBranchChange={handleBranchChange}
					onModelChange={handleModelChange}
					onTypeChange={handleTypeChange}
					onScrollToBottom={loadMoreProducts}
					hasMore={hasMore}
					isLoadingMore={isLoadingMore}
				/>
			)}
		</div>
	);

	// Main content (Cart yoki OrderPaymentFields)
	const mainContent = updateMode ? (
		<OrderPaymentFields
			orderData={orderData}
			onOrderUpdate={(updatedOrder) => setOrderData(updatedOrder)}
			totalAmount={totalAmount}
			refreshTrigger={refreshCartTrigger}
			isVozvratOrder={isVozvratOrder}
		/>
	) : (
		<Cart
			items={cart}
			onUpdateQuantity={readOnly ? () => {} : handleUpdateQuantity}
			onRemoveItem={readOnly ? () => {} : handleRemoveItem}
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
			isVozvratOrder={isVozvratOrder}
		/>
	);

	return (
		<>
			<OrderLayout
				leftSidebar={leftSidebarContent}
				mainContent={mainContent}
				readOnly={readOnly}
				updateMode={updateMode}
			/>

			{/* Modals - only show if not readOnly */}
			{!readOnly && (
				<>
					<ProductModal
						isOpen={!!selectedProduct}
						onClose={() => setSelectedProduct(null)}
						product={selectedProduct}
						exchangeRate={exchangeRate}
						skladlar={skladlar}
						orderData={orderData}
						isVozvratOrder={isVozvratOrder}
						onConfirm={handleAddToCart}
					/>

					{isVozvratOrder ? (
						<VozvratPaymentModal
							isOpen={isPaymentModalOpen}
							onClose={() => setIsPaymentModalOpen(false)}
							onComplete={handlePaymentComplete}
							totalAmount={
								(orderId ?? orderData?.id)
									? totalAmountFromCart / exchangeRate
									: cart.reduce((sum, item) => sum + (item.priceSum || 0), 0) / exchangeRate
							}
							totalCount={
								(orderId ?? orderData?.id)
									? cartItemsForPayment.reduce((sum, item) => sum + (item.quantity || 0), 0)
									: cart.reduce((sum, item) => sum + (item.quantity || 0), 0)
							}
							usdRate={exchangeRate}
							orderData={orderData}
							onOrderUpdate={(updatedOrder) => setOrderData(updatedOrder)}
						/>
					) : (
						<PaymentModal
							isOpen={isPaymentModalOpen}
							onClose={() => setIsPaymentModalOpen(false)}
							onComplete={handlePaymentComplete}
							totalAmount={totalAmount}
							usdRate={USD_RATE}
							items={(orderId ?? orderData?.id) ? cartItemsForPayment : cart}
							customer={selectedCustomer || undefined}
							kassirName={user?.full_name || undefined}
							orderData={orderData}
							onOrderUpdate={(updatedOrder) => setOrderData(updatedOrder)}
						/>
					)}
				</>
			)}
		</>
	);
}
