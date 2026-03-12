import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { OrderResponse, ProductItem } from '../../types';
import { Input, Label } from '../ui/Input';
import NumberInput from '../ui/NumberInput';
import { Autocomplete } from '../ui/Autocomplete';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { formatMoney } from '../../lib/utils';

export interface ProductModalConfirmOptions {
    skladId: number;
    currencyId?: number;
    priceDollar?: number;
    priceSum?: number;
    vozvratOrderId?: number; // Vozvrat order ID (agar vozvrat order bo'lsa)
}

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductItem | null;
    exchangeRate: number;
    skladlar: { id: number; name: string }[];
    orderData?: OrderResponse | null;
    orderProductId?: number | null; // order-product-history id (tahrirlash uchun)
    isVozvratOrder?: boolean; // Vozvrat order uchun
    onConfirm: (quantity: number, priceInSum: number, options: ProductModalConfirmOptions) => void;
}
export function ProductModal({
    isOpen,
    onClose,
    product,
    exchangeRate,
    skladlar,
    orderData,
    orderProductId,
    isVozvratOrder = false,
    onConfirm,
}: ProductModalProps) {
    const [quantity, setQuantity] = useState<string>('');
    const [price, setPrice] = useState<string>('0');
    const [selectedSkladId, setSelectedSkladId] = useState<number | null>(null);
    const [skladStockCount, setSkladStockCount] = useState<number | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [errors, setErrors] = useState<{ sklad?: string; quantity?: string; price?: string; stock?: string }>({});

    // Statik valyutalar ro'yxati (API dan olmaydi)
    const staticCurrencies = [
        { id: 1, code: 'USD', name: 'US Dollar' },
        { id: 2, code: 'UZS', name: "O'zbek so'mi" },
    ];
    const [selectedCurrency, setSelectedCurrency] = useState<{ id: number; code: string; name: string }>(
        staticCurrencies[0],
    ); // Default USD
    const currencyCode = selectedCurrency.code;

    // Reset funksiyasi
    const resetForm = () => {
        setQuantity('');
        setPrice('0');
        setSelectedSkladId(null);
        setSkladStockCount(null);
        setSelectedProductId(null);
        setSelectedCurrency(staticCurrencies[0]);
        setErrors({});
    };

    // Modal yopilganda reset qilish
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    // Order-product-history dan default qiymatlarni yuklash (tahrirlash uchun)
    // Backend price_dollar va price_sum ni birlik narx sifatida saqlaydi
    useEffect(() => {
        if (orderProductId && isOpen) {
            orderService
                .getOrderProductById(orderProductId)
                .then((orderProduct) => {
                    const qty = Math.max(1, Number(orderProduct.count) || 1);
                    setQuantity(String(qty));
                    // API da price_dollar va price_sum = birlik narx
                    const perUnitDollar = parseFloat(orderProduct.price_dollar) || 0;
                    const perUnitSum = parseFloat(orderProduct.price_sum) || 0;
                    if (currencyCode === 'USD') {
                        setPrice(
                            perUnitDollar > 0 ? String(perUnitDollar) : perUnitSum > 0 ? String(perUnitSum / exchangeRate) : '0',
                        );
                    } else {
                        setPrice(perUnitSum > 0 ? String(perUnitSum) : perUnitDollar > 0 ? String(perUnitDollar * exchangeRate) : '0');
                    }

                    // Sklad
                    if (orderProduct.sklad != null) {
                        setSelectedSkladId(Number(orderProduct.sklad));
                    }

                    // Determine real product id from orderProduct response
                    const prodId =
                        (orderProduct.product && Number(orderProduct.product)) ||
                        (orderProduct.product_detail && Number(orderProduct.product_detail?.id)) ||
                        null;
                    if (prodId) setSelectedProductId(prodId);

                    setErrors({});
                })
                .catch((error) => {
                    console.error('Failed to load order product:', error);
                    // Xatolik bo'lsa ham default qiymatlarni o'rnatish
                    if (product) {
                        const defaultPrice = product.unit_price ?? 0;
                        setPrice(String(defaultPrice));
                        setQuantity('1');
                    }
                });
        } else if (product && !orderProductId && isOpen) {
            setQuantity('');
            setSelectedSkladId(null);
            setSkladStockCount(null);
            // If product prop contains actual product id (flat shape), use it
            const pid = (product as any)?.productId ?? (product as any)?.product ?? (product as any)?.id ?? null;
            if (pid) setSelectedProductId(Number(pid));
            setErrors({});
        }
    }, [product, orderProductId, isOpen, orderData, exchangeRate, currencyCode]);

    // Sklad tanlanganda /api/v1/product-stock/ dan qoldiqni olish
    useEffect(() => {
        // Determine product id to query for stock: prefer selectedProductId, fall back to product prop
        const productIdToQuery =
            selectedProductId ??
            (product ? ((product as any).productId ?? (product as any).product ?? (product as any).id) : null);
        if (!productIdToQuery || selectedSkladId == null) {
            setSkladStockCount(null);
            return;
        }
        setIsLoadingStock(true);
        productService
            .getProductStock({ product: Number(productIdToQuery), sklad: selectedSkladId })
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

    const parsedPrice = (() => {
        const raw = String(price || '');
        // remove non-breaking spaces, regular spaces, convert comma to dot, strip any non-numeric except dot and minus
        const cleaned = raw
            .replace(/\u00A0/g, '')
            .replace(/\s+/g, '')
            .replace(/,/g, '.')
            .replace(/[^0-9.\-]/g, '');
        const n = parseFloat(cleaned);
        return Number.isNaN(n) ? 0 : n;
    })();

    const handleConfirm = () => {
        const newErrors: { sklad?: string; quantity?: string; price?: string; stock?: string } = {};
        const qty = parseFloat(quantity);
        const priceValue = parsedPrice;

        // Sklad validation
        if (selectedSkladId == null) {
            newErrors.sklad = 'Skladni tanlang (majburiy)';
        }

        // Quantity validation
        if ((qty <= 0 || isNaN(qty)) && !isVozvratOrder) {
            newErrors.quantity = "Miqdor 0 dan katta bo'lishi kerak";
        }
        // Stock validation (faqat yangi qo'shishda yoki miqdorni oshirishda tekshirish)
        if (!isVozvratOrder && skladStockCount != null && qty > skladStockCount) {
            newErrors.stock = `Tanlangan skladda yetarli qoldiq yo'q (max ${skladStockCount})`;
        }

        // // Price validation
        // if (!price || priceValue <= 0 || isNaN(priceValue)) {
        //     newErrors.price = "Summasi 0 dan katta bo'lishi kerak";
        // }

        // Agar errorlar bo'lsa, ko'rsatish va to'xtatish
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Errorlar yo'q, tozalash va davom etish
        setErrors({});

        // Birlik narxlari (tanlangan valyuta bo'yicha)
        let priceDollarPerUnit = 0;
        let priceSumPerUnit = 0;
        if (selectedCurrency?.code === 'USD') {
            priceDollarPerUnit = priceValue;
            priceSumPerUnit = priceValue * exchangeRate;
        } else {
            priceSumPerUnit = priceValue;
            priceDollarPerUnit = priceValue / exchangeRate;
        }

        const priceInSum = selectedCurrency?.code === 'USD' ? priceValue * exchangeRate : priceValue;

        onConfirm(qty, priceInSum, {
            skladId: Number(selectedSkladId),
            currencyId: selectedCurrency?.id,
            // Backendga birlik narx yuboriladi
            priceDollar: parseFloat(priceDollarPerUnit.toFixed(2)),
            priceSum: parseFloat(priceSumPerUnit.toFixed(2)),
        });
        onClose();
    };

    // Jami summa - tanlangan currency'da
    const total = parseFloat(quantity || '0') * parsedPrice;

    return (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-indigo-200'>
                <div className='flex justify-between items-center p-2 sm:p-3 border-b border-indigo-100 bg-indigo-50'>
                    <div className='flex-1'>
                        {/* Mahsulot ma'lumotlari (support flat or nested product shapes) */}
                        <div className='flex flex-wrap gap-2 text-xs text-gray-600'>
                            {(product.branch_category_detail?.name || (product as any).branchCategoryName) && (
                                <div className='flex items-center gap-1'>
                                    <span className='font-semibold text-indigo-600'>Kategoriya:</span>
                                    <span>
                                        {product.branch_category_detail?.name ?? (product as any).branchCategoryName}
                                    </span>
                                </div>
                            )}
                            {(product.model_detail?.name || (product as any).modelName) && (
                                <div className='flex items-center gap-1'>
                                    <span className='font-semibold text-indigo-600'>Modeli:</span>
                                    <span>{product.model_detail?.name ?? (product as any).modelName}</span>
                                </div>
                            )}
                            {(product.type_detail?.name || (product as any).typeName) && (
                                <div className='flex items-center gap-1'>
                                    <span className='font-semibold text-indigo-600'>Model turi:</span>
                                    <span>{product.type_detail?.name ?? (product as any).typeName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        className='text-gray-500 hover:text-indigo-600 hover:bg-white p-1.5 rounded-lg transition-all duration-200 ml-2 shrink-0'
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className='p-3 bg-white'>
                    <div className='grid grid-cols-2 gap-3'>
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
                            {errors.sklad && <p className='mt-1 text-xs font-medium text-red-600'>{errors.sklad}</p>}
                            {isLoadingStock && <p className='mt-1 text-xs text-indigo-500'>Qoldiq yuklanmoqda...</p>}
                            {!isLoadingStock && selectedSkladId != null && skladStockCount != null && (
                                <p className='mt-1 text-xs font-medium text-red-500'>
                                    Qoldiq soni: <span className='font-bold'>{skladStockCount.toLocaleString()}</span>
                                </p>
                            )}
                            {errors.stock && <p className='mt-1 text-xs font-medium text-red-600'>{errors.stock}</p>}
                        </div>
                        {/* Currency selector - statik */}
                        <div>
                            <Label className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>Valyuta</Label>
                            <Autocomplete
                                options={staticCurrencies.map((c) => ({
                                    id: String(c.id),
                                    label: `${c.name} (${c.code})`,
                                    value: String(c.id),
                                }))}
                                value={selectedCurrency?.id?.toString() || ''}
                                onChange={(v) => {
                                    const currencyId = v ? parseInt(v) : null;
                                    const currency = staticCurrencies.find((c) => c.id === currencyId);
                                    if (currency) {
                                        setSelectedCurrency(currency);
                                    }
                                }}
                                placeholder='Valyuta tanlang...'
                                emptyMessage='Valyuta topilmadi'
                            />
                        </div>

                        {/* Miqdori */}
                        <div>
                            <Label htmlFor='quantity' className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                Miqdori
                            </Label>
                            <div
                                className={`flex rounded-lg overflow-hidden border ${errors.quantity ? 'border-red-500' : 'border-indigo-200'}`}
                            >
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
                                    className='flex-1 block w-full rounded-l-lg border-0 text-sm p-2 bg-white'
                                    autoFocus
                                />
                                <div className='flex justify-between text-xs text-gray-600 bg-indigo-50/50 px-2 py-1.5 min-w-[3rem] items-center'>
                                    {product?.size_detail?.unit_code ??
                                        (product as any).unitCode ??
                                        (product as any).unit ??
                                        'dona'}
                                </div>
                            </div>
                            {errors.quantity && (
                                <p className='mt-1 text-xs font-medium text-red-600'>{errors.quantity}</p>
                            )}
                        </div>

                        {/* Summasi */}
                        <div>
                            <Label htmlFor='price' className='block text-xs text-indigo-600 mb-1 ml-1 font-semibold'>
                                Summasi (birlik summa)
                            </Label>
                            <div
                                className={`flex rounded-lg overflow-hidden border ${errors.price ? 'border-red-500' : 'border-indigo-200'}`}
                            >
                                <NumberInput
                                    value={price}
                                    onChange={(val) => {
                                        setPrice(val);
                                        if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
                                    }}
                                    allowDecimal={true}
                                    placeholder={`Narx (${currencyCode})`}
                                    className='flex-1 block w-full rounded-l-lg border-0 text-sm p-2 bg-white'
                                />
                                <div className='flex justify-between text-xs text-gray-600 bg-indigo-50/50 px-2 py-1.5 min-w-[3rem] items-center'>
                                    {currencyCode}
                                </div>
                            </div>
                            {errors.price && <p className='mt-1 text-xs font-medium text-red-600'>{errors.price}</p>}
                        </div>
                    </div>

                    {/* Jami summa */}
                    <div className='mt-3 bg-emerald-50 p-2 rounded-lg border border-emerald-200'>
                        <div className='flex justify-between items-center'>
                            <span className='text-xs font-medium text-emerald-700'>Jami:</span>
                            <span className='text-base font-bold text-emerald-900'>
                                {formatMoney(total)} {currencyCode}
                            </span>
                        </div>
                    </div>

                    <div className='flex justify-between items-center pt-2'>
                        <button
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                            className='h-7 px-3 rounded-lg border border-indigo-200 bg-white text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors'
                        >
                            Yopish
                        </button>
                        <button
                            onClick={handleConfirm}
                            className='h-7 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-xs flex items-center shadow-md hover:shadow-lg transition-all duration-200'
                        >
                            <span className='mr-1.5'>✓</span> SAQLASH
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
