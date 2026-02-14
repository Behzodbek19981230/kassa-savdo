import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Product } from './types';
import { Input, Label } from '../ui/Input';

export type ProductSource = 'filial' | 'sklad';

export interface ProductModalConfirmOptions {
	source: ProductSource;
	skladId?: number;
}

interface ProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	exchangeRate: number;
	skladlar: { id: number; name: string }[];
	onConfirm: (
		quantity: number,
		priceInSum: number,
		priceType: 'unit' | 'wholesale',
		options: ProductModalConfirmOptions,
	) => void;
}
export function ProductModal({ isOpen, onClose, product, exchangeRate, skladlar, onConfirm }: ProductModalProps) {
	const [quantity, setQuantity] = useState<string>('1');
	const [price, setPrice] = useState<string>('0');
	const [priceType, setPriceType] = useState<'unit' | 'wholesale'>('unit');
	const [currency, setCurrency] = useState<'sum' | 'dollar'>('sum');
	const [source, setSource] = useState<ProductSource>('filial');
	const [selectedSkladId, setSelectedSkladId] = useState<number | null>(null);

	useEffect(() => {
		if (product) {
			const isOptom = product.unitCode?.toLowerCase() === 'optom';
			setPriceType(isOptom ? 'wholesale' : 'unit');
			const defaultPrice = isOptom ? product.wholesalePrice || product.price : product.unitPrice || product.price;
			setPrice(defaultPrice.toString());
			setQuantity('1');
			setCurrency('sum');
			setSource('filial');
			setSelectedSkladId(null);
		}
	}, [product]);

	// Narx turi o'zgarganda — tanlangan birlikka mos narx, valyutaga (so'm/dollar) mos ko'rsatish
	const handlePriceTypeChange = (newPriceType: 'unit' | 'wholesale') => {
		setPriceType(newPriceType);
		if (product) {
			const priceUzs =
				newPriceType === 'wholesale'
					? product.wholesalePrice || product.price
					: product.unitPrice || product.price;
			const displayValue = currency === 'dollar' ? priceUzs / exchangeRate : priceUzs;
			setPrice(displayValue.toString());
		}
	};

	// Valyuta o'zgarganda (So'm ↔ Dollar) — joriy summani konvertatsiya qilish
	const handleCurrencyChange = (newCurrency: 'sum' | 'dollar') => {
		const current = parseFloat(price) || 0;
		if (newCurrency === 'dollar') {
			setPrice((current / exchangeRate).toString()); // UZS → USD
		} else {
			setPrice((current * exchangeRate).toString()); // USD → UZS
		}
		setCurrency(newCurrency);
	};
	if (!isOpen || !product) return null;

	const handleConfirm = () => {
		const qty = parseFloat(quantity);
		const priceValue = parseFloat(price);
		if (qty <= 0 || priceValue <= 0) return;
		if (source === 'sklad' && !selectedSkladId) return;
		const priceInSum = currency === 'dollar' ? priceValue * exchangeRate : priceValue;
		onConfirm(qty, priceInSum, priceType, {
			source,
			skladId: source === 'sklad' ? (selectedSkladId ?? undefined) : undefined,
		});
		onClose();
	};

	const priceValue = parseFloat(price) || 0;
	const priceInSum = currency === 'dollar' ? priceValue * exchangeRate : priceValue;
	const total = parseFloat(quantity) * priceInSum;
	return (
		<div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
			<div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-2 border-indigo-200'>
				<div className='flex justify-between items-center p-5 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50'>
					<h3 className='text-xl font-bold text-gray-900'>{product.name}</h3>
					<button
						onClick={onClose}
						className='text-gray-500 hover:text-indigo-600 hover:bg-white p-2 rounded-xl transition-all duration-200'
					>
						<X size={24} />
					</button>
				</div>

				<div className='p-6 bg-white'>
					<div className='flex justify-between text-sm text-indigo-600 bg-emerald-50/50 p-3 rounded-xl mb-5'>
						<span className='font-medium'>Sotuvda bor:</span>
						<span className='font-bold text-emerald-700'>
							{product.stock.toLocaleString()} {product.unit}
						</span>
					</div>

					<div className='grid grid-cols-2 gap-5'>
						{/* Valyuta: Dollar / So'm */}
						<div>
							<Label className='block text-xs text-indigo-600 mb-2 ml-1 font-semibold'>Savdo</Label>
							<div className='flex gap-4'>
								<label className='flex items-center gap-2 cursor-pointer'>
									<input
										type='radio'
										name='currency'
										checked={currency === 'sum'}
										onChange={() => handleCurrencyChange('sum')}
										className='w-4 h-4 text-indigo-600 focus:ring-indigo-500'
									/>
									<span className='text-sm font-medium text-gray-700'>So&apos;m</span>
								</label>
								<label className='flex items-center gap-2 cursor-pointer'>
									<input
										type='radio'
										name='currency'
										checked={currency === 'dollar'}
										onChange={() => handleCurrencyChange('dollar')}
										className='w-4 h-4 text-indigo-600 focus:ring-indigo-500'
									/>
									<span className='text-sm font-medium text-gray-700'>Dollar</span>
								</label>
							</div>
						</div>

						{/* Manba: Do'kondan / Skladdan */}
						<div>
							<Label className='block text-xs text-indigo-600 mb-2 ml-1 font-semibold'>Manba</Label>
							<div className='flex gap-4'>
								<label className='flex items-center gap-2 cursor-pointer'>
									<input
										type='radio'
										name='source'
										checked={source === 'filial'}
										onChange={() => {
											setSource('filial');
											setSelectedSkladId(null);
										}}
										className='w-4 h-4 text-indigo-600 focus:ring-indigo-500'
									/>
									<span className='text-sm font-medium text-gray-700'>Do&apos;kondan</span>
								</label>
								<label className='flex items-center gap-2 cursor-pointer'>
									<input
										type='radio'
										name='source'
										checked={source === 'sklad'}
										onChange={() => setSource('sklad')}
										className='w-4 h-4 text-indigo-600 focus:ring-indigo-500'
									/>
									<span className='text-sm font-medium text-gray-700'>Skladdan</span>
								</label>
							</div>
							{source === 'sklad' && (
								<div className='mt-3'>
									<Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
										Sklad
									</Label>
									<select
										value={selectedSkladId ?? ''}
										onChange={(e) =>
											setSelectedSkladId(e.target.value ? Number(e.target.value) : null)
										}
										className='w-full rounded-xl border-2 border-indigo-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
									>
										<option value=''>Skladni tanlang</option>
										{skladlar.map((s) => (
											<option key={s.id} value={s.id}>
												{s.name}
											</option>
										))}
									</select>
								</div>
							)}
						</div>

						{/* Narx turi */}
						<div>
							<Label className='block text-xs text-indigo-600 mb-2 ml-1 font-semibold'>Narx turi</Label>
							<div className='flex gap-3 flex-wrap'>
								<label className='flex items-center gap-2 cursor-pointer'>
									<input
										type='radio'
										name='priceType'
										value='unit'
										checked={priceType === 'unit'}
										onChange={(e) => handlePriceTypeChange('unit')}
										className='w-4 h-4 text-indigo-600 focus:ring-indigo-500'
									/>
									<span className='text-sm font-medium text-gray-700'>Dona</span>
									<span className='text-sm text-gray-500'>
										({currency === 'dollar'
											? ((product.unitPrice || product.price || 0) / exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' USD'
											: (product.unitPrice || product.price || 0).toLocaleString() + ' UZS'})
									</span>
								</label>
								<label className='flex items-center gap-2 cursor-pointer'>
									<input
										type='radio'
										name='priceType'
										value='wholesale'
										checked={priceType === 'wholesale'}
										onChange={(e) => handlePriceTypeChange('wholesale')}
										className='w-4 h-4 text-indigo-600 focus:ring-indigo-500'
									/>
									<span className='text-sm font-medium text-gray-700'>Optom</span>
									<span className='text-sm text-gray-500'>
										({currency === 'dollar'
											? ((product.wholesalePrice || product.price || 0) / exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' USD'
											: (product.wholesalePrice || product.price || 0).toLocaleString() + ' UZS'})
									</span>
								</label>
							</div>
						</div>
						<div></div>

						{/* Miqdori — 1-qatorda chapda */}
						<div>
							<Label htmlFor='quantity' className='block text-xs text-indigo-600 mb-2 ml-1 font-semibold'>
								Miqdori
							</Label>
							<div className='flex rounded-xl shadow-lg overflow-hidden border-2 border-indigo-200'>
								<Input
									id='quantity'
									type='number'
									value={quantity}
									onChange={(e) => setQuantity(e.target.value)}
									className='flex-1 block w-full rounded-l-xl border-0 sm:text-lg p-3 bg-white'
									autoFocus
								/>
								<div className='flex justify-between text-sm text-gray-600 bg-indigo-50/50 px-3 py-2 min-w-[3rem] items-center'>
									{product.unitCode}
								</div>
							</div>
						</div>

						{/* Summasi — 1-qatorda o'ngda */}
						<div>
							<Label htmlFor='price' className='block text-xs text-indigo-600 mb-2 ml-1 font-semibold'>
								Summasi {currency === 'dollar' ? '(USD)' : '(UZS)'}
							</Label>
							<div className='flex rounded-xl shadow-lg overflow-hidden border-2 border-indigo-200'>
								<Input
									id='price'
									type='number'
									step='0.01'
									value={price}
									onChange={(e) => setPrice(e.target.value)}
									className='flex-1 block w-full rounded-l-xl border-0 sm:text-lg p-3 bg-white'
									placeholder={currency === 'dollar' ? 'Narx (USD)' : 'Narx (UZS)'}
								/>
								<div className='flex justify-between text-sm text-gray-600 bg-indigo-50/50 px-3 py-2 min-w-[3rem] items-center'>
									{currency === 'dollar' ? 'USD' : 'UZS'}
								</div>
							</div>
						</div>
					</div>

					{/* Jami summa */}
					<div className='mt-5 bg-emerald-50 p-3 rounded-xl border border-emerald-200'>
						<div className='flex justify-between items-center'>
							<span className='text-sm font-medium text-emerald-700'>Jami:</span>
							<span className='text-xl font-bold text-emerald-900'>{total.toLocaleString()} UZS</span>
						</div>
					</div>

					<div className='flex justify-end pt-4'>
						<button
							onClick={handleConfirm}
							className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold flex items-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]'
						>
							<span className='mr-2'>✓</span> SAQLASH
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
