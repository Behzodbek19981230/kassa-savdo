import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, DollarSign, Plus, User } from 'lucide-react';
import { ProductList } from './ProductList';
import { Cart } from './Cart';
import { OrderSummary } from './OrderSummary';
import { ProductModal } from './ProductModal';
import { PaymentModal } from './PaymentModal';
import { Product, CartItem, Customer } from './types';
import { useAuth } from '../../contexts/AuthContext';
// Mock Data
const MOCK_PRODUCTS: Product[] = [
	{
		id: '1',
		name: 'Bamboo',
		price: 12000,
		stock: 17,
		unit: 'dona',
		isFavorite: true,
	},
	{
		id: '2',
		name: 'Fanta, fanta orange vitamin',
		price: 14420,
		stock: 36,
		unit: 'dona',
		isFavorite: true,
	},
	{
		id: '3',
		name: 'Just shampoo 1l',
		price: 26000,
		stock: 197,
		unit: 'dona',
		isFavorite: true,
	},
	{
		id: '4',
		name: 'Kango',
		price: 2000,
		stock: 30,
		unit: 'dona',
		isFavorite: true,
	},
	{
		id: '5',
		name: 'Windows ustanovka',
		price: 40000,
		stock: 8,
		unit: 'xizmat',
		isFavorite: true,
	},
	{
		id: '6',
		name: 'X24 kalaska',
		price: 2200000,
		stock: 0,
		unit: 'dona',
		isFavorite: true,
	},
	{
		id: '7',
		name: 'X22 kalaska',
		price: 1950000,
		stock: 0,
		unit: 'dona',
		isFavorite: true,
	},
	{
		id: '8',
		name: 'X17',
		price: 1560000,
		stock: 6,
		unit: 'dona',
		isFavorite: true,
	},
	{
		id: '9',
		name: 'Tufli (brendi)',
		price: 250000,
		stock: 29,
		unit: 'dona',
		isFavorite: true,
	},
	{
		id: '10',
		name: 'Bolt 25',
		price: 10000,
		stock: 10,
		unit: 'dona',
		isFavorite: true,
	},
];

interface KassaPageProps {
	onBack: () => void;
}
export function KassaPage({ onBack }: KassaPageProps) {
	const USD_RATE = 12180;
	const [now, setNow] = useState(() => new Date());
	const dateTimeText = new Intl.DateTimeFormat('uz-UZ', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(now);
	const timeText = new Intl.DateTimeFormat('uz-UZ', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(now);

	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(id);
	}, []);

	const { kassir } = useAuth();
	const [cart, setCart] = useState<CartItem[]>([]);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
	const handleProductClick = (product: Product) => {
		setSelectedProduct(product);
	};
	const handleAddToCart = (quantity: number, price: number) => {
		if (!selectedProduct) return;
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
		setCart((prev) => prev.filter((item) => item.id !== id));
	};
	const handlePaymentComplete = () => {
		// Cart ni tozalash
		setCart([]);
		setSelectedCustomer(null);
	};
	const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);
	const filteredProducts = MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
	return (
		<div className='flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden'>
			{/* Top Navigation Bar */}
			<header className='bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white min-h-14 px-3 sm:px-5 py-2 flex flex-col sm:flex-row sm:items-center gap-2 justify-between shrink-0 shadow-lg'>
				<div className='flex items-center justify-between gap-2'>
					<button onClick={onBack} className='hover:bg-white/20 p-2 rounded-xl transition-all duration-200'>
						<ArrowLeft size={24} />
					</button>
					<div className='sm:hidden text-sm font-semibold tracking-wide text-white/90'>Smart kassa</div>
				</div>

				<div className='hidden sm:flex flex-1 items-center justify-center'>
					<div className='text-sm font-semibold tracking-wide text-white/90'>Smart kassa</div>
				</div>

				<div className='flex items-center justify-between sm:justify-end gap-2 sm:gap-3'>
					<div className='flex items-center gap-2'>
						<div className='flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm'>
							<Clock className='w-4 h-4 text-white/90' />
							<span className='hidden md:inline text-xs font-semibold'>{dateTimeText}</span>
							<span className='md:hidden text-xs font-semibold'>{timeText}</span>
						</div>
						<div className='hidden md:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm'>
							<DollarSign className='w-4 h-4 text-white/90' />
							<span className='text-xs font-semibold'>1 USD = {USD_RATE.toLocaleString()} UZS</span>
						</div>
					</div>

					{/* Kassir Profili */}
					{kassir && (
						<div className='hidden sm:flex items-center space-x-2 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm'>
							<div className='w-8 h-8 bg-white/30 rounded-full flex items-center justify-center'>
								<User className='w-4 h-4' />
							</div>
							<div className='text-xs'>
								<div className='font-semibold'>
									{kassir.firstName} {kassir.lastName}
								</div>
							</div>
						</div>
					)}
					<button className='flex items-center hover:bg-white/20 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200'>
						<Plus size={18} className='mr-2' />
						<span className='hidden sm:inline'>Yangi savdo</span>
						<span className='sm:hidden'>Yangi</span>
					</button>
				</div>
			</header>

			{/* Main Content Grid */}
			<div className='flex-1 flex overflow-hidden'>
				{/* Left: Product List (30%) */}
				<div className='w-[30%] min-w-[280px] max-w-sm h-full'>
					<ProductList
						products={filteredProducts}
						searchQuery={searchQuery}
						onSearchQueryChange={setSearchQuery}
						onProductClick={handleProductClick}
					/>
				</div>

				{/* Center: Cart (45%) */}
				<div className='flex-1 h-full min-w-[320px]'>
					<Cart
						items={cart}
						onUpdateQuantity={handleUpdateQuantity}
						onRemoveItem={handleRemoveItem}
						totalItems={totalAmount} // Using totalAmount as per screenshot showing total value in header
					/>
				</div>

				{/* Right: Summary (25%) */}
				<div className='w-[25%] min-w-[260px] max-w-xs h-full border-l border-indigo-200/50 bg-white/30'>
					<OrderSummary
						totalAmount={totalAmount}
						usdRate={USD_RATE}
						onPayment={() => setIsPaymentModalOpen(true)}
						onCustomerChange={setSelectedCustomer}
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
				kassirName={kassir ? `${kassir.firstName} ${kassir.lastName}` : undefined}
			/>
		</div>
	);
}
