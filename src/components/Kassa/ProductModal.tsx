import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Product, OrderResponse } from '../../types';
import { Input, Label } from '../ui/Input';
import { Autocomplete } from '../ui/Autocomplete';
import { productService } from '../../services/productService';
import { currencyService, Currency } from '../../services/currencyService';

export interface ProductModalConfirmOptions {
    skladId: number;
}

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    exchangeRate: number;
    skladlar: { id: number; name: string }[];
    orderData?: OrderResponse | null;
    onConfirm: (
        quantity: number,
        priceInSum: number,
        priceType: 'unit' | 'wholesale',
        options: ProductModalConfirmOptions,
    ) => void;
}
export function ProductModal({ isOpen, onClose, product, exchangeRate, skladlar, orderData, onConfirm }: ProductModalProps) {
    const [quantity, setQuantity] = useState<string>('1');
    const [price, setPrice] = useState<string>('0');
    const [selectedSkladId, setSelectedSkladId] = useState<number | null>(null);
    const [skladStockCount, setSkladStockCount] = useState<number | null>(null);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
    const [errors, setErrors] = useState<{ sklad?: string; quantity?: string; price?: string; stock?: string }>({});

    // Currency ro'yxatini yuklash
    useEffect(() => {
        const loadCurrencies = async () => {
            try {
                const currencyList = await currencyService.getCurrencies();
                setCurrencies(currencyList);
            } catch (error) {
                console.error('Failed to load currencies:', error);
            }
        };
        loadCurrencies();
    }, []);

    // OrderData dan currency ni olish
    useEffect(() => {
        if (orderData?.currency && currencies.length > 0) {
            const currency = currencies.find((c) => c.id === orderData.currency);
            setSelectedCurrency(currency || null);
        } else {
            // Default currency - UZS
            const uzsCurrency = currencies.find((c) => c.code === 'UZS');
            setSelectedCurrency(uzsCurrency || null);
        }
    }, [orderData?.currency, currencies]);

    useEffect(() => {
        if (product) {
            const defaultPrice = product.unitPrice ?? product.price ?? 0;
            setPrice(String(defaultPrice));
            setQuantity('1');
            setSelectedSkladId(null);
            setSkladStockCount(null);
            setErrors({}); // Errorlarni tozalash
        }
    }, [product]);

    // Sklad tanlanganda /api/v1/product-stock/ dan qoldiqni olish
    useEffect(() => {
        if (!product || selectedSkladId == null) {
            setSkladStockCount(null);
            return;
        }
        const productId = product.productId ?? Number(product.id);
        if (!productId) return;
        setIsLoadingStock(true);
        productService
            .getProductStock({ product: productId, sklad: selectedSkladId })
            .then((res) => setSkladStockCount(res.count ?? 0))
            .catch(() => setSkladStockCount(null))
            .finally(() => setIsLoadingStock(false));
    }, [product, selectedSkladId]);

    const skladOptions = useMemo(
        () =>
            skladlar.map((s) => ({
                id: String(s.id),
                label: s.name,
                value: String(s.id),
            })),
        [skladlar],
    );

    if (!isOpen || !product) return null;

    const handleConfirm = () => {
        const newErrors: { sklad?: string; quantity?: string; price?: string; stock?: string } = {};
        const qty = parseFloat(quantity);
        const priceValue = parseFloat(price);

        // Sklad validation
        if (selectedSkladId == null) {
            newErrors.sklad = 'Skladni tanlang (majburiy)';
        }

        // Quantity validation
        if (!quantity || qty <= 0 || isNaN(qty)) {
            newErrors.quantity = "Miqdor 0 dan katta bo'lishi kerak";
        }

        // Price validation
        if (!price || priceValue <= 0 || isNaN(priceValue)) {
            newErrors.price = "Summasi 0 dan katta bo'lishi kerak";
        }

        // Stock validation
        if (skladStockCount != null && qty > skladStockCount) {
            newErrors.stock = `Miqdor skladda qolgan sondan (${skladStockCount}) oshmasligi kerak`;
        }

        // Agar errorlar bo'lsa, ko'rsatish va to'xtatish
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Errorlar yo'q, tozalash va davom etish
        setErrors({});

        // Agar currency USD bo'lsa, UZS ga konvertatsiya qilish
        const priceInSum = selectedCurrency?.code === 'USD' ? priceValue * exchangeRate : priceValue;
        onConfirm(qty, priceInSum, 'unit', {
            skladId: Number(selectedSkladId),
        });
        onClose();
    };

    const priceValue = parseFloat(price) || 0;
    const priceInSum = selectedCurrency?.code === 'USD' ? priceValue * exchangeRate : priceValue;
    const total = parseFloat(quantity) * priceInSum;
    const currencyCode = selectedCurrency?.code || 'UZS';

    return (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-2 border-indigo-200'>
                <div className='flex justify-between items-center p-5 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50'>
                    <div className='flex-1'>
                        <h3 className='text-xl font-bold text-gray-900 mb-2'>{product.name}</h3>
                        {/* Mahsulot ma'lumotlari */}
                        <div className='flex flex-wrap gap-3 text-sm text-gray-600'>
                            {product.branchCategoryName && (
                                <div className='flex items-center gap-1'>
                                    <span className='font-semibold text-indigo-600'>Kategoriya:</span>
                                    <span>{product.branchCategoryName}</span>
                                </div>
                            )}
                            {product.modelName && (
                                <div className='flex items-center gap-1'>
                                    <span className='font-semibold text-indigo-600'>Modeli:</span>
                                    <span>{product.modelName}</span>
                                </div>
                            )}
                            {product.typeName && (
                                <div className='flex items-center gap-1'>
                                    <span className='font-semibold text-indigo-600'>Model turi:</span>
                                    <span>{product.typeName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className='text-gray-500 hover:text-indigo-600 hover:bg-white p-2 rounded-xl transition-all duration-200 ml-4 shrink-0'
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className='p-6 bg-white'>

                    <div className='grid grid-cols-2 gap-5'>
                        {/* Sklad — majburiy */}
                        <div>
                            <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>Sklad</Label>
                            <Autocomplete
                                options={skladOptions}
                                value={selectedSkladId != null ? String(selectedSkladId) : ''}
                                onChange={(v) => {
                                    setSelectedSkladId(v ? Number(v) : null);
                                    if (errors.sklad) {
                                        setErrors((prev) => ({ ...prev, sklad: undefined }));
                                    }
                                }}
                                placeholder='Skladni qidirish...'
                                emptyMessage='Sklad topilmadi'
                            />
                            {errors.sklad && (
                                <p className='mt-1.5 text-sm font-medium text-red-600'>{errors.sklad}</p>
                            )}
                            {isLoadingStock && <p className='mt-1.5 text-xs text-indigo-500'>Qoldiq yuklanmoqda...</p>}
                            {!isLoadingStock && selectedSkladId != null && skladStockCount != null && (
                                <p className='mt-1.5 text-sm font-medium text-red-500'>
                                    Qoldiq soni: <span className='font-bold'>{skladStockCount.toLocaleString()}</span>
                                </p>
                            )}
                            {errors.stock && (
                                <p className='mt-1.5 text-sm font-medium text-red-600'>{errors.stock}</p>
                            )}
                        </div>
                        <div></div>

                        {/* Miqdori */}
                        <div>
                            <Label htmlFor='quantity' className='block text-xs text-indigo-600 mb-2 ml-1 font-semibold'>
                                Miqdori
                            </Label>
                            <div className={`flex rounded-xl shadow-lg overflow-hidden border-2 ${errors.quantity ? 'border-red-500' : 'border-indigo-200'}`}>
                                <Input
                                    id='quantity'
                                    type='number'
                                    value={quantity}
                                    onChange={(e) => {
                                        setQuantity(e.target.value);
                                        if (errors.quantity) {
                                            setErrors((prev) => ({ ...prev, quantity: undefined }));
                                        }
                                        if (errors.stock) {
                                            setErrors((prev) => ({ ...prev, stock: undefined }));
                                        }
                                    }}
                                    className='flex-1 block w-full rounded-l-xl border-0 sm:text-lg p-3 bg-white'
                                    autoFocus
                                />
                                <div className='flex justify-between text-sm text-gray-600 bg-indigo-50/50 px-3 py-2 min-w-[3rem] items-center'>
                                    {product?.unitCode ?? 'dona'}
                                </div>
                            </div>
                            {errors.quantity && (
                                <p className='mt-1.5 text-sm font-medium text-red-600'>{errors.quantity}</p>
                            )}
                        </div>

                        {/* Summasi */}
                        <div>
                            <Label htmlFor='price' className='block text-xs text-indigo-600 mb-2 ml-1 font-semibold'>
                                Summasi
                            </Label>
                            <div className={`flex rounded-xl shadow-lg overflow-hidden border-2 ${errors.price ? 'border-red-500' : 'border-indigo-200'}`}>
                                <Input
                                    id='price'
                                    type='number'
                                    step='0.01'
                                    value={price}
                                    onChange={(e) => {
                                        setPrice(e.target.value);
                                        if (errors.price) {
                                            setErrors((prev) => ({ ...prev, price: undefined }));
                                        }
                                    }}
                                    className='flex-1 block w-full rounded-l-xl border-0 sm:text-lg p-3 bg-white'
                                    placeholder={`Narx (${currencyCode})`}
                                />
                                <div className='flex justify-between text-sm text-gray-600 bg-indigo-50/50 px-3 py-2 min-w-[3rem] items-center'>
                                    {currencyCode}
                                </div>
                            </div>
                            {errors.price && (
                                <p className='mt-1.5 text-sm font-medium text-red-600'>{errors.price}</p>
                            )}
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
